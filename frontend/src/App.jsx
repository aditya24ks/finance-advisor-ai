import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Screener from './components/Screener';
import { Activity } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container fade-in">
      <header className="header">
        <h1>
          <Activity size={32} color="var(--accent-primary)" />
          Finance Advisor AI
        </h1>
        <div className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Single Stock
          </button>
          <button 
            className={`tab-btn ${activeTab === 'screener' ? 'active' : ''}`}
            onClick={() => setActiveTab('screener')}
          >
            Stock Screener
          </button>
        </div>
      </header>

      <main>
        {activeTab === 'dashboard' ? <Dashboard /> : <Screener />}
      </main>
    </div>
  );
}

export default App;
