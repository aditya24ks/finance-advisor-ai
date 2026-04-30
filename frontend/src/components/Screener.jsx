import React, { useState } from 'react';
import { screenStocks } from '../api';
import { Filter, TrendingUp, TrendingDown, ChevronRight, X } from 'lucide-react';

const Screener = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedStockModal, setSelectedStockModal] = useState(null);
  const [criteria, setCriteria] = useState({
    min_sentiment: 0.0,
    min_price_change: -100.0,
    require_buy: true,
    stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX']
  });

  const handleScreen = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await screenStocks(criteria);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="card mb-4">
        <h2 className="mb-4 flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
          <Filter size={24} color="var(--accent-primary)" />
          Screening Criteria
        </h2>
        <form onSubmit={handleScreen}>
          <div className="screener-controls">
            <div className="input-group">
              <label>Minimum News Sentiment (-1 to 1)</label>
              <input 
                type="number" 
                step="0.1" 
                min="-1" max="1"
                className="form-control" 
                value={criteria.min_sentiment}
                onChange={(e) => setCriteria({...criteria, min_sentiment: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="input-group">
              <label>Min Price Change % (Last 30 Days)</label>
              <input 
                type="number" 
                step="1"
                className="form-control" 
                value={criteria.min_price_change}
                onChange={(e) => setCriteria({...criteria, min_price_change: parseFloat(e.target.value)})}
              />
            </div>

            <div className="input-group">
              <label>Only Show "Buy" Recommendations</label>
              <select 
                className="form-control"
                value={criteria.require_buy ? "yes" : "no"}
                onChange={(e) => setCriteria({...criteria, require_buy: e.target.value === "yes"})}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginBottom: '1.5rem', height: '42px' }}>
              {loading ? 'Screening...' : 'Run Screener'}
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Screening the following stocks: {criteria.stocks.join(', ')}
          </p>
        </form>
      </div>

      {loading && (
        <div className="flex-center" style={{ height: '200px', flexDirection: 'column', gap: '1rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Analyzing stocks using AI... This may take a moment.</p>
        </div>
      )}

      {results && !loading && (
        <div className="fade-in">
          <h3 className="mb-4">Found {results.length} Suitable Stocks</h3>
          
          {results.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No stocks match your strict criteria. Try lowering the requirements.</p>
            </div>
          ) : (
            <div className="screener-results">
              {results.map((stock) => (
                <div key={stock.symbol} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{stock.symbol}</h2>
                    <span className={`badge ${
                      stock.recommendation === 'Buy' ? 'badge-success' : 
                      stock.recommendation === 'Sell' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {stock.recommendation}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                      <div className="metric-label">Price (INR)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{stock.latest_price.toLocaleString('en-IN', {maximumFractionDigits:2})}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="metric-label">30d Change</div>
                      <div className={stock.price_change >= 0 ? 'trend-up' : 'trend-down'} style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {stock.price_change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {stock.price_change.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedStockModal(stock)}
                    style={{ 
                      background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem',
                      cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div className="metric-label" style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      AI Snapshot
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>Click to read more</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {stock.ai_analysis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for full AI Snapshot */}
      {selectedStockModal && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setSelectedStockModal(null)}
        >
          <div 
            className="card fade-in"
            style={{
              maxWidth: '600px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
              position: 'relative', cursor: 'default', border: '1px solid var(--border-color)'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedStockModal(null)}
              style={{ 
                position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', 
                color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={24} />
            </button>
            <h2 className="mb-4" style={{ paddingRight: '2rem' }}>AI Analysis: {selectedStockModal.symbol}</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div className="metric-label">Current Price</div>
                <div style={{ fontWeight: '600' }}>₹{selectedStockModal.latest_price.toLocaleString('en-IN', {maximumFractionDigits:2})}</div>
              </div>
              <div>
                <div className="metric-label">Recommendation</div>
                <span className={`badge ${
                  selectedStockModal.recommendation === 'Buy' ? 'badge-success' : 
                  selectedStockModal.recommendation === 'Sell' ? 'badge-danger' : 'badge-warning'
                }`}>
                  {selectedStockModal.recommendation}
                </span>
              </div>
            </div>

            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1rem' }}>
              {selectedStockModal.ai_analysis}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Screener;
