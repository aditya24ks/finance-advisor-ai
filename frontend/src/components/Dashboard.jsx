import React, { useState, useEffect, useRef } from 'react';
import { analyzeStock, searchStocks } from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Search, TrendingUp, TrendingDown, Minus, Info, Globe, Briefcase } from 'lucide-react';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  
  // Search state
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsSearching(true);
        const results = await searchStocks(query);
        setSuggestions(results);
        setShowDropdown(true);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion.symbol);
    setSymbol(suggestion.symbol);
    setShowDropdown(false);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const finalSymbol = symbol || query;
    if (!finalSymbol) return;
    
    setLoading(true);
    setError('');
    setShowDropdown(false);
    
    try {
      const result = await analyzeStock(finalSymbol);
      setData(result);
      setSymbol(result.symbol);
      setQuery(result.symbol);
    } catch (err) {
      setError(`Failed to analyze stock "${finalSymbol}". Please try a different symbol from the suggestions.`);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="trend-up" />;
    if (change < 0) return <TrendingDown className="trend-down" />;
    return <Minus className="trend-neutral" />;
  };

  // Format currency in INR
  const formatINR = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `₹${(num / 1e12).toFixed(2)} Trillion`;
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)} Billion`;
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Crore`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="fade-in">
      {/* Search Bar */}
      <div className="card mb-4" style={{ position: 'relative', zIndex: 50 }} ref={dropdownRef}>
        <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: 1, position: 'relative' }}>
            <label htmlFor="symbol">Search Company Name or Symbol</label>
            <input 
              id="symbol"
              type="text" 
              className="form-control" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Tata Motors, Apple, MSFT"
              autoComplete="off"
            />
            {/* Suggestions Dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                marginTop: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 100
              }}>
                {isSearching ? (
                  <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Searching...</div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-color-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={{ fontWeight: '600' }}>{s.symbol}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s.name}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No results found</div>
                )}
              </div>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <div className="loading-spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></div> : <Search size={20} />}
            Analyze
          </button>
        </form>
      </div>

      {error && (
        <div className="card badge-danger mb-4" style={{ textAlign: 'center' }}>
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="fade-in">
          {/* Top Metrics */}
          <div className="dashboard-grid">
            <div className="card metric-card">
              <div className="metric-label">Current Price</div>
              <div className="metric-value">
                {formatINR(data.stock_data[data.stock_data.length - 1].close)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                {renderTrendIcon(data.stock_data[data.stock_data.length - 1].close - data.stock_data[0].close)}
                <span className={data.stock_data[data.stock_data.length - 1].close - data.stock_data[0].close >= 0 ? 'trend-up' : 'trend-down'}>
                  {(((data.stock_data[data.stock_data.length - 1].close - data.stock_data[0].close) / data.stock_data[0].close) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-label">AI Recommendation</div>
              <div className="metric-value" style={{ 
                color: data.recommendation === 'Buy' ? 'var(--success)' : 
                       data.recommendation === 'Sell' ? 'var(--danger)' : 'var(--warning)' 
              }}>
                {data.recommendation}
              </div>
            </div>

            <div className="card metric-card">
              <div className="metric-label">News Sentiment</div>
              <div className="metric-value">
                {data.news.length > 0 ? (
                  data.news.filter(n => n.sentiment === 'Positive').length > data.news.filter(n => n.sentiment === 'Negative').length 
                    ? <span className="trend-up">Positive</span> 
                    : <span className="trend-down">Negative</span>
                ) : 'Neutral'}
              </div>
              <div className="metric-label mt-2">
                {data.news.length} articles analyzed
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card mb-4">
            <h3 className="mb-4">Price History (30 Days - in INR)</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.stock_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-secondary)" 
                    tickFormatter={(tick) => {
                      const d = new Date(tick);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="var(--text-secondary)"
                    tickFormatter={(tick) => `₹${Math.round(tick)}`}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                    itemStyle={{ color: 'var(--accent-primary)' }}
                    formatter={(value) => [formatINR(value), 'Price']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="close" 
                    stroke="var(--accent-primary)" 
                    strokeWidth={3} 
                    dot={false}
                    activeDot={{ r: 8, fill: 'var(--accent-primary)', stroke: 'var(--bg-color)', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* News Sentiment Analysis */}
          <div className="card mb-4">
            <h3 className="mb-4">News Sentiment Analysis</h3>
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'center' }}>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Neutral', value: data.news.filter(n => n.sentiment === 'Neutral').length, color: '#3b82f6' },
                        { name: 'Positive', value: data.news.filter(n => n.sentiment === 'Positive').length, color: '#10b981' },
                        { name: 'Negative', value: data.news.filter(n => n.sentiment === 'Negative').length, color: '#ef4444' },
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                        return percent > 0 ? (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12">
                            {`${(percent * 100).toFixed(1)}%`}
                          </text>
                        ) : null;
                      }}
                    >
                      {
                        [
                          { name: 'Neutral', value: data.news.filter(n => n.sentiment === 'Neutral').length, color: '#3b82f6' },
                          { name: 'Positive', value: data.news.filter(n => n.sentiment === 'Positive').length, color: '#10b981' },
                          { name: 'Negative', value: data.news.filter(n => n.sentiment === 'Negative').length, color: '#ef4444' },
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingLeft: '2rem' }}>
                <div>
                  <div className="metric-label mb-2">Average Sentiment</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {(data.news.length > 0 ? (data.news.reduce((acc, curr) => acc + curr.sentiment_score, 0) / data.news.length) : 0).toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="metric-label mb-2">Positive Articles</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {data.news.filter(n => n.sentiment === 'Positive').length}
                  </div>
                </div>
                <div>
                  <div className="metric-label mb-2">Negative Articles</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    {data.news.filter(n => n.sentiment === 'Negative').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis & News */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div className="card">
              <h3 className="mb-4">AI Analysis (Groq)</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                {data.ai_analysis}
              </div>
            </div>

            {/* Company Info Card */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h3 className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} color="var(--accent-primary)"/> Company Overview
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {data.company_info?.longName || data.symbol}
                </div>
                <div className="badge badge-success" style={{ marginBottom: '1rem' }}>
                  {data.symbol}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Briefcase size={14}/> Sector & Industry
                  </div>
                  <div style={{ fontWeight: '500' }}>{data.company_info?.sector} • {data.company_info?.industry}</div>
                </div>
                
                <div>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Globe size={14}/> Market Cap
                  </div>
                  <div style={{ fontWeight: '500' }}>{formatLargeNumber(data.company_info?.marketCap)}</div>
                </div>
              </div>

              <div className="metric-label">Business Summary</div>
              <p style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)', 
                lineHeight: '1.6',
                display: '-webkit-box', 
                WebkitLineClamp: '6', 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden' 
              }}>
                {data.company_info?.longBusinessSummary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
