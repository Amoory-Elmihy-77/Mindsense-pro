import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Activity, Smile, ArrowRight, Brain, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/axios';
import '../styles/dashboard.css';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: 0, color: entry.color, textTransform: 'capitalize' }}>
              {entry.name}: {entry.value} scan{entry.value !== 1 && 's'}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const [reportData, setReportData] = useState([]);
  const [uniqueEmotions, setUniqueEmotions] = useState([]);
  const [stats, setStats] = useState({ currentState: null, totalScans: 0, confidence: 0 });
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const historyRes = await api.get('/emotion/history?limit=100');
        const history = historyRes.data.data || [];
        
        const total = history.length;
        const current = history[0] || null;
        
        setStats({
          currentState: current ? current.state : 'None',
          confidence: current ? current.confidence : 0,
          totalScans: total,
        });

        if (current && current.state) {
           try {
             const adviceRes = await api.post('/intervention/', { state: current.state });
             const data = adviceRes.data;
             let finalAdvice = data;
             if (data && typeof data === 'object') {
               finalAdvice = data.advice || data.message || data.recommendations || data;
             }
             setAdvice(finalAdvice);
           } catch (e) {
             setAdvice("Keep up your daily reflections to receive personalized recommendations.");
           }
        } else {
           setAdvice("Take your first emotion scan to receive AI advice.");
        }

        // Build chart matching data by day
        const map = {};
        const emotionsSet = new Set();

        [...history].reverse().forEach(item => {
           const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
           if (!map[dateStr]) map[dateStr] = { name: dateStr };
           
           const state = item.state || 'Unknown';
           emotionsSet.add(state);
           map[dateStr][state] = (map[dateStr][state] || 0) + 1;
        });
        
        const chartArray = Object.values(map);
        setUniqueEmotions(Array.from(emotionsSet));
        setReportData(chartArray);

      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderAdviceContent = (adv) => {
    if (!adv) return null;
    if (typeof adv === 'string') return adv;
    if (adv.items && Array.isArray(adv.items)) {
       return <ul style={{ paddingLeft: '1.5rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{adv.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    }
    return JSON.stringify(adv, null, 2);
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: '700' }}>Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-muted mt-2">Here is your emotional wellness overview powered by real data.</p>
        </div>
        <Link to="/emotion" className="btn btn-primary" style={{ textDecoration: 'none' }}>
          <Smile size={18} /> New Emotion Scan
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
        </div>
      ) : (
        <>
          <div className="flex gap-6 mt-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between items-center">
                <h3 style={{ color: 'var(--text-secondary)' }}>Current State</h3>
                <div style={{ padding: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', color: 'var(--accent-primary)' }}>
                  <Smile size={24} />
                </div>
              </div>
              <div dir="auto">
                <span style={{ fontSize: '2rem', fontWeight: '700', textTransform: 'capitalize' }}>
                  {stats.currentState === 'None' ? 'No Scans Yet' : stats.currentState}
                </span>
                {stats.currentState !== 'None' && stats.confidence > 0 && (
                  <span className="text-success" style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {(stats.confidence * 100).toFixed(1)}% Confidence
                  </span>
                )}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="flex justify-between items-center">
                <h3 style={{ color: 'var(--text-secondary)' }}>Total Scans</h3>
                <div style={{ padding: '0.5rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '50%', color: 'var(--accent-secondary)' }}>
                  <Activity size={24} />
                </div>
              </div>
              <div>
                <span style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.totalScans}</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>On record</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>Emotion Timeline</h2>
            {reportData.length === 0 ? (
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-muted">Perform emotion scans to populate your timeline.</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <AreaChart data={reportData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      {uniqueEmotions.map((em, idx) => (
                        <linearGradient key={em} id={`color-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[idx % COLORS.length]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    {uniqueEmotions.map((em, idx) => (
                      <Area 
                        key={em} 
                        type="monotone" 
                        dataKey={em} 
                        stroke={COLORS[idx % COLORS.length]} 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill={`url(#color-${idx})`} 
                        stackId="1" 
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <div className="flex items-center gap-3 mb-4">
              <Brain size={24} color="var(--accent-primary)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>AI Intervention Advice</h2>
            </div>
            <div dir="auto" style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ lineHeight: '1.8', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                {renderAdviceContent(advice)}
              </div>
            </div>
            <Link to="/history" className="btn btn-secondary mt-6 w-full" style={{textDecoration: 'none'}}>
              View Detailed Reports <ArrowRight size={18} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
