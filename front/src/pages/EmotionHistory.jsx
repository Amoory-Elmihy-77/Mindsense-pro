import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Activity, Clock, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6'];

const EmotionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/emotion/history?limit=200');
        const data = res.data.data || [];
        setHistory(data);
        
        // Calculate emotion distributions
        const map = {};
        data.forEach(item => {
          const e = item.state || 'Unknown';
          map[e] = (map[e] || 0) + 1;
        });
        const chartData = Object.keys(map).map(k => ({ name: k, value: map[k] }));
        setPieData(chartData);
      } catch (err) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: payload[0].payload.fill, textTransform: 'capitalize' }} dir="auto">
            {payload[0].name}: {payload[0].value} scans
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLegendText = (value) => {
    return <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }} dir="auto">{value}</span>;
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
      <div>
        <h1 className="text-2xl" style={{ fontWeight: '700' }}>Analysis & Reports</h1>
        <p className="text-muted mt-2">View your authentic past emotional tracking history and graphical reports.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Graph Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon color="var(--accent-secondary)" /> Emotion Distribution
          </h2>
          
          {loading ? (
             <p className="text-muted">Loading authentic chart data...</p>
          ) : pieData.length === 0 ? (
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p className="text-muted">Not enough data to display chart.</p>
            </div>
          ) : (
             <div style={{ width: '100%', height: 350 }}>
               <ResponsiveContainer>
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={120}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <PieTooltip content={<CustomPieTooltip />} />
                   <Legend formatter={renderLegendText} verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             </div>
          )}
        </div>

        {/* History List Section */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--accent-primary)" /> Authentic Scan History
          </h2>
          
          {loading ? (
            <p className="text-muted">Loading timeline...</p>
          ) : history.length === 0 ? (
            <p className="text-muted">No emotion scans found. Try scanning your face or voice!</p>
          ) : (
            <div className="flex-col gap-4" style={{ display: 'flex', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {history.map((entry, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock className="text-muted" size={20} />
                    <div>
                      <p style={{ fontWeight: '600' }}>{new Date(entry.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      <p className="text-sm text-muted" style={{textTransform: 'capitalize'}} dir="auto">Detected: {entry.state} <span style={{color: 'var(--success)'}}>{entry.confidence ? `(${(entry.confidence*100).toFixed(1)}%)` : ''}</span></p>
                    </div>
                  </div>
                  <div style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', color: 'var(--accent-secondary)' }}>
                    {entry.source || 'Voice'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmotionHistory;
