import React, { useEffect, useState, useMemo } from 'react';
import useAnalyticsStore from '../store/useAnalyticsStore';
import { 
  TrendingUp, TrendingDown, Activity, Brain, 
  AlertCircle, ChevronRight, Loader2, Sparkles, Target, 
  Calendar, CheckCircle2 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';
import '../styles/analytics.css';

const Analytics = () => {
  const { analysis, loading, error, fetchAnalysis } = useAnalyticsStore();
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalysis(timeRange);
  }, [timeRange, fetchAnalysis]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAnalysis(timeRange);
  };

  if (loading && !analysis) {
    return (
      <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin text-primary" size={48} color="var(--accent-primary)" />
        <p className="text-muted text-lg mt-4">Analyzing behavioral patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
        <div className="alert-banner declining">
          <AlertCircle className="alert-icon" />
          <div className="alert-content">
            <h4>Analysis Error</h4>
            <p>{error}</p>
            <button className="btn btn-secondary mt-3" onClick={handleRefresh}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="text-2xl" style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="var(--accent-primary)" /> Behavioral Analytics
          </h1>
          <p className="text-muted mt-2">AI-powered insights based on your emotional trends and tracking history.</p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <button 
            className={`btn ${timeRange === 'week' ? 'btn-primary' : ''}`} 
            style={{ padding: '0.5rem 1rem', background: timeRange === 'week' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: timeRange === 'week' ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => setTimeRange('week')}
          >
            Past Week
          </button>
          <button 
            className={`btn ${timeRange === 'month' ? 'btn-primary' : ''}`}
            style={{ padding: '0.5rem 1rem', background: timeRange === 'month' ? 'var(--accent-primary)' : 'transparent', border: 'none', color: timeRange === 'month' ? '#fff' : 'var(--text-secondary)' }}
            onClick={() => setTimeRange('month')}
          >
            Past Month
          </button>
        </div>
      </div>

      {/* Decline Alert Banner */}
      {analysis.trend === 'declining' && (
        <div className="alert-banner declining">
          <div className="alert-icon"><TrendingDown size={24} /></div>
          <div className="alert-content">
            <h4>Mood Decline Detected</h4>
            <p>We've noticed a downward trend in your emotional state recently. It's perfectly okay to have down days. Consider taking a break or trying a breathing exercise in the Games section.</p>
          </div>
        </div>
      )}

      {/* Improving Alert Banner */}
      {analysis.trend === 'improving' && (
        <div className="alert-banner improving">
          <div className="alert-icon"><TrendingUp size={24} /></div>
          <div className="alert-content">
            <h4>Positive Upward Trend!</h4>
            <p>Your emotional state has been steadily improving. Keep up your current routines and self-care habits—they are working!</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-bg-glow" style={{ background: '#8b5cf6' }}></div>
          <div className="kpi-title">
            <Target size={18} color="#8b5cf6" /> Dominant Emotion
          </div>
          <div className="kpi-value">{analysis.dominant_emotion}</div>
          <div className="text-muted text-sm">Most frequent state this {timeRange}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-bg-glow" style={{ background: analysis.trend === 'declining' ? '#ef4444' : analysis.trend === 'improving' ? '#10b981' : '#3b82f6' }}></div>
          <div className="kpi-title">
            {analysis.trend === 'declining' ? <TrendingDown size={18} color="#ef4444" /> : analysis.trend === 'improving' ? <TrendingUp size={18} color="#10b981" /> : <Activity size={18} color="#3b82f6" />}
            Overall Trend
          </div>
          <div className="kpi-value">{analysis.trend}</div>
          <div className="text-muted text-sm">Compared to historical average</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-bg-glow" style={{ background: '#ec4899' }}></div>
          <div className="kpi-title">
            <Calendar size={18} color="#ec4899" /> Critical Shifts
          </div>
          <div className="kpi-value">{analysis.critical_days?.length || 0}</div>
          <div className="text-muted text-sm">Sudden mood drops detected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Insights Panel */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Brain color="var(--accent-primary)" /> AI Behavioral Insights
          </h2>
          <div className="insights-list">
            {analysis.insights && analysis.insights.length > 0 ? (
              analysis.insights.map((insight, idx) => (
                <div key={idx} className="insight-item">
                  <CheckCircle2 className="insight-bullet" size={20} />
                  <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>{insight}</p>
                </div>
              ))
            ) : (
              <p className="text-muted">Not enough data to generate insights for this period.</p>
            )}
          </div>
        </div>

        {/* Critical Days & Prediction */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="prediction-card">
            <div className="prediction-header">
              <Sparkles color="#a78bfa" /> Tomorrow's Forecast
            </div>
            <p className="prediction-text">{analysis.prediction}</p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle color="var(--accent-secondary)" /> Critical Days
            </h2>
            {analysis.critical_days && analysis.critical_days.length > 0 ? (
              <div className="flex-col gap-3" style={{ display: 'flex' }}>
                {analysis.critical_days.map((day, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fca5a5' }}>
                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-sm text-muted mt-1">{day.shift}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(16, 185, 129, 0.2)' }}>
                <p style={{ color: '#10b981', margin: 0 }}>No critical mood drops detected in this period. Great job!</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Analytics;
