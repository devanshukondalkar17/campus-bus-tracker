import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock, AlertTriangle, Users, Filter, Check, X, Shield, RefreshCw, Send } from 'lucide-react';
import socket from '../services/socket';
import { playAlertChime } from '../utils/geoHelpers';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export default function AdminSubscriptionHub({ isOpen, onClose }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, rejected: 0 });
  const [filter, setFilter] = useState('PENDING_APPROVAL'); // 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'ALL'
  const [loading, setLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Payment reference unverified with bank accounts office.');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions`);
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Real-time socket listener
  useEffect(() => {
    const handleUpdate = () => {
      fetchSubscriptions();
      playAlertChime('INFO');
    };

    socket.on('subscription_updated', handleUpdate);
    socket.on('subscription_status_changed', handleUpdate);

    return () => {
      socket.off('subscription_updated', handleUpdate);
      socket.off('subscription_status_changed', handleUpdate);
    };
  }, []);

  // Accept Subscription
  const handleAccept = async (id) => {
    setActionFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        playAlertChime('DISPATCH');
        setActionFeedback({ type: 'success', text: data.message });
        fetchSubscriptions();
      } else {
        setActionFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: 'Accept failed: ' + err.message });
    }
  };

  // Reject Subscription
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;

    setActionFeedback(null);
    try {
      const res = await fetch(`${API_BASE}/admin/subscriptions/${rejectingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await res.json();
      if (data.success) {
        playAlertChime('INFO');
        setActionFeedback({ type: 'success', text: data.message });
        setRejectingId(null);
        fetchSubscriptions();
      } else {
        setActionFeedback({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: 'Reject failed: ' + err.message });
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#38bdf8', border: '2px solid #000', boxShadow: '2px 2px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={18} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
              Student Commute Pass Approvals Terminal
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Accept or reject student Monthly (₹1,499) and Yearly (₹14,999) transit passes
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchSubscriptions}
          className="neo-btn-outline"
          style={{ padding: '4px 8px', fontSize: '0.7rem', gap: '4px' }}
          title="Refresh queue"
        >
          <RefreshCw size={12} className={loading ? 'spin' : ''} />
          <span>Sync</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionFeedback && (
        <div style={{
          marginBottom: '12px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '0.78rem',
          fontWeight: 800,
          background: actionFeedback.type === 'success' ? '#064e3b' : '#4c0519',
          color: actionFeedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
          border: `1.5px solid ${actionFeedback.type === 'success' ? '#10b981' : '#f43f5e'}`,
          boxShadow: '2px 2px 0px #000000'
        }}>
          {actionFeedback.text}
        </div>
      )}

      {/* Filter Tabs & Counters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'PENDING_APPROVAL', label: `Pending Review (${stats.pending})`, color: '#facc15' },
          { id: 'ACTIVE', label: `Approved Active (${stats.active})`, color: '#34d399' },
          { id: 'REJECTED', label: `Rejected (${stats.rejected})`, color: '#f87171' },
          { id: 'ALL', label: `All Requests (${stats.total})`, color: '#cbd5e1' }
        ].map(tab => {
          const isSelected = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                background: isSelected ? tab.color : '#131e34',
                color: isSelected ? '#000000' : '#cbd5e1',
                border: `1.5px solid ${isSelected ? '#000000' : '#233554'}`,
                boxShadow: isSelected ? '1.5px 1.5px 0px #000000' : 'none',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.12s ease'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Rejection Modal / Prompt */}
      {rejectingId && (
        <div style={{
          marginBottom: '14px',
          background: '#2b1016',
          border: '2px solid #f43f5e',
          borderRadius: '8px',
          boxShadow: '3px 3px 0px #000000',
          padding: '12px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fca5a5', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <XCircle size={16} />
            <span>Specify Rejection Reason:</span>
          </div>

          <form onSubmit={handleRejectSubmit}>
            <select
              style={{
                width: '100%',
                background: '#151d30',
                border: '1.5px solid #233554',
                borderRadius: '6px',
                padding: '7px 10px',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '8px'
              }}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            >
              <option value="Payment reference unverified with bank accounts office.">
                Payment reference unverified with bank accounts office.
              </option>
              <option value="Fee dues pending with university accounts division.">
                Fee dues pending with university accounts division.
              </option>
              <option value="Route corridor quota exceeded for current semester.">
                Route corridor quota exceeded for current semester.
              </option>
              <option value="Duplicate pass application detected.">
                Duplicate pass application detected.
              </option>
            </select>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="neo-btn-outline"
                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                onClick={() => setRejectingId(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="neo-btn neo-btn-danger"
                style={{ padding: '4px 12px', fontSize: '0.72rem' }}
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscriptions List */}
      <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8', fontSize: '0.82rem' }}>
            <CheckCircle2 size={26} color="#10b981" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
            <div>No subscriptions in this queue.</div>
          </div>
        ) : (
          filteredSubs.map(sub => {
            const isPending = sub.status === 'PENDING_APPROVAL';
            const isActive = sub.status === 'ACTIVE';
            const isRej = sub.status === 'REJECTED';

            return (
              <div
                key={sub.id}
                style={{
                  background: 'linear-gradient(145deg, #121c32, #17243e)',
                  border: `1.5px solid ${isPending ? '#f59e0b' : isActive ? '#10b981' : '#f43f5e'}`,
                  borderRadius: '8px',
                  boxShadow: '2px 2px 0px #000000',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Header line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px' }}>🎓</span>
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{sub.studentName}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', marginLeft: '6px' }}>
                        {sub.studentRollNumber}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '5px',
                    background: isPending ? 'rgba(245,158,11,0.2)' : isActive ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)',
                    color: isPending ? '#fde047' : isActive ? '#6ee7b7' : '#fca5a5',
                    border: `1px solid ${isPending ? '#f59e0b' : isActive ? '#10b981' : '#f43f5e'}`
                  }}>
                    {isPending ? 'PENDING APPROVAL' : isActive ? 'ACTIVE PASS' : 'REJECTED'}
                  </span>
                </div>

                {/* Details Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>PLAN</span>
                    <div style={{ color: '#ffffff', fontWeight: 800 }}>
                      {sub.planType === 'YEARLY' ? 'Yearly Pass' : 'Monthly Pass'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>AMOUNT</span>
                    <div style={{ color: '#38bdf8', fontWeight: 800 }}>
                      ₹{sub.amountInr.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>PAYMENT REF</span>
                    <div style={{ color: '#cbd5e1', fontWeight: 800 }}>
                      {sub.transactionRef}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.65rem' }}>PASS CODE</span>
                    <div style={{ color: isActive ? '#34d399' : '#64748b', fontWeight: 800 }}>
                      {sub.passCode || '—'}
                    </div>
                  </div>
                </div>

                {/* Rejection notice if rejected */}
                {isRej && sub.rejectionReason && (
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', background: 'rgba(244,63,94,0.1)', padding: '5px 8px', borderRadius: '4px' }}>
                    Reason: {sub.rejectionReason}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  {isPending && (
                    <>
                      <button
                        type="button"
                        className="neo-btn neo-btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                        onClick={() => setRejectingId(sub.id)}
                      >
                        <X size={13} />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        className="neo-btn neo-btn-emerald"
                        style={{ padding: '6px 14px', fontSize: '0.72rem', fontWeight: 900 }}
                        onClick={() => handleAccept(sub.id)}
                      >
                        <Check size={14} />
                        <span>Accept & Activate Pass</span>
                      </button>
                    </>
                  )}

                  {isRej && (
                    <button
                      type="button"
                      className="neo-btn neo-btn-cyan"
                      style={{ padding: '5px 10px', fontSize: '0.72rem' }}
                      onClick={() => handleAccept(sub.id)}
                    >
                      <span>Re-consider & Approve</span>
                    </button>
                  )}

                  {isActive && (
                    <span style={{ fontSize: '0.7rem', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} color="#10b981" />
                      <span>Approved by {sub.reviewedBy || 'Admin'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
