import React, { useEffect } from 'react';
import useGameStore from '../store/useGameStore';

const ICONS = {
  streak:     '🔥',
  level_up:   '⬆️',
  inactivity: '💭',
  info:       'ℹ️',
};

const COLORS = {
  streak:     '#f97316',
  level_up:   '#8b5cf6',
  inactivity: '#06b6d4',
  info:       '#10b981',
};

export default function GameNotification() {
  const { notifications, dismissNotification } = useGameStore();

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (notifications.length === 0) return;
    const oldest = notifications[0];
    const age = Date.now() - oldest.timestamp;
    const delay = Math.max(0, 5000 - age);
    const t = setTimeout(() => dismissNotification(oldest.id), delay);
    return () => clearTimeout(t);
  }, [notifications, dismissNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="game-notifications">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="game-toast"
          style={{ '--toast-color': COLORS[n.type] || COLORS.info }}
          onClick={() => dismissNotification(n.id)}
        >
          <span className="toast-icon">{ICONS[n.type] || '✨'}</span>
          <span className="toast-message">{n.message}</span>
          <button className="toast-close" onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}>×</button>
        </div>
      ))}
    </div>
  );
}
