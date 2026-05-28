import React, { useState, useRef } from 'react';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/axios';
import { Camera } from 'lucide-react';

// Helper: get initials from a name string
const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

// Helper: resolve full image URL (backend serves from /api/uploads/...)
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Strip leading slash if present, then prepend base URL
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5020'}${path}`;
};

const Profile = () => {
  const { user, getMe } = useAuthStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || '',
  });

  const [passData, setPassData] = useState({
    passwordCurrent: '',
    password: '',
    passwordConfirm: '',
  });

  // Profile image state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState('');
  const [passStatus, setPassStatus] = useState('');

  // ── Image picker ──────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── Update profile info (+ optional image) ───────────────────────────────
  const handleUpdateMe = async (e) => {
    e.preventDefault();
    try {
      const body = new FormData();
      body.append('name', formData.name);
      body.append('age', formData.age);
      if (imageFile) body.append('profileImage', imageFile);

      await api.patch('/v1/users/updateMe', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await getMe();
      setImageFile(null);
      setImagePreview(null);
      setStatus('Profile updated successfully!');
    } catch (err) {
      setStatus('Error updating profile: ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Update password ───────────────────────────────────────────────────────
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

  // Resolved avatar to show (preview > saved image > null)
  const currentImage = imagePreview || getImageUrl(user?.profileImage);
  const initials = getInitials(user?.name || formData.name);

  return (
    <div className="animate-fade-in flex-col gap-6" style={{ display: 'flex', maxWidth: '800px' }}>
      <h1 className="text-2xl" style={{ fontWeight: '700' }}>Profile Settings</h1>

      {/* ── Avatar + Personal Info ─────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Update Personal Info</h2>

        {/* Avatar picker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.75rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change profile photo"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(139,92,246,0.5)',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.2s',
              }}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                  {initials}
                </span>
              )}
              {/* Overlay */}
              <span style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
                color: '#fff',
                borderRadius: '50%',
              }}
                className="avatar-btn-overlay"
              >
                <Camera size={22} />
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>
        </div>

        {status && (
          <p style={{
            color: status.includes('success') ? 'var(--success)' : 'var(--error)',
            marginBottom: '1rem',
          }}>
            {status}
          </p>
        )}

        <form onSubmit={handleUpdateMe} className="flex-col gap-4" style={{ display: 'flex' }}>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="number"
              className="input-field"
              placeholder="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>
            Save Changes
          </button>
        </form>
      </div>

      {/* ── Update Password ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Update Password</h2>
        {passStatus && (
          <p style={{
            color: passStatus.includes('success') ? 'var(--success)' : 'var(--error)',
            marginBottom: '1rem',
          }}>
            {passStatus}
          </p>
        )}
        <form onSubmit={handleUpdatePassword} className="flex-col gap-4" style={{ display: 'flex' }}>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              placeholder="Current Password"
              value={passData.passwordCurrent}
              onChange={(e) => setPassData({ ...passData, passwordCurrent: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              placeholder="New Password"
              value={passData.password}
              onChange={(e) => setPassData({ ...passData, password: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              placeholder="Confirm Password"
              value={passData.passwordConfirm}
              onChange={(e) => setPassData({ ...passData, passwordConfirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content' }}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
