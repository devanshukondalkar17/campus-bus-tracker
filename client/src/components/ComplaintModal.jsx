import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playAlertChime } from '../utils/geoHelpers';

export default function ComplaintModal({ isOpen, onClose, buses = [], onComplaintSubmitted }) {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('LATE_BUS');
  const [busId, setBusId] = useState(buses[0] ? buses[0].id : 'bus-01');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setLoading(true);
    setSuccessMsg(null);

    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api';

    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          busId,
          subject,
          description
        })
      });
      const data = await res.json();
      playAlertChime('INFO');
      setSuccessMsg(data.message || 'Complaint filed successfully!');
      setSubject('');
      setDescription('');
      if (onComplaintSubmitted) onComplaintSubmitted();
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 2000);
    } catch (err) {
      alert('Error submitting report: ' + err.message);
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
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} color="#f43f5e" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                Report an Issue or Feedback
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Directly submitted to NUV Transport Incharge
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {successMsg ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#34d399' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>Report Submitted!</div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>{successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Issue Category
                  </label>
                  <select
                    style={{
                      width: '100%',
                      background: 'rgba(13,19,34,0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '8px 10px',
                      fontSize: '0.82rem'
                    }}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="LATE_BUS">Late Bus / Schedule Delay</option>
                    <option value="DRIVER_BEHAVIOUR">Driver Rash Driving / Behavior</option>
                    <option value="OVERCROWDING">Severe Overcrowding</option>
                    <option value="AIR_CONDITIONING">AC Malfunction / Cooling</option>
                    <option value="LOST_ITEM">Lost Item in Vehicle</option>
                    <option value="OTHER">Other Campus Transit Query</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Concerned Bus
                  </label>
                  <select
                    style={{
                      width: '100%',
                      background: 'rgba(13,19,34,0.9)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#ffffff',
                      padding: '8px 10px',
                      fontSize: '0.82rem'
                    }}
                    value={busId}
                    onChange={e => setBusId(e.target.value)}
                  >
                    {buses.map(b => (
                      <option key={b.id} value={b.id}>{b.callsign}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Issue Subject
                </label>
                <input
                  type="text"
                  required
                  className="copilot-text-input"
                  style={{ width: '100%', padding: '10px' }}
                  placeholder="e.g. Bus did not stop at Alkapuri stop"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Detailed Description
                </label>
                <textarea
                  required
                  className="copilot-text-input"
                  rows={3}
                  style={{ width: '100%', padding: '10px', resize: 'vertical' }}
                  placeholder="Please describe the time, stop, and circumstances..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-danger"
                style={{ width: '100%', padding: '10px', justifyContent: 'center', marginTop: '4px' }}
                disabled={loading}
              >
                <Send size={15} />
                <span>{loading ? 'Submitting Report...' : 'Submit to Operations Office'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
