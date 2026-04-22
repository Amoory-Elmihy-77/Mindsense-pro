import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, KeyRound } from 'lucide-react';
import '../styles/auth.css';
import api from '../lib/axios';

const ResetPassword = () => {
  const [step, setStep] = useState(1); // 1: Verify Code, 2: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatus('');
    try {
      await api.post('/v1/users/verifyResetCode', { email, code });
      setStatus('Code verified. Enter your new password.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setStatus('');
    try {
      await api.patch('/v1/users/resetPassword', { email, code, newPassword });
      setStatus('Password reset successfully! Redirecting...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header text-center">
          <div className="auth-logo-wrapper">
             <KeyRound size={40} className="auth-logo" />
          </div>
          <h1>Reset Password</h1>
          <p className="text-muted text-sm mt-2">
            {step === 1 ? 'Enter your email and the reset code' : 'Create a new password'}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {status && <div className="auth-success" style={{color: 'var(--success)', marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem'}}>{status}</div>}

        {step === 1 ? (
          <form onSubmit={handleVerifyCode} className="auth-form flex-col gap-4 mt-4">
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
            <div className="input-group flex justify-center w-full">
              <input 
                type="text" 
                className="input-field text-center" 
                placeholder="6-digit Code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                style={{ letterSpacing: '8px', fontSize: '1.25rem', fontWeight: 'bold' }}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading || code.length < 6}>
              {isLoading ? 'Verifying...' : (
                <>Verify Code <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form flex-col gap-4 mt-4">
            <div className="input-group">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                className="input-field with-icon" 
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
              {isLoading ? 'Resetting...' : (
                <>Reset Password <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted mt-4">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
