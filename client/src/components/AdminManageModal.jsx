import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Send, Download, Users, Bus, Bell, Shield, CheckCircle2 } from 'lucide-react';
import { playAlertChime } from '../utils/geoHelpers';

export default function AdminManageModal({
  isOpen,
  onClose,
  buses = [],
  routes = [],
  stops = [],
  onFleetUpdated
}) {
  const [activeTab, setActiveTab] = useState('BUSES'); // 'BUSES' | 'ANNOUNCE' | 'ASSIGN'
  
  // New bus form state
  const [callsign, setCallsign] = useState('');
  const [numberPlate, setNumberPlate] = useState('GJ-06-');
  const [routeId, setRouteId] = useState('route-101');
  const [capacity, setCapacity] = useState(55);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  // Announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annTarget, setAnnTarget] = useState('ALL');

  if (!isOpen) return null;

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

  // Add Bus Handler
  const handleAddBus = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/buses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token-admin'
        },
        body: JSON.stringify({
          callsign,
          numberPlate,
          routeId,
          capacity: Number(capacity),
          driver: { name: driverName || 'Assigned Driver', phone: driverPhone || '+91 98250 00000', rating: 5.0, shiftHours: 0 }
        })
      });
      const data = await res.json();
      playAlertChime('DISPATCH');
      setActionSuccess(data.message || 'Bus added successfully!');
      setCallsign('');
      setNumberPlate('GJ-06-');
      if (onFleetUpdated) onFleetUpdated();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert('Error adding bus: ' + err.message);
    }
  };

  // Delete Bus Handler
  const handleDeleteBus = async (id) => {
    if (!window.confirm('Are you sure you want to decommission this bus from active fleet?')) return;
    try {
      await fetch(`${API_BASE}/admin/buses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer demo-token-admin' }
      });
      playAlertChime('INFO');
      if (onFleetUpdated) onFleetUpdated();
    } catch (err) {
      alert('Error deleting bus: ' + err.message);
    }
  };

  // Broadcast Announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/admin/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token-admin'
        },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          targetType: annTarget
        })
      });
      const data = await res.json();
      playAlertChime('DISPATCH');
      setActionSuccess('Announcement broadcasted to all enrolled students and mobile apps!');
      setAnnTitle('');
      setAnnMessage('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      alert('Error sending announcement: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    window.open(`${API_BASE}/admin/export-csv`, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
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
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                Admin Operations Management Console
              </div>
              <div style={{ fontSize: '0.72rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                Navrachana University Transit Department
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={handleExportCSV}
              title="Download full fleet data as CSV"
            >
              <Download size={13} color="#38bdf8" />
              <span>Export CSV</span>
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11,17,32,0.8)' }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'BUSES' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', background: activeTab === 'BUSES' ? 'rgba(56,189,248,0.2)' : 'transparent', borderColor: activeTab === 'BUSES' ? '#38bdf8' : 'transparent', color: activeTab === 'BUSES' ? '#fff' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('BUSES')}
          >
            <Bus size={14} />
            <span>Manage Buses & Fleet</span>
          </button>

          <button
            type="button"
            className={`btn-secondary ${activeTab === 'ANNOUNCE' ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', background: activeTab === 'ANNOUNCE' ? 'rgba(168,85,247,0.2)' : 'transparent', borderColor: activeTab === 'ANNOUNCE' ? '#a855f7' : 'transparent', color: activeTab === 'ANNOUNCE' ? '#fff' : 'var(--text-muted)' }}
            onClick={() => setActiveTab('ANNOUNCE')}
          >
            <Bell size={14} />
            <span>Broadcast Announcement</span>
          </button>
        </div>

        <div style={{ padding: '20px', maxHeight: '480px', overflowY: 'auto' }}>
          {actionSuccess && (
            <div style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: MANAGE BUSES */}
          {activeTab === 'BUSES' && (
            <div>
              {/* Add Bus Form */}
              <div style={{ background: 'rgba(13,20,36,0.6)', border: '1px solid var(--border-subtle)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={15} />
                  <span>Commission New Bus to Fleet</span>
                </div>

                <form onSubmit={handleAddBus} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Callsign</label>
                    <input
                      type="text"
                      required
                      className="copilot-text-input"
                      placeholder="e.g. NUV-Titan-103"
                      value={callsign}
                      onChange={e => setCallsign(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Vadodara RTO Plate</label>
                    <input
                      type="text"
                      required
                      className="copilot-text-input"
                      placeholder="GJ-06-XX-XXXX"
                      value={numberPlate}
                      onChange={e => setNumberPlate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Corridor Assignment</label>
                    <select
                      className="copilot-text-input"
                      value={routeId}
                      onChange={e => setRouteId(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem' }}
                    >
                      <option value="">Depot / Standby Reserve</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Total Passenger Capacity</label>
                    <input
                      type="number"
                      required
                      className="copilot-text-input"
                      value={capacity}
                      onChange={e => setCapacity(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Assigned Driver Name</label>
                    <input
                      type="text"
                      className="copilot-text-input"
                      placeholder="e.g. Nilesh Bhatt"
                      value={driverName}
                      onChange={e => setDriverName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="neo-btn neo-btn-cyan" style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', justifyContent: 'center' }}>
                      <Plus size={15} />
                      <span>Commission Bus</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Fleet Table */}
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                Active Navrachana Bus Roster ({buses.length} vehicles)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {buses.map(bus => (
                  <div
                    key={bus.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(13,19,34,0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: '#ffffff', fontSize: '0.88rem' }}>{bus.callsign}</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{bus.numberPlate}</span>
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}>
                          {bus.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Cap: {bus.capacity} pax • Driver: {bus.driver ? bus.driver.name : 'Unassigned'} • Fuel: {bus.telematics ? bus.telematics.batteryOrFuel : 85}%
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="neo-btn neo-btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.72rem' }}
                        onClick={() => handleDeleteBus(bus.id)}
                        title="Decommission vehicle"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BROADCAST ANNOUNCEMENT */}
          {activeTab === 'ANNOUNCE' && (
            <div>
              <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Target Audience
                  </label>
                  <select
                    className="copilot-text-input"
                    value={annTarget}
                    onChange={e => setAnnTarget(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  >
                    <option value="ALL">📢 All Enrolled Students & Drivers (Campus Wide)</option>
                    <option value="ROUTE">🚌 Route 101 Commuters Only (Sayajigunj & Alkapuri)</option>
                    <option value="BUS">🚍 Route 202 Commuters Only (Gotri & Fatehgunj)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    required
                    className="copilot-text-input"
                    placeholder="e.g. Special Holiday Schedule / Road Diversion Notice"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Announcement Message Body
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="copilot-text-input"
                    placeholder="Write detailed dispatch notice for students..."
                    value={annMessage}
                    onChange={e => setAnnMessage(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  />
                </div>

                <button type="submit" className="neo-btn neo-btn-cyan" style={{ padding: '12px', justifyContent: 'center', fontWeight: 900 }}>
                  <Send size={16} />
                  <span>Broadcast Instant Notification & Push Alert</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
