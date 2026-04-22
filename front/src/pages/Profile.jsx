import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';

const Profile = () => {
  const { user, getMe } = useAuthStore();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || ''
  });
  
  const [passData, setPassData] = useState({
    passwordCurrent: '',
    password: '',
    passwordConfirm: ''
  });

  const [status, setStatus] = useState('');
  const [passStatus, setPassStatus] = useState('');

  const handleUpdateMe = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/v1/users/updateMe', formData);
      await getMe();
      setStatus('Profile updated successfully!');
    } catch (err) {
      setStatus('Error updating profile: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch('/v1/users/updateMyPassword', passData);
      localStorage.setItem('token', res.data.token);
      setPassStatus('Password updated successfully!');
      setPassData({ passwordCurrent: '', password: '', passwordConfirm: '' });
    } catch (err) {
      setPassStatus(err.response?.data?.message || 'Error updating password');
    }
  };

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex', maxWidth: '800px' }}>
      <h1 className="text-2xl" style={{ fontWeight: '700' }}>Profile Settings</h1>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Update Personal Info</h2>
        {status && <p style={{ color: status.includes('success') ? 'var(--success)' : 'var(--error)', marginBottom: '1rem' }}>{status}</p>}
        <form onSubmit={handleUpdateMe} className="flex-col gap-4" style={{ display: 'flex' }}>
          <div className="input-group">
            <input type="text" className="input-field" placeholder="Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="input-group">
            <input type="number" className="input-field" placeholder="Age" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
        </form>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Update Password</h2>
        {passStatus && <p style={{ color: passStatus.includes('success') ? 'var(--success)' : 'var(--error)', marginBottom: '1rem' }}>{passStatus}</p>}
        <form onSubmit={handleUpdatePassword} className="flex-col gap-4" style={{ display: 'flex' }}>
          <div className="input-group">
            <input type="password" className="input-field" placeholder="Current Password" value={passData.passwordCurrent} onChange={(e) => setPassData({...passData, passwordCurrent: e.target.value})} required />
          </div>
          <div className="input-group">
            <input type="password" className="input-field" placeholder="New Password" value={passData.password} onChange={(e) => setPassData({...passData, password: e.target.value})} required />
          </div>
          <div className="input-group">
            <input type="password" className="input-field" placeholder="Confirm Password" value={passData.passwordConfirm} onChange={(e) => setPassData({...passData, passwordConfirm: e.target.value})} required />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
