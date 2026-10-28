import React, { useState, useEffect } from 'react';
import { Bus, Terminal, Users, Gauge, Cpu, Bell, LogOut, Sparkles, Navigation, Clock, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenCopilot,
  onOpenNotifications,
  unreadNotifCount = 0,
  alertCount = 0,
  isConnected
}) {
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadgeClass = () => {
    if (!currentUser) return 'neo-tag-yellow';
    if (currentUser.role === 'admin') return 'neo-tag-yellow';
    if (currentUser.role === 'driver') return 'neo-tag-emerald';
    return 'neo-tag-cyan';
  };

  return (
    <nav className="neo-navbar">
      {/* Brand Section */}
      <div className="neo-brand-container">
        <div className="neo-brand-icon">
          <Bus size={20} color="#38bdf8" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="neo-brand-title">Navrachana Transit AI</span>
            <span className="neo-brand-badge">Vadodara</span>
          </div>
          <p className="neo-brand-sub">
            Real-Time AI Telematics & Campus Mobility Platform
          </p>
        </div>
      </div>

      {/* Role Navigation: Locked to logged-in role only */}
      {currentUser && currentUser.role === 'student' ? (
        <div className="neo-tab-group">
          <div className="neo-nav-tab active-cyan" style={{ cursor: 'default' }}>
            <Users size={14} />
            <span>Student Commuter Portal</span>
          </div>
        </div>
      ) : currentUser && currentUser.role === 'driver' ? (
        <div className="neo-tab-group">
          <div className="neo-nav-tab active-emerald" style={{ cursor: 'default' }}>
            <Gauge size={14} />
            <span>Driver Cockpit Terminal</span>
          </div>
        </div>
      ) : (
        /* Admin has full supervision and can inspect all 3 portals */
        <div className="neo-tab-group">
          <button
            type="button"
            className={`neo-nav-tab ${activeTab === 'admin' ? 'active-yellow' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Cpu size={14} />
            <span>AI Ops Center</span>
            {alertCount > 0 && (
              <span className="neo-badge-counter">{alertCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`neo-nav-tab ${activeTab === 'student' ? 'active-cyan' : ''}`}
            onClick={() => setActiveTab('student')}
          >
            <Users size={14} />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            className={`neo-nav-tab ${activeTab === 'driver' ? 'active-emerald' : ''}`}
            onClick={() => setActiveTab('driver')}
          >
            <Gauge size={14} />
            <span>Driver Simulator</span>
          </button>
        </div>
      )}

      {/* Action & Status Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Live System Time */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.72rem',
          color: '#94a3b8'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isConnected ? '#10b981' : '#f43f5e',
            boxShadow: isConnected ? '0 0 6px #10b981' : 'none'
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#cbd5e1' }}>{timeStr}</span>
        </div>

        {/* In-App Notification Bell */}
        <button
          type="button"
          className="neo-icon-btn"
          onClick={onOpenNotifications}
          title="Notification Center"
        >
          <Bell size={16} color="currentColor" />
          {unreadNotifCount > 0 && (
            <span className="neo-notif-dot">{unreadNotifCount}</span>
          )}
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Light and Dark Theme"
          id="navbar-theme-toggle"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* AI Copilot Launch Button (Admin Only) */}
        {currentUser && currentUser.role === 'admin' && (
          <button
            type="button"
            className="neo-btn neo-btn-purple"
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            onClick={onOpenCopilot}
          >
            <Terminal size={14} />
            <span>AI Copilot</span>
          </button>
        )}

        {/* User Identity Chip */}
        {currentUser && (
          <div className="neo-user-chip">
            <span className={`neo-tag ${getRoleBadgeClass()}`} style={{ fontSize: '0.66rem', padding: '2px 8px' }}>
              {currentUser.role.toUpperCase()}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#ffffff' }}>
              {currentUser.name ? currentUser.name.split(' ')[0] : 'User'}
            </span>
            {currentUser.rollNumber && (
              <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
                ({currentUser.rollNumber})
              </span>
            )}
          </div>
        )}

        {/* Logout / Switch User */}
        <button
          type="button"
          className="neo-btn-outline"
          style={{ padding: '6px 10px', fontSize: '0.76rem', gap: '5px' }}
          onClick={logout}
          title="Log out and return to portal gateway"
        >
          <LogOut size={13} />
          <span>Exit</span>
        </button>
      </div>
    </nav>
  );
}
