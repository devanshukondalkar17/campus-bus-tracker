import React, { useState } from 'react';
import {
  Shield, Bus, Users, Cpu, ArrowRight, KeyRound, Sparkles, AlertCircle,
  CheckCircle2, Lock, ChevronDown, ChevronUp, Radio, Navigation, Check,
  Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { playAlertChime } from '../utils/geoHelpers';

export default function NeobrutalistLoginGate({ onSelectRoleDirect }) {
  const { login, quickDemoLogin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [selectedRole, setSelectedRole] = useState('student');
  const [identifier, setIdentifier] = useState('NUV24CS001');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRosterReference, setShowRosterReference] = useState(false);

  // Instant direct entry into selected dashboard
  const handleDirectEnter = (role) => {
    if (quickDemoLogin) {
      quickDemoLogin(role);
      playAlertChime('DISPATCH');
    }
    if (onSelectRoleDirect) {
      onSelectRoleDirect(role);
    }
  };

  // Quick fill helper
  const handleQuickFill = (idVal, passVal, roleVal) => {
    setSelectedRole(roleVal);
    setIdentifier(idVal);
    setPassword(passVal);
    setError('');
  };

  const handleCardClick = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'student') {
      setIdentifier('NUV24CS001');
      setPassword('student123');
    } else if (role === 'driver') {
      setIdentifier('driver.ramesh@nuv.ac.in');
      setPassword('driver123');
    } else if (role === 'admin') {
      setIdentifier('admin@nuv.ac.in');
      setPassword('admin123');
    }

    const drawer = document.getElementById('auth-credential-form');
    if (drawer) {
      drawer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!identifier.trim() || !password.trim()) {
        throw new Error('Please enter both your ID and password.');
      }

      await login(identifier.trim(), password.trim());
      playAlertChime('DISPATCH');
    } catch (err) {
      playAlertChime('ALERT');
      setError(err.message || 'Invalid credentials. Please verify your ID and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-login-container" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px 80px',
      position: 'relative'
    }}>
      {/* Background Ambient Glows */}
      <div className="neo-login-glow" style={{
        position: 'fixed',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '650px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        width: '100%',
        maxWidth: '1160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        zIndex: 1
      }}>

        {/* Minimalist Top Status Pill */}
        <div className="neo-login-status-pill" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '8px 16px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.02em' }}>
              NAVRACHANA UNIVERSITY • VADODARA TRANSIT TELEMETRY SYSTEM
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="neo-tag neo-tag-cyan" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              VASNA-BHAYLI MAIN CAMPUS
            </span>
            <span className="neo-tag neo-tag-emerald" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              ENTERPRISE v2.4
            </span>
            {/* Theme Toggle Button */}
            <button
              type="button"
              className="theme-toggle-btn"
              style={{ width: '28px', height: '28px', padding: 0 }}
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Light and Dark Theme"
              id="login-theme-toggle"
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="neo-login-hero" style={{
          padding: '28px 32px',
          borderRadius: '20px',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle accent line at top */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #38bdf8 0%, #6366f1 50%, #10b981 100%)'
          }} />

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span className="neo-pill-badge neo-pill-cyan">
              Live Fleet Dispatch
            </span>
            <span className="neo-pill-badge">
              Vadodara City Commuters
            </span>
            <span className="neo-pill-badge neo-pill-purple">
              Role-Gated Portal
            </span>
          </div>

          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: '8px'
          }}>
            Campus Transit & Fleet Operations Portal
          </h1>
          <p style={{
            fontSize: '0.92rem',
            color: '#94a3b8',
            fontWeight: 400,
            maxWidth: '720px',
            lineHeight: 1.6
          }}>
            Select your account profile below to access real-time vehicle telematics, route schedules, cabin seat reservations, and intelligent dispatch tools.
          </p>
        </div>

        {/* 1-Click Instant Direct Access Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          borderRadius: '16px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 8px 24px -4px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              One-Click Direct Access to Live Operations Dashboard:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="neo-btn neo-btn-cyan"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => handleDirectEnter('student')}
            >
              🎓 Enter Student Commuter
            </button>
            <button
              type="button"
              className="neo-btn neo-btn-emerald"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => handleDirectEnter('driver')}
            >
              🚌 Enter Driver Cockpit
            </button>
            <button
              type="button"
              className="neo-btn neo-btn-yellow"
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              onClick={() => handleDirectEnter('admin')}
            >
              ⚡ Enter Admin Ops Center
            </button>
          </div>
        </div>

        {/* 3 Role Selection Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {/* Card 1: Student Commuter */}
          <div
            onClick={() => handleCardClick('student')}
            className={`neo-login-card neo-role-card neo-card-student ${selectedRole === 'student' ? 'selected-role' : ''}`}
            style={{
              padding: '24px',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Users size={22} />
              </div>
              <span className="neo-tag neo-tag-cyan" style={{ fontSize: '0.68rem' }}>
                200 ENROLLED
              </span>
            </div>

            <h3 className="neo-card-title" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Student Commuter
            </h3>
            <p className="neo-card-sub" style={{ fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '18px' }}>
              For students commuting from Sayajigunj, Alkapuri, Manjalpur, or Gotri corridors to the Bhayli campus.
            </p>

            <div className="neo-login-features-box" style={{
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#38bdf8" />
                <span>Live GPS Approach & ETA to Pickup Stop</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#38bdf8" />
                <span>2x2 Cabin Seat Map & Quick Reservation</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#38bdf8" />
                <span>"Travelling Today" Attendance Toggle</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                type="button"
                className="neo-btn neo-btn-cyan"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDirectEnter('student');
                }}
              >
                <span>Launch Student Dashboard</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '4px',
                  textDecoration: 'underline'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick('student');
                }}
              >
                Enter Custom Credentials
              </button>
            </div>
          </div>

          {/* Card 2: Shuttle Driver */}
          <div
            onClick={() => handleCardClick('driver')}
            className={`neo-login-card neo-role-card neo-card-driver ${selectedRole === 'driver' ? 'selected-role' : ''}`}
            style={{
              padding: '24px',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}>
                <Bus size={22} />
              </div>
              <span className="neo-tag neo-tag-emerald" style={{ fontSize: '0.68rem' }}>
                4 FLEET SHUTTLES
              </span>
            </div>

            <h3 className="neo-card-title" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Shuttle Pilot / Driver
            </h3>
            <p className="neo-card-sub" style={{ fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '18px' }}>
              For university shuttle operators controlling corridor trips, broadcasting GPS telemetry, and passenger boarding.
            </p>

            <div className="neo-login-features-box" style={{
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#34d399" />
                <span>Start / End Trip with Live 1Hz GPS Broadcast</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#34d399" />
                <span>Student Boarding Verification & Passenger Counter</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#34d399" />
                <span>One-Tap Traffic Delay & SOS Beacon Reports</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                type="button"
                className="neo-btn neo-btn-emerald"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDirectEnter('driver');
                }}
              >
                <span>Launch Driver Cockpit</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '4px',
                  textDecoration: 'underline'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick('driver');
                }}
              >
                Enter Custom Credentials
              </button>
            </div>
          </div>

          {/* Card 3: Operations Admin */}
          <div
            onClick={() => handleCardClick('admin')}
            className={`neo-login-card neo-role-card neo-card-admin ${selectedRole === 'admin' ? 'selected-role' : ''}`}
            style={{
              padding: '24px',
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24'
              }}>
                <Cpu size={22} />
              </div>
              <span className="neo-tag neo-tag-yellow" style={{ fontSize: '0.68rem' }}>
                2 DISPATCH ADMINS
              </span>
            </div>

            <h3 className="neo-card-title" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
              Operations Admin
            </h3>
            <p className="neo-card-sub" style={{ fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '18px' }}>
              For campus transit authorities overseeing fleet telematics, AI copilot commands, and emergency incidents.
            </p>

            <div className="neo-login-features-box" style={{
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#fbbf24" />
                <span>Centralized Multi-Bus Live Vadodara Map</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#fbbf24" />
                <span>AI Dispatcher Copilot & Natural Language Commands</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} color="#fbbf24" />
                <span>Fleet Roster CRUD & CSV Operations Reporting</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <button
                type="button"
                className="neo-btn neo-btn-yellow"
                style={{ width: '100%' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDirectEnter('admin');
                }}
              >
                <span>Launch Admin Ops Center</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  padding: '4px',
                  textDecoration: 'underline'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick('admin');
                }}
              >
                Enter Custom Credentials
              </button>
            </div>
          </div>
        </div>

        {/* Clean Credential Authentication Card */}
        <div id="auth-credential-form" className="neo-login-drawer" style={{
          backdropFilter: 'blur(16px)',
          borderRadius: '18px',
          padding: '28px'
        }}>
          {/* Card Header & Role Switcher */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: selectedRole === 'student' ? 'rgba(56, 189, 248, 0.15)' : selectedRole === 'driver' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedRole === 'student' ? '#38bdf8' : selectedRole === 'driver' ? '#34d399' : '#fbbf24'
              }}>
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="neo-drawer-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                  Sign In as {selectedRole === 'student' ? 'Student' : selectedRole === 'driver' ? 'Driver' : 'Administrator'}
                </h3>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  Enter your credentials to access the portal dashboard
                </span>
              </div>
            </div>

            {/* Segmented Role Tabs */}
            <div className="neo-tab-group">
              <button
                type="button"
                className={`neo-nav-tab ${selectedRole === 'student' ? 'active-cyan' : ''}`}
                onClick={() => handleCardClick('student')}
              >
                Student
              </button>
              <button
                type="button"
                className={`neo-nav-tab ${selectedRole === 'driver' ? 'active-emerald' : ''}`}
                onClick={() => handleCardClick('driver')}
              >
                Driver
              </button>
              <button
                type="button"
                className={`neo-nav-tab ${selectedRole === 'admin' ? 'active-yellow' : ''}`}
                onClick={() => handleCardClick('admin')}
              >
                Admin
              </button>
            </div>
          </div>

          {error && (
            <div className="neo-error-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="neo-label">
                {selectedRole === 'student' && 'College Roll Number or Institutional Email'}
                {selectedRole === 'driver' && 'Driver Email or Bus Callsign'}
                {selectedRole === 'admin' && 'Administrator Email or Staff ID'}
              </label>
              <input
                type="text"
                required
                className="neo-input"
                placeholder={
                  selectedRole === 'student'
                    ? 'e.g. NUV24CS001 or student.aarav.001@nuv.ac.in'
                    : selectedRole === 'driver'
                    ? 'e.g. driver.ramesh@nuv.ac.in or driver1'
                    : 'e.g. admin@nuv.ac.in or admin2@nuv.ac.in'
                }
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            <div>
              <label className="neo-label">Password</label>
              <input
                type="password"
                required
                className="neo-input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={`neo-btn ${selectedRole === 'student' ? 'neo-btn-cyan' : selectedRole === 'driver' ? 'neo-btn-emerald' : 'neo-btn-yellow'}`}
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', marginTop: '6px' }}
              disabled={loading}
            >
              <Lock size={15} />
              <span>{loading ? 'Authenticating...' : `Sign In to ${selectedRole === 'student' ? 'Student Portal' : selectedRole === 'driver' ? 'Driver Simulator' : 'AI Ops Center'}`}</span>
            </button>
          </form>

          {/* Quick-Fill Credentials Directory for Evaluators */}
          <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '6px 0'
              }}
              onClick={() => setShowRosterReference(!showRosterReference)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>
                <Sparkles size={14} />
                <span>Demo Accounts Directory (Click any to pre-fill)</span>
              </div>
              <button
                type="button"
                className="neo-btn-outline"
                style={{ fontSize: '0.72rem', padding: '4px 10px' }}
              >
                {showRosterReference ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                <span style={{ marginLeft: 4 }}>{showRosterReference ? 'Hide Roster' : 'Show Roster'}</span>
              </button>
            </div>

            {showRosterReference && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* 2 Admins */}
                <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.78rem', marginBottom: '8px' }}>
                    ADMINISTRATOR ACCOUNTS (Password: admin123)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      className="neo-tag neo-tag-yellow"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('admin@nuv.ac.in', 'admin123', 'admin')}
                    >
                      Admin 1: admin@nuv.ac.in (Prof. Arvind Trivedi)
                    </button>
                    <button
                      type="button"
                      className="neo-tag neo-tag-yellow"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('admin2@nuv.ac.in', 'admin123', 'admin')}
                    >
                      Admin 2: admin2@nuv.ac.in (Dr. Rajesh Mehta)
                    </button>
                  </div>
                </div>

                {/* 4 Drivers */}
                <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.78rem', marginBottom: '8px' }}>
                    SHUTTLE DRIVERS (Password: driver123)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <button
                      type="button"
                      className="neo-tag neo-tag-emerald"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('driver.ramesh@nuv.ac.in', 'driver123', 'driver')}
                    >
                      Bus 1 (Route 101): driver.ramesh@nuv.ac.in
                    </button>
                    <button
                      type="button"
                      className="neo-tag neo-tag-emerald"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('driver.jignesh@nuv.ac.in', 'driver123', 'driver')}
                    >
                      Bus 2 (Route 202): driver.jignesh@nuv.ac.in
                    </button>
                    <button
                      type="button"
                      className="neo-tag neo-tag-emerald"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('driver.mukesh@nuv.ac.in', 'driver123', 'driver')}
                    >
                      Bus 3 (Route 303): driver.mukesh@nuv.ac.in
                    </button>
                    <button
                      type="button"
                      className="neo-tag neo-tag-emerald"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleQuickFill('driver.haresh@nuv.ac.in', 'driver123', 'driver')}
                    >
                      Bus 4 (Route 404): driver.haresh@nuv.ac.in
                    </button>
                  </div>
                </div>

                {/* Students */}
                <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '10px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#38bdf8', fontSize: '0.78rem', marginBottom: '6px' }}>
                    ENROLLED STUDENTS (Roll: NUV24CS001 - NUV24CS200 | Password: student123)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
                    Click any sample student below to pre-fill credentials:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { roll: 'NUV24CS001', name: 'Aarav (Bus 1 - Sayajigunj)' },
                      { roll: 'NUV24CS015', name: 'Khushi (Bus 1 - Alkapuri)' },
                      { roll: 'NUV24CS050', name: 'Soham (Bus 1 - Akota)' },
                      { roll: 'NUV24CS051', name: 'Diya (Bus 2 - Fatehgunj)' },
                      { roll: 'NUV24CS075', name: 'Dhruv (Bus 2 - Gotri)' },
                      { roll: 'NUV24CS101', name: 'Rohan (Bus 3 - Manjalpur)' },
                      { roll: 'NUV24CS125', name: 'Bhavya (Bus 3 - Sun Pharma)' },
                      { roll: 'NUV24CS151', name: 'Ananya (Bus 4 - Subhanpura)' },
                      { roll: 'NUV24CS200', name: 'Rahul (Bus 4 - Old Padra)' }
                    ].map(st => (
                      <button
                        key={st.roll}
                        type="button"
                        className="neo-tag neo-tag-cyan"
                        style={{ cursor: 'pointer', fontSize: '0.72rem' }}
                        onClick={() => handleQuickFill(st.roll, 'student123', 'student')}
                      >
                        {st.roll}: {st.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
