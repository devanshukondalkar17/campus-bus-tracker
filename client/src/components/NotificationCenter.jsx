import React, { useState } from 'react';
import { Bell, CheckCheck, X, AlertCircle, Info, Radio, Zap } from 'lucide-react';
import { formatTimeAgo } from '../utils/geoHelpers';

export default function NotificationCenter({ isOpen, onClose, notifications = [], onMarkAsRead, onMarkAllAsRead }) {
  const [filter, setFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'TRIP') return n.type === 'TRIP_STARTED' || n.type === 'BUS_NEARBY' || n.type === 'DELAY';
    if (filter === 'ANNOUNCEMENTS') return n.type === 'ANNOUNCEMENT';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>
                Notification Center
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {unreadCount > 0 ? `${unreadCount} unread transit alerts` : 'All caught up!'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                onClick={onMarkAllAsRead}
              >
                <CheckCheck size={13} color="#34d399" />
                <span>Mark All Read</span>
              </button>
            )}
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(11,17,32,0.8)' }}>
          {['ALL', 'UNREAD', 'TRIP', 'ANNOUNCEMENTS'].map(tab => (
            <button
              key={tab}
              type="button"
              style={{
                background: filter === tab ? 'rgba(56,189,248,0.2)' : 'transparent',
                border: `1px solid ${filter === tab ? '#38bdf8' : 'transparent'}`,
                color: filter === tab ? '#ffffff' : 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notification Stream */}
        <div style={{ padding: '16px 20px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No notifications matching this filter.
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const isTrip = notif.type === 'TRIP_STARTED' || notif.type === 'BUS_NEARBY';
              const isDelay = notif.type === 'DELAY' || notif.type === 'CANCELLED';
              const isAnnouncement = notif.type === 'ANNOUNCEMENT';

              let borderColor = '#38bdf8';
              let badgeBg = 'rgba(56,189,248,0.15)';
              if (isDelay) { borderColor = '#f43f5e'; badgeBg = 'rgba(244,63,94,0.15)'; }
              else if (isAnnouncement) { borderColor = '#a855f7'; badgeBg = 'rgba(168,85,247,0.15)'; }

              return (
                <div
                  key={notif.id}
                  style={{
                    background: notif.isRead ? 'rgba(13,20,36,0.5)' : 'rgba(18,28,52,0.85)',
                    borderLeft: `4px solid ${borderColor}`,
                    border: '1px solid var(--border-subtle)',
                    borderLeftWidth: '4px',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => onMarkAsRead(notif.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {!notif.isRead && (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8' }} />
                      )}
                      <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>{notif.title}</strong>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {formatTimeAgo(notif.timestamp)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      background: badgeBg,
                      color: borderColor,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {notif.type.replace('_', ' ')}
                    </span>

                    {!notif.isRead && (
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Tap to mark read</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
