import React, { useState } from 'react';
import { ShieldAlert, Activity, Users, Clock, Zap, Check, AlertCircle, RefreshCw, FileText, Download, CreditCard } from 'lucide-react';
import FleetStatusCard from './FleetStatusCard';
import StudentManifestModal from './StudentManifestModal';
import AdminSubscriptionHub from './AdminSubscriptionHub';

export default function AdminOpsDashboard({
  buses = [],
  routes = [],
  stops = [],
  alerts = [],
  timetableSurges = [],
  onTriggerIncident,
  onResolveAlert,
  onOpenCopilot,
  onOpenManageModal,
  selectedBusId,
  onSelectBus
}) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('FLEET'); // 'FLEET' | 'SUBSCRIPTIONS'

  const activeCount = buses.filter(b => b.tripActive || b.status === 'EN_ROUTE').length;
  const standbyCount = buses.filter(b => b.status === 'STANDBY').length;
  const incidentCount = buses.filter(b => b.status === 'BREAKDOWN' || b.status === 'DELAYED').length;
  const totalPax = buses.reduce((acc, b) => acc + (b.currentOccupancy || 0), 0);
  const avgSafety = Math.round(
    buses.reduce((acc, b) => acc + (b.telematics ? b.telematics.safetyScore : 95), 0) / (buses.length || 1)
  );

  const filteredBuses = buses.filter(b => {
    if (activeFilter === 'INCIDENTS') return b.status === 'BREAKDOWN' || b.status === 'DELAYED';
    if (activeFilter === 'ACTIVE') return b.tripActive || b.status === 'EN_ROUTE';
    if (activeFilter === 'STANDBY') return b.status === 'STANDBY';
    return true;
  });

  const handleExportCSV = () => {
    window.open('http://localhost:5000/api/admin/export-csv', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Admin Action Ribbon */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="neo-btn neo-btn-cyan"
          style={{
            flex: '1 1 180px',
            padding: '10px 14px',
            fontSize: '0.82rem',
            justifyContent: 'center',
            fontWeight: 900,
            letterSpacing: '0.02em'
          }}
          onClick={() => setIsManifestOpen(true)}
        >
          <Users size={16} />
          <span>200 Students Shift Manifest</span>
        </button>

        <button
          type="button"
          className={activeTab === 'SUBSCRIPTIONS' ? 'neo-btn neo-btn-yellow' : 'neo-btn neo-btn-purple'}
          style={{
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={() => setActiveTab(activeTab === 'SUBSCRIPTIONS' ? 'FLEET' : 'SUBSCRIPTIONS')}
        >
          <CreditCard size={16} />
          <span>Student Subscriptions (INR ₹)</span>
        </button>

        <button
          type="button"
          className="neo-btn neo-btn-purple"
          style={{
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 900
          }}
          onClick={onOpenManageModal}
        >
          <Activity size={16} />
          <span>Fleet CRUD Ops</span>
        </button>

        <button
          type="button"
          className="neo-btn-outline"
          style={{
            padding: '10px 14px',
            fontSize: '0.82rem',
            fontWeight: 900,
            background: '#15223c',
            border: '2px solid #283e66',
            color: '#f8fafc'
          }}
          onClick={handleExportCSV}
          title="Export CSV Analytics Report"
        >
          <Download size={15} color="#38bdf8" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Operations View Mode Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('FLEET')}
          style={{
            padding: '9px 14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'FLEET' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.5)',
            color: activeTab === 'FLEET' ? '#38bdf8' : '#94a3b8',
            border: `1px solid ${activeTab === 'FLEET' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            boxShadow: activeTab === 'FLEET' ? '0 2px 10px rgba(56, 189, 248, 0.15)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <Activity size={15} />
          <span>Fleet Live Telematics ({activeCount} Active)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SUBSCRIPTIONS')}
          style={{
            padding: '9px 14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'SUBSCRIPTIONS' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.5)',
            color: activeTab === 'SUBSCRIPTIONS' ? '#fbbf24' : '#94a3b8',
            border: `1px solid ${activeTab === 'SUBSCRIPTIONS' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
            boxShadow: activeTab === 'SUBSCRIPTIONS' ? '0 2px 10px rgba(245, 158, 11, 0.15)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <CreditCard size={15} />
          <span>Student Subscriptions & Approvals (INR ₹)</span>
        </button>
      </div>

      {activeTab === 'SUBSCRIPTIONS' ? (
        <AdminSubscriptionHub />
      ) : (
        <>
          {/* Metric Bento Tiles Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}>
            {/* Active Corridors */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                Active Corridors
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#38bdf8', margin: '4px 0' }}>
                {activeCount}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500 }}>
                + {standbyCount} in Standby Depot
              </span>
            </div>

            {/* Total Boarded */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                Total Boarded
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#34d399', margin: '4px 0' }}>
                {totalPax}
              </div>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500 }}>
                Live Passenger Load
              </span>
            </div>

            {/* Fleet Safety Score */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                Fleet Safety Score
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: avgSafety >= 90 ? '#34d399' : '#fbbf24', margin: '4px 0' }}>
                {avgSafety}%
              </div>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1', fontWeight: 500 }}>
                AI Telematics Audit
              </span>
            </div>

            {/* Incident Queue */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8' }}>
                Incident Queue
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: incidentCount > 0 ? '#f43f5e' : '#94a3b8', margin: '4px 0' }}>
                {incidentCount}
              </div>
              <span style={{ fontSize: '0.7rem', color: incidentCount > 0 ? '#fca5a5' : '#cbd5e1', fontWeight: 500 }}>
                {incidentCount > 0 ? `${incidentCount} Issues Active` : 'Nominal Operations'}
              </span>
            </div>
          </div>

      {/* Real-Time AI Incident & Dispatch Stream */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <Zap size={18} color="#c084fc" />
            <span>AI Operations & Incident Stream</span>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            background: alerts.length > 0 ? 'rgba(244,63,94,0.18)' : 'rgba(16,185,129,0.18)',
            color: alerts.length > 0 ? '#fca5a5' : '#6ee7b7',
            border: `1.5px solid ${alerts.length > 0 ? '#f43f5e' : '#10b981'}`,
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {alerts.length} Active Events
          </span>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8', fontSize: '0.84rem' }}>
              <ShieldAlert size={30} color="#10b981" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
              <div>All Navrachana University Vadodara corridors operating within nominal schedule.</div>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? '#f43f5e' : alert.severity === 'WARNING' ? '#f59e0b' : '#38bdf8'}`,
                  boxShadow: 'var(--shadow-xs)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '2px' }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                    Source: {alert.source || 'AI Ops Monitor'}
                  </div>
                </div>

                <button
                  type="button"
                  className="neo-btn-outline"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399'
                  }}
                  onClick={() => onResolveAlert(alert.id)}
                  title="Dismiss or mark resolved"
                >
                  <Check size={13} color="#10b981" />
                  <span>Dismiss</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Timetable Demand Surge Forecast */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <Clock size={16} color="#38bdf8" />
            <span>Timetable Demand Surge Forecast</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
            Campus Sync Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {timetableSurges.map((surge, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(15, 23, 42, 0.55)',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'var(--shadow-xs)',
                fontSize: '0.82rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>{surge.label}</strong>
                <span style={{
                  color: '#c084fc',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  background: 'rgba(192,132,252,0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  {surge.timeSlot}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>
                {surge.reason}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#38bdf8' }}>
                  Surge Multiplier: <strong style={{ color: '#ffffff' }}>{surge.projectedDemandMultiplier}x</strong>
                </span>
                <span style={{ color: '#34d399' }}>
                  Standby Suggested: <strong style={{ color: '#ffffff' }}>+{surge.recommendedExtraBuses} buses</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Telematics List */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <Activity size={16} color="#34d399" />
            <span>Fleet Telematics & Live Roster</span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'ACTIVE', 'INCIDENTS', 'STANDBY'].map(tab => {
              const isSelected = activeFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                    color: isSelected ? '#34d399' : '#cbd5e1',
                    border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    boxShadow: isSelected ? '0 1px 6px rgba(16, 185, 129, 0.2)' : 'none',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredBuses.map(bus => (
            <FleetStatusCard
              key={bus.id}
              bus={bus}
              routes={routes}
              stops={stops}
              isSelected={bus.id === selectedBusId}
              onTriggerIncident={onTriggerIncident}
              onClick={() => onSelectBus(bus.id)}
            />
          ))}
          </div>
        </div>
      </>
    )}

      {/* 200 Students Shift Manifest Modal */}
      <StudentManifestModal
        isOpen={isManifestOpen}
        onClose={() => setIsManifestOpen(false)}
      />
    </div>
  );
}
