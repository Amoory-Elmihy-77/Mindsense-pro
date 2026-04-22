import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Brain } from 'lucide-react';
import '../styles/auth.css';
import api from '../lib/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatus('');
    try {
      await api.post('/v1/users/forgotPassword', { email });
      setStatus('Password reset code sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header text-center">
          <div className="auth-logo-wrapper">
             <Brain size={40} className="auth-logo" />
          </div>
          <h1>Forgot Password</h1>
          <p className="text-muted text-sm mt-2">Enter your email to receive a reset code</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {status && <div className="auth-success" style={{color: 'var(--success)', marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem'}}>{status}</div>}

        <form onSubmit={handleSubmit} className="auth-form flex-col gap-4 mt-4">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input 
              type="email" 
              className="input-field with-icon" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Sending...' : (
              <>Send Reset Code <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Remembered your password? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
