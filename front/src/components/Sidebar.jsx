import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Smile, Activity, Users, Settings, LogOut, Brain, Gamepad2, TrendingUp } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import '../styles/dashboard.css';

const Sidebar = () => {
  const { logout } = useAuthStore();

  const navItems = [
    { name: 'Overview',          path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Emotion Tracker',   path: '/emotion',   icon: <Smile size={20} /> },
    { name: 'Mind Games',        path: '/games',     icon: <Gamepad2 size={20} /> },
    { name: 'Behavioral Analytics', path: '/analytics', icon: <TrendingUp size={20} /> },
    { name: 'Analysis & Reports',path: '/history',   icon: <Activity size={20} /> },
    { name: 'Trusted Contacts',  path: '/contacts',  icon: <Users size={20} /> },
    { name: 'Profile Settings',  path: '/profile',   icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Brain size={28} className="sidebar-logo" />
        <h2>MindSense AI</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item text-error" onClick={logout} style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
