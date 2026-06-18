import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getStats, resetStats, saveSettings } from './storage.js';
import { formatCO2 } from './co2-calculator.js';

function Popup() {
  const [stats, setStats] = useState(null);
  const [regionCode, setRegionCode] = useState('US');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getStats();
    setStats(data);
    setRegionCode(data.settings?.regionCode || 'US');
    setApiKey(data.settings?.electricityMapsApiKey || '');
  };

  const handleSaveSettings = async () => {
    await saveSettings({ regionCode, electricityMapsApiKey: apiKey });
    alert('Settings saved!');
    loadData();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all statistics?')) {
      await resetStats();
      loadData();
    }
  };

  if (!stats) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div className="header">
        <h1>🌿 Eco-LLM Proxy</h1>
      </div>

      <div className="card big-stat">
        <div className="label">Total CO2 Saved</div>
        <div className="value">{formatCO2(stats.totalCO2SavedGrams)}</div>
      </div>

      <div className="card">
        <h2 className="section-title">Today's Impact</h2>
        <div className="stat-row">
          <span className="stat-label">Locally Routed (Simple)</span>
          <span className="stat-value green">{stats.todayLocalQueries} queries</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Cloud Routed (Complex)</span>
          <span className="stat-value">{stats.todayCloudQueries} queries</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">CO2 Saved Today</span>
          <span className="stat-value green">{formatCO2(stats.todayCO2SavedGrams)}</span>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Settings</h2>
        <label className="stat-label">Grid Region</label>
        <select value={regionCode} onChange={(e) => setRegionCode(e.target.value)}>
          <option value="US">United States (Default)</option>
          <option value="FR">France (Low Carbon)</option>
          <option value="DE">Germany (Med Carbon)</option>
          <option value="IN">India (High Carbon)</option>
        </select>

        <label className="stat-label">Electricity Maps API Key (Optional)</label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)} 
          placeholder="Enter API Key"
        />
        
        <button onClick={handleSaveSettings}>Save Settings</button>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Decisions</h2>
        {stats.recentDecisions.slice(0, 3).map((d, i) => (
          <div key={i} className="recent-item">
            <span className={`route ${d.route}`}>{d.route.toUpperCase()}</span>
            <span> • {d.tokenCount} tokens • {d.taskType || 'query'}</span>
          </div>
        ))}
        {stats.recentDecisions.length === 0 && (
          <div className="stat-label">No recent queries.</div>
        )}
      </div>

      <button className="danger" onClick={handleReset}>Reset Statistics</button>

      <div className="citations">
        <h2 className="section-title" style={{ fontSize: '10px' }}>Research References</h2>
        <p>Estimates vary by hardware, data center, model size, and grid mix. This extension provides an educational estimate, not a certified carbon accounting result.</p>
        <ul>
          <li>Green AI / efficient NLP: arXiv 2404.01157</li>
          <li>DitchCarbon research: ChatGPT vs DistilBERT CO2 cost</li>
          <li>Electricity Maps API: Real-time grid carbon intensity</li>
        </ul>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Popup />);
