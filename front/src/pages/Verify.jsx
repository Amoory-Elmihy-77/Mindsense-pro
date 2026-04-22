import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { LayoutDashboard, CheckCircle } from 'lucide-react';
import '../styles/auth.css';
import api from '../lib/axios';

const Verify = () => {
  const [code, setCode] = useState('');
  const [resendStatus, setResendStatus] = useState('');
  const { verify, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = new URLSearchParams(location.search).get('email') || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await verify(email, code);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleResend = async () => {
    try {
      setResendStatus('Sending...');
      await api.post('/v1/users/resendCode', { email });
      setResendStatus('Code resent successfully!');
    } catch (err) {
      setResendStatus(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel verify-card">
        <div className="auth-header text-center">
          <div className="auth-logo-wrapper text-success">
             <CheckCircle size={40} className="auth-logo text-success" style={{color: 'var(--success)'}} />
          </div>
          <h1>Verify Account</h1>
          <p className="text-muted text-sm mt-2">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {resendStatus && <div className="auth-success" style={{color: 'var(--success)', marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem'}}>{resendStatus}</div>}

        <form onSubmit={handleSubmit} className="auth-form flex-col gap-4 mt-4">
          <div className="verify-input-wrapper flex justify-center w-full">
            <input 
              type="text" 
              className="input-field verify-code-input text-center" 
              placeholder="------"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              style={{ letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading || code.length < 6}>
            {isLoading ? 'Verifying...' : (
              <>Verify & Continue <LayoutDashboard size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Didn't receive the code?{' '}
          <button type="button" onClick={handleResend} style={{background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500'}}>
            Resend it
          </button>
        </p>
      </div>
    </div>
  );
};

export default Verify;
