import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, QrCode, Sparkles, ShieldCheck, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import socket from '../services/socket';
import { playAlertChime } from '../utils/geoHelpers';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export default function StudentSubscriptionCard({ currentUser }) {
  const [subscription, setSubscription] = useState(currentUser?.subscription || null);
  const [plans, setPlans] = useState([
    {
      id: 'MONTHLY',
      name: 'Monthly Commuter Pass',
      amountInr: 1499,
      billingPeriod: 'Per Month (30 Days)',
      discountBadge: null,
      features: [
        'Unlimited Daily Commute on Assigned Route',
        'Guaranteed Reserved Seat Allocation',
        'Real-Time 1Hz GPS Bus Tracking & Arrival Alerts',
        'Valid for 07:00 AM, 09:00 AM, 01:00 PM & 07:00 PM Shifts',
        'Instant Digital Bus Pass QR Code for Driver Verification'
      ]
    },
    {
      id: 'YEARLY',
      name: 'Yearly Annual Campus Pass',
      amountInr: 14999,
      billingPeriod: 'Per Academic Year (365 Days)',
      discountBadge: 'Save 17% (₹3,000 Off)',
      popular: true,
      features: [
        'Full 2 Semesters + Exam Shuttle Express Coverage',
        'Priority Boarding & Express Campus Corridor',
        'Zero Fare Hikes for Entire Academic Year',
        'Complimentary Midday Break Shuttle Access',
        'Annual Official Commuter Certificate from NUV'
      ]
    }
  ]);
  const [selectedPlanId, setSelectedPlanId] = useState('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReapply, setShowReapply] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  // Fetch current subscription
  useEffect(() => {
    const fetchSub = async () => {
      try {
        const studentId = currentUser ? currentUser.id : 'usr-student-001';
        const res = await fetch(`${API_BASE}/student/subscription/current?studentId=${studentId}`);
        const data = await res.json();
        if (data.success) {
          if (data.subscription) setSubscription(data.subscription);
          if (data.plans) setPlans(data.plans);
        }
      } catch (err) {
        console.error('Failed to load subscription:', err);
      }
    };
    fetchSub();
  }, [currentUser]);

  // Real-time socket sync when Admin accepts or rejects
  useEffect(() => {
    const handleSubChanged = (payload) => {
      if (payload.studentId === (currentUser ? currentUser.id : 'usr-student-001')) {
        setSubscription(payload.subscription);
        if (payload.subscription.status === 'ACTIVE') {
          playAlertChime('DISPATCH');
          setActionMsg({ type: 'success', text: `🎉 Pass Activated! Pass Code: ${payload.subscription.passCode}` });
        } else if (payload.subscription.status === 'REJECTED') {
          playAlertChime('CRITICAL');
          setActionMsg({ type: 'error', text: `⚠️ Subscription Rejected: ${payload.subscription.rejectionReason}` });
        }
        setTimeout(() => setActionMsg(null), 6000);
      }
    };

    socket.on('subscription_status_changed', handleSubChanged);
    return () => {
      socket.off('subscription_status_changed', handleSubChanged);
    };
  }, [currentUser]);

  // Handle request subscription
  const handleRequestSubscription = async (e) => {
    e.preventDefault();
    setLoading(true);
    setActionMsg(null);

    try {
      const studentId = currentUser ? currentUser.id : 'usr-student-001';
      const ref = transactionRef || `UPI-NUV-${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await fetch(`${API_BASE}/student/subscription/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          planType: selectedPlanId,
          paymentMethod,
          transactionRef: ref
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        setShowReapply(false);
        playAlertChime('DISPATCH');
        setActionMsg({ type: 'success', text: data.message });
      } else {
        setActionMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setActionMsg({ type: 'error', text: 'Request failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const isPending = subscription && subscription.status === 'PENDING_APPROVAL';
  const isActive = subscription && subscription.status === 'ACTIVE';
  const isRejected = subscription && subscription.status === 'REJECTED';
  const hasNoPass = !subscription || (isRejected && showReapply);

  return (
    <div className="glass-panel" style={{ padding: '16px', marginBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'var(--neo-yellow)', border: '2px solid #000', boxShadow: '2px 2px 0px #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={18} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase' }}>
              Campus Bus Commute Pass Subscription (INR ₹)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Official monthly & yearly transit pass with automated boarding verification
            </div>
          </div>
        </div>

        {/* Status Pill */}
        {isActive && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 900,
            background: 'rgba(16,185,129,0.2)',
            color: '#34d399',
            border: '1.5px solid #10b981',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            PASS ACTIVE
          </span>
        )}
        {isPending && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 900,
            background: 'rgba(245,158,11,0.2)',
            color: '#facc15',
            border: '1.5px solid #f59e0b',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
            PENDING ADMIN APPROVAL
          </span>
        )}
        {isRejected && !showReapply && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 900,
            background: 'rgba(244,63,94,0.2)',
            color: '#fda4af',
            border: '1.5px solid #f43f5e',
            borderRadius: '6px',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            REJECTED
          </span>
        )}
      </div>

      {/* Action Notification Banner */}
      {actionMsg && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.78rem',
          fontWeight: 600,
          background: actionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          color: actionMsg.type === 'success' ? '#34d399' : '#fca5a5',
          border: `1px solid ${actionMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
        }}>
          {actionMsg.text}
        </div>
      )}

      {/* STATE 1: ACTIVE PASS */}
      {isActive && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.6) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700, letterSpacing: '0.04em' }}>
                DIGITAL COMMUTER BUS PASS
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                {subscription.planName} (₹{subscription.amountInr.toLocaleString('en-IN')})
              </div>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.62rem', color: '#6ee7b7', display: 'block' }}>PASS CODE</span>
              <strong style={{ fontSize: '0.85rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {subscription.passCode || 'NUV-PASS-2026'}
              </strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '10px', borderRadius: '10px', fontSize: '0.74rem' }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>VALID UNTIL</span>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>
                {subscription.validUntil ? new Date(subscription.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Days'}
              </div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>PAYMENT REF</span>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {subscription.transactionRef}
              </div>
            </div>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '0.66rem' }}>VERIFIED BY</span>
              <div style={{ color: '#34d399', fontWeight: 600 }}>
                {subscription.reviewedBy || 'Transit Admin'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>
              ✓ Unlimited rides verified for 7 AM, 9 AM, 1 PM & 7 PM
            </span>
            <span style={{ fontSize: '0.7rem', color: '#ffffff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <QrCode size={14} color="#34d399" />
              <span>Show to Driver</span>
            </span>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING APPROVAL */}
      {isPending && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Clock size={18} color="#fbbf24" />
            <strong style={{ fontSize: '0.92rem', color: '#fef08a' }}>
              Subscription Submitted • Waiting for Transit Admin Approval
            </strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 10px 0' }}>
            Your request for <strong>{subscription.planName} (₹{subscription.amountInr.toLocaleString('en-IN')})</strong> via {subscription.paymentMethod} (Ref: <code style={{ color: '#38bdf8' }}>{subscription.transactionRef}</code>) has been submitted. The campus transport administrator will verify and approve your pass shortly.
          </p>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Requested On: {new Date(subscription.requestedAt).toLocaleString('en-IN')}</span>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>Approval Queue: Priority</span>
          </div>
        </div>
      )}

      {/* STATE 3: REJECTED STATE */}
      {isRejected && !showReapply && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#f43f5e" />
            <strong style={{ fontSize: '0.92rem', color: '#fca5a5' }}>
              Commute Pass Request Rejected
            </strong>
          </div>
          <p style={{ fontSize: '0.76rem', color: '#fecdd3', margin: '0 0 10px 0' }}>
            Reason from Admin: <em>"{subscription.rejectionReason || 'Payment reference could not be verified'}"</em>
          </p>
          <button
            type="button"
            className="neo-btn neo-btn-cyan"
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
            onClick={() => setShowReapply(true)}
          >
            <RefreshCw size={13} />
            <span>Select Plan & Reapply</span>
          </button>
        </div>
      )}

      {/* STATE 4: NO PASS / APPLY FOR SUBSCRIPTION FORM */}
      {hasNoPass && (
        <div>
          <form onSubmit={handleRequestSubscription}>
            {/* Plan Selector Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              {plans.map(p => {
                const isSelected = selectedPlanId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    style={{
                      background: isSelected ? 'linear-gradient(145deg, rgba(14, 38, 64, 0.8), rgba(15, 23, 42, 0.9))' : 'rgba(15, 23, 42, 0.55)',
                      border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                      boxShadow: isSelected ? '0 0 18px rgba(56, 189, 248, 0.2)' : 'none',
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {p.discountBadge && (
                      <span style={{
                        position: 'absolute',
                        top: -8,
                        right: 8,
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '1px 8px',
                        borderRadius: '999px'
                      }}>
                        {p.discountBadge}
                      </span>
                    )}

                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#cbd5e1' }}>
                      {p.name}
                    </div>

                    <div style={{ margin: '6px 0' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-sans)', color: '#ffffff' }}>
                        ₹{p.amountInr.toLocaleString('en-IN')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '4px' }}>
                        / {p.id === 'MONTHLY' ? 'mo' : 'yr'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      {p.id === 'MONTHLY' ? '30 Days unlimited bus rides & seat guarantee' : 'Full academic year (2 semesters + exams coverage)'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                Select Payment Mode (INR ₹)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                {[
                  { id: 'UPI', label: '📱 UPI (GPay/PhonePe)' },
                  { id: 'NET_BANKING', label: '🏦 Net Banking' },
                  { id: 'CAMPUS_CHALLAN', label: '🏛️ Accounts Challan' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    style={{
                      background: paymentMethod === m.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      color: paymentMethod === m.id ? '#34d399' : '#cbd5e1',
                      border: `1px solid ${paymentMethod === m.id ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '8px',
                      padding: '6px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>
                  UPI / Bank Transaction Ref (Optional for Demo):
                </label>
                <input
                  type="text"
                  className="neo-input"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
                  placeholder="e.g. UPI-NUV-982341..."
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Request Button */}
            <button
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-emerald"
              style={{
                width: '100%',
                padding: '12px',
                justifyContent: 'center',
                fontSize: '0.86rem',
                fontWeight: 600
              }}
            >
              <Zap size={15} />
              <span>
                {loading ? 'Submitting Request...' : `Submit Subscription Request (₹${(selectedPlanId === 'YEARLY' ? 14999 : 1499).toLocaleString('en-IN')})`}
              </span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
