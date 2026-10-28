import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [role, setRole] = useState('student');
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await register({
          name,
          email: identifier,
          rollNumber: role === 'student' ? rollNumber : null,
          password,
          role
        });
      } else {
        await login(identifier, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16,24,44,0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                Navrachana Transit Portal
              </div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                Role-Based Authentication & Pass
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Quick Credential Fill for Testing */}
          <div style={{ marginBottom: '16px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', padding: '12px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
              <Sparkles size={13} />
              <span>Fill Role Credentials (200 Students, 4 Drivers, 2 Admins)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '6px 4px', justifyContent: 'center', background: 'rgba(37,99,235,0.2)', borderColor: '#2563eb', color: '#93c5fd' }}
                onClick={() => {
                  setIdentifier('NUV24CS001');
                  setPassword('student123');
                  setRole('student');
                }}
              >
                👤 Student (NUV24CS001)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '6px 4px', justifyContent: 'center', background: 'rgba(16,185,129,0.2)', borderColor: '#10b981', color: '#6ee7b7' }}
                onClick={() => {
                  setIdentifier('driver.ramesh@nuv.ac.in');
                  setPassword('driver123');
                  setRole('driver');
                }}
              >
                🚌 Driver (Bus 1)
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '6px 4px', justifyContent: 'center', background: 'rgba(168,85,247,0.2)', borderColor: '#a855f7', color: '#d8b4fe' }}
                onClick={() => {
                  setIdentifier('admin@nuv.ac.in');
                  setPassword('admin123');
                  setRole('admin');
                }}
              >
                ⚡ Admin (Prof. Trivedi)
              </button>
            </div>
          </div>

          {/* Role Picker */}
          {isRegisterMode && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {['student', 'driver'].map(r => (
                <button
                  key={r}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${role === r ? '#38bdf8' : 'var(--border-subtle)'}`,
                    background: role === r ? 'rgba(56,189,248,0.15)' : 'transparent',
                    color: role === r ? '#fff' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid #f43f5e', color: '#fca5a5', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isRegisterMode && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="copilot-text-input"
                  style={{ width: '100%', padding: '10px 12px' }}
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                {isRegisterMode ? 'College Email (@nuv.ac.in)' : 'College Email or Roll Number'}
              </label>
              <input
                type="text"
                required
                className="copilot-text-input"
                style={{ width: '100%', padding: '10px 12px' }}
                placeholder={isRegisterMode ? "student@nuv.ac.in" : "student.aarav@nuv.ac.in or NUV23CS101"}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </div>

            {isRegisterMode && role === 'student' && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  University Roll Number
                </label>
                <input
                  type="text"
                  className="copilot-text-input"
                  style={{ width: '100%', padding: '10px 12px' }}
                  placeholder="e.g. NUV23CS101"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Password
              </label>
              <input
                type="password"
                required
                className="copilot-text-input"
                style={{ width: '100%', padding: '10px 12px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '6px' }}
              disabled={loading}
            >
              <KeyRound size={16} />
              <span>{loading ? 'Authenticating...' : isRegisterMode ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isRegisterMode ? (
              <span>Already registered? <button type="button" onClick={() => setIsRegisterMode(false)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Log In</button></span>
            ) : (
              <span>New student or staff? <button type="button" onClick={() => setIsRegisterMode(true)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}>Register Pass</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
