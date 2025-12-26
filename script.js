// Konstanten für Physik
const C_W = 4.18; // J/(g*K) Wasser
const C_ICE = 2.1; // J/(g*K) Eis
const L_F = 334;   // J/g Schmelzwärme

// DOM Elemente cachen
const els = {
    vol: document.getElementById('vol'),
    t_target: document.getElementById('t_target'),
    t_hot: document.getElementById('t_hot'),
    method: document.getElementById('method'),
    t_cold_ice: document.getElementById('t_cold_ice'),
    t_cold_water: document.getElementById('t_cold_water'),
    iceGroup: document.getElementById('ice-temp-group'),
    waterGroup: document.getElementById('water-temp-group'),
    resHot: document.getElementById('res_hot'),
    resCold: document.getElementById('res_cold'),
    resTotal: document.getElementById('res_total'),
    resTypeText: document.getElementById('res_type_text'),
    log: document.getElementById('formula-log')
};

// Event Listener für alle Inputs
[els.vol, els.t_target, els.t_hot, els.t_cold_ice, els.t_cold_water].forEach(el => {
    el.addEventListener('input', calculate);
});

els.method.addEventListener('change', () => {
    toggleMethod();
    calculate();
});

function toggleMethod() {
    if(els.method.value === 'ice') {
        els.iceGroup.classList.remove('hidden');
        els.waterGroup.classList.add('hidden');
        els.resTypeText.innerText = "2. Eiswürfel";
    } else {
        els.iceGroup.classList.add('hidden');
        els.waterGroup.classList.remove('hidden');
        els.resTypeText.innerText = "2. Kaltes Wasser";
    }
}

function calculate() {
    // Werte parsen (Fallback auf 0 um NaN zu vermeiden)
    const V_total = parseFloat(els.vol.value) || 0;
    const T_target = parseFloat(els.t_target.value) || 0;
    const T_hot = parseFloat(els.t_hot.value) || 0;
    const method = els.method.value;
    
    let m_hot = 0, m_cold = 0;
    let logHTML = "";

    if (method === 'water') {
        // --- WASSER LOGIK ---
        const T_cold = parseFloat(els.t_cold_water.value) || 0;
        
        const delta_hot = T_hot - T_target;
        const delta_cold = T_target - T_cold;
        
        // Division durch Null verhindern
        if ((delta_hot + delta_cold) !== 0) {
            m_hot = V_total * delta_cold / (delta_hot + delta_cold);
            m_cold = V_total - m_hot;
        }

        logHTML += createStepLog("1. Temperatur-Differenzen", 
            `ΔT_heiß = ${T_hot} - ${T_target} = <span class='highlight'>${delta_hot.toFixed(1)} K</span>`,
            `ΔT_kalt = ${T_target} - ${T_cold} = <span class='highlight'>${delta_cold.toFixed(1)} K</span>`
        );

        logHTML += createStepLog("2. Mischung berechnen", 
            `Formel: V_ges * ΔT_kalt / (ΔT_heiß + ΔT_kalt)`,
            `m_heiß = ${V_total} * ${delta_cold.toFixed(1)} / ${(delta_hot + delta_cold).toFixed(1)}`,
            `m_heiß = <span class='highlight'>${m_hot.toFixed(1)} g</span>`
        );

    } else {
        // --- EIS LOGIK ---
        const T_ice_start = parseFloat(els.t_cold_ice.value) || 0;

        const E_loss_tea_per_g = C_W * (T_hot - T_target);
        
        // Energieaufnahme Eis
        const E_warmup_ice = C_ICE * Math.abs(T_ice_start - 0); // Delta T bis 0
        const E_melting = L_F;
        const E_warmup_water = C_W * (T_target - 0); // Delta T von 0 bis Ziel
        const E_gain_ice_per_g = E_warmup_ice + E_melting + E_warmup_water;

        if ((E_gain_ice_per_g + E_loss_tea_per_g) !== 0) {
            const m_ice = V_total * E_loss_tea_per_g / (E_gain_ice_per_g + E_loss_tea_per_g);
            m_hot = V_total - m_ice;
            m_cold = m_ice;
        }

        logHTML += createStepLog("1. Energiebilanz Tee (Abgabe)",
            `Pro Gramm: 4.18 * (${T_hot} - ${T_target})`,
            `= <span class='highlight'>${E_loss_tea_per_g.toFixed(1)} J/g</span>`
        );

        logHTML += createStepLog("2. Energiebilanz Eis (Aufnahme)",
            `a) Aufwärmen: ${E_warmup_ice.toFixed(1)} J`,
            `b) Schmelzen: <b>${E_melting} J</b>`,
            `c) Erwärmen: ${E_warmup_water.toFixed(1)} J`,
            `Summe: <span class='highlight'>${E_gain_ice_per_g.toFixed(1)} J/g</span>`
        );

        const ratio = E_loss_tea_per_g > 0 ? (E_loss_tea_per_g / E_gain_ice_per_g) : 0;
        
        logHTML += createStepLog("3. Ergebnis",
            `Verhältnis Tee:Eis ≈ ${ratio.toFixed(2)}:1`,
            `Eis-Menge: <span class='highlight'>${m_cold.toFixed(1)} g</span>`
        );
    }

    // UI Update
    els.resHot.innerText = Math.round(m_hot);
    els.resCold.innerText = Math.round(m_cold);
    els.resTotal.innerText = Math.round(m_hot + m_cold);
    els.log.innerHTML = logHTML;
}

function createStepLog(title, ...rows) {
    return `<div class='step'>
                <div class='step-title'>${title}</div>
                ${rows.map(r => `<div class='math-row'>${r}</div>`).join('')}
            </div>`;
}

// Initialer Start
calculate();
