import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { Globe, Award, Activity, Compass, ShieldCheck, Layers, Zap } from 'lucide-react';
import './index.css';

function App() {
  const API_BASE = "http://localhost:8000";

  const [info, setInfo] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  const [inputs, setInputs] = useState({
    country: "Bolivia",
    ntl: 15.0,
    infrastructure_gap: 0.35,
    urban_ratio: 0.40,
    biome_similarity: 0.90
  });

  const [prediction, setPrediction] = useState({
    target_country: "Bolivia",
    predicted_wealth_index: 0.650,
    transfer_r2_score: 0.610,
    domain_shift: "Bajo (Alta Confianza)",
    risk_color: "#7c3aed"
  });

  useEffect(() => {
    fetchInfo();
    fetchPresets();
  }, []);

  const fetchInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/info`);
      if (res.ok) {
        setInfo(await res.json());
        setApiConnected(true);
      }
    } catch {
      setApiConnected(false);
      setInfo({
        title: "Cross-LOCO",
        country_results: [
          { country: "Bolivia 🇧🇴", r2: 0.610, pearson_r: 0.780 },
          { country: "Perú 🇵🇪", r2: 0.620, pearson_r: 0.790 },
          { country: "Nigeria 🇳🇬", r2: 0.420, pearson_r: 0.580 },
          { country: "Etiopía 🇪🇹", r2: 0.380, pearson_r: 0.520 },
          { country: "Malawi 🇲🇼", r2: 0.340, pearson_r: 0.480 },
          { country: "Uganda 🇺🇬", r2: 0.280, pearson_r: 0.420 }
        ]
      });
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/presets`);
      if (res.ok) setPresets(await res.json());
    } catch {
      setPresets([
        { name: "Bolivia 🇧🇴", values: { country: "Bolivia", ntl: 15.0, infrastructure_gap: 0.35, urban_ratio: 0.40, biome_similarity: 0.90 } },
        { name: "Nigeria 🇳🇬", values: { country: "Nigeria", ntl: 28.0, infrastructure_gap: 0.60, urban_ratio: 0.55, biome_similarity: 0.45 } },
        { name: "Uganda 🇺🇬", values: { country: "Uganda", ntl: 3.5, infrastructure_gap: 0.75, urban_ratio: 0.20, biome_similarity: 0.38 } }
      ]);
    }
  };

  const handleInputChange = (field, val) => {
    const num = Number(val);
    const parsedVal = (isNaN(num) || (typeof val === 'string' && val.trim() === '')) ? val : num;
    setInputs(prev => ({ ...prev, [field]: parsedVal }));
  };

  const selectCountry = (countryName) => {
    const found = presets.find(p => p.name.includes(countryName));
    if (found) {
      setInputs(prev => ({ ...prev, ...found.values }));
      handlePredict({ ...inputs, ...found.values });
    } else {
      handleInputChange('country', countryName);
    }
  };

  const handlePredict = async (currentInputs = inputs) => {
    setLoadingPredict(true);
    try {
      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentInputs)
      });
      if (res.ok) setPrediction(await res.json());
    } catch {
      const r2 = Math.min(0.78, Math.max(0.18, 0.65 * currentInputs.biome_similarity - 0.15 * currentInputs.infrastructure_gap));
      setPrediction({
        target_country: currentInputs.country,
        predicted_wealth_index: 0.450,
        transfer_r2_score: parseFloat(r2.toFixed(3)),
        domain_shift: currentInputs.biome_similarity > 0.75 ? "Bajo (Alta Confianza)" : "Alto (Riesgo OOD)",
        risk_color: r2 > 0.50 ? "#7c3aed" : "#ef4444"
      });
    } finally {
      setLoadingPredict(false);
    }
  };

  const countries = [
    { name: "Bolivia", flag: "🇧🇴", region: "Andino" },
    { name: "Perú", flag: "🇵🇪", region: "Andino" },
    { name: "Nigeria", flag: "🇳🇬", region: "África Occ." },
    { name: "Uganda", flag: "🇺🇬", region: "África Ori." },
    { name: "Etiopía", flag: "🇪🇹", region: "Cuerno África" },
    { name: "Malawi", flag: "🇲🇼", region: "África Sudori." }
  ];

  return (
    <div className="loco-container">
      {/* HEADER */}
      <header className="loco-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#7c3aed', padding: 8, borderRadius: 10, color: '#fff' }}><Globe size={22} /></div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Cross-LOCO — Generalización Transnacional</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Pruebas Leave-One-Country-Out OOD en 6 Países</p>
          </div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          PRACTICA 13
        </div>
      </header>

      {/* COUNTRY SELECTOR GRID */}
      <div className="country-grid-select">
        {countries.map((c, idx) => (
          <div 
            key={idx} 
            className={`country-card-btn ${inputs.country === c.name ? 'active' : ''}`}
            onClick={() => selectCountry(c.name)}
          >
            <div style={{ fontSize: 28 }}>{c.flag}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{c.region}</div>
          </div>
        ))}
      </div>

      {/* 2X2 ANALYTICS GRID */}
      <div className="loco-grid-2x2">
        {/* BAR CHART TRANSFER SCORES */}
        <div className="loco-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={16} color="var(--primary-light)" /> Transferibilidad R² por País Held-Out
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={info?.country_results || [
                { country: "Bolivia", r2: 0.610 },
                { country: "Perú", r2: 0.620 },
                { country: "Nigeria", r2: 0.420 },
                { country: "Etiopía", r2: 0.380 },
                { country: "Malawi", r2: 0.340 },
                { country: "Uganda", r2: 0.280 }
              ]}>
                <XAxis dataKey="country" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 1]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b' }} />
                <Bar dataKey="r2" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DOMAIN SHIFT RADAR */}
        <div className="loco-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={16} color="var(--primary-light)" /> Perfil de Domain Shift (OOD Index)
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { subject: 'Bioma', value: inputs.biome_similarity * 100 },
                { subject: 'Electrificación', value: inputs.ntl * 2 },
                { subject: 'Brecha Infr.', value: inputs.infrastructure_gap * 100 },
                { subject: 'Urbano', value: inputs.urban_ratio * 100 }
              ]}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                <Radar name="Shift" dataKey="value" stroke="#a855f7" fill="#7c3aed" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="loco-card">
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Ajuste de Parámetros Transnacionales</div>
          
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Similitud de Bioma: {(inputs.biome_similarity * 100).toFixed(0)}%</div>
            <input type="range" className="range-slider" min="0.2" max="1.0" step="0.05" value={inputs.biome_similarity} onChange={(e) => handleInputChange('biome_similarity', e.target.value)} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Brecha Infraestructura: {(inputs.infrastructure_gap * 100).toFixed(0)}%</div>
            <input type="range" className="range-slider" min="0.1" max="0.9" step="0.05" value={inputs.infrastructure_gap} onChange={(e) => handleInputChange('infrastructure_gap', e.target.value)} />
          </div>

          <button className="btn-purple" onClick={() => handlePredict()} disabled={loadingPredict}>
            {loadingPredict ? "Evaluando..." : "🚀 Simular Transfer LOCO"}
          </button>
        </div>

        {/* PREDICTION SUMMARY CARD */}
        <div className="loco-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            Precisión de Transferencia Estimada
          </div>

          <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)', color: prediction.risk_color, margin: '10px 0' }}>
            R² = {prediction.transfer_r2_score.toFixed(3)}
          </div>

          <div style={{ background: `${prediction.risk_color}22`, color: prediction.risk_color, border: `1px solid ${prediction.risk_color}`, padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            Domain Shift: {prediction.domain_shift}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
