import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { Bell, Search } from 'lucide-react';
import '../styles/dashboard.css';

// Helper: resolve full image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5020'}${path}`;
};

const Topbar = () => {
  const { user } = useAuthStore();
  const currentImage = getImageUrl(user?.profileImage);

  return (
    <header className="topbar glass-panel">
      <div className="search-bar">
        <Search size={18} className="text-muted" />
        <input type="text" placeholder="Search..." className="search-input" />
      </div>

      <div className="topbar-actions flex items-center gap-4">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </button>
        
        <div className="user-profile flex items-center gap-2">
          {currentImage ? (
            <img src={currentImage} alt="Profile" className="avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          )}
          <div className="user-info">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-role text-xs text-muted">MindSense Member</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
