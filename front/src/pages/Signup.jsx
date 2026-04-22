import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, User, ArrowRight, Brain, Calendar } from 'lucide-react';
import '../styles/auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', passwordConfirm: '', age: ''
  });
  const { signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate(`/verify?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-card glass-panel signup-card">
        <div className="auth-header text-center">
          <div className="auth-logo-wrapper">
             <Brain size={40} className="auth-logo" />
          </div>
          <h1>Create Account</h1>
          <p className="text-muted text-sm mt-2">Join MindSense AI today</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form flex-col gap-4 mt-4">
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input type="text" name="name" className="input-field with-icon" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input type="email" name="email" className="input-field with-icon" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <Calendar className="input-icon" size={20} />
            <input type="number" name="age" className="input-field with-icon" placeholder="Age" min="1" value={formData.age} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input type="password" name="password" className="input-field with-icon" placeholder="Password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input type="password" name="passwordConfirm" className="input-field with-icon" placeholder="Confirm Password" value={formData.passwordConfirm} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Creating account...' : (
              <>Sign Up <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-4">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
