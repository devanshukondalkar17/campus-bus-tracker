import React from 'react';
import { Bus, Users, Gauge, BatteryCharging, AlertTriangle, ShieldCheck, CheckCircle2, Navigation } from 'lucide-react';

export default function FleetStatusCard({ bus, routes = [], stops = [], onTriggerIncident, isSelected, onClick }) {
  const route = routes.find(r => r.id === bus.routeId);
  const nextStop = stops.find(s => s.id === bus.nextStopId);
  
  const occupancyPercent = Math.round(((bus.currentOccupancy || 0) / (bus.capacity || 50)) * 100);
  let occupancyClass = 'fill-emerald';
  if (occupancyPercent >= 85) occupancyClass = 'fill-crimson';
  else if (occupancyPercent >= 60) occupancyClass = 'fill-amber';

  const isBreakdown = bus.status === 'BREAKDOWN';
  const isDelayed = bus.status === 'DELAYED';
  const isStandby = bus.status === 'STANDBY';
  const isMoving = (bus.tripActive || bus.status === 'EN_ROUTE') && (bus.speedKmH || 0) > 0 && !isBreakdown;

  const cardBorderColor = isBreakdown ? '#f43f5e' : isDelayed ? '#f59e0b' : route ? route.color : '#38bdf8';

  return (
    <div
      style={{
        background: isSelected ? 'rgba(14, 38, 64, 0.75)' : 'rgba(19, 28, 49, 0.55)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
        borderLeft: `3px solid ${cardBorderColor}`,
        boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.2), var(--shadow-sm)' : 'var(--shadow-xs)',
        borderRadius: '12px',
        padding: '14px',
        marginBottom: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: '6px',
            background: isMoving ? '#064e3b' : '#1e293b',
            border: `1.5px solid ${isMoving ? '#10b981' : '#334155'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px'
          }}>
            🚌
          </div>
          <div>
            <strong style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 900 }}>{bus.callsign}</strong>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              {bus.numberPlate}
            </div>
          </div>
        </div>

        {/* Status Pill Badge */}
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          padding: '3px 8px',
          borderRadius: '6px',
          background: isBreakdown ? 'rgba(244,63,94,0.2)' : isDelayed ? 'rgba(245,158,11,0.2)' : isMoving ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.15)',
          color: isBreakdown ? '#fda4af' : isDelayed ? '#fde047' : isMoving ? '#6ee7b7' : '#cbd5e1',
          border: `1.5px solid ${isBreakdown ? '#f43f5e' : isDelayed ? '#f59e0b' : isMoving ? '#10b981' : '#475569'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isBreakdown ? '#f43f5e' : isDelayed ? '#f59e0b' : isMoving ? '#10b981' : '#94a3b8',
            boxShadow: isMoving ? '0 0 6px #10b981' : 'none'
          }} />
          {isMoving ? 'MOVING' : bus.status.replace('_', ' ')}
        </span>
      </div>

      {/* Corridor & Next Scheduled Stop */}
      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Corridor:</span>
          <strong style={{ color: '#ffffff' }}>{route ? route.name : 'Standby Reserve'}</strong>
        </div>
        {nextStop && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
            <span>Next Stop:</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>
              {nextStop.name} in <strong style={{ color: '#ffffff' }}>{bus.etaMinutesNextStop || 1}m</strong>
            </span>
          </div>
        )}
      </div>

      {/* Occupancy Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
          <span style={{ color: '#94a3b8' }}>Passenger Occupancy</span>
          <span style={{ color: '#ffffff', fontWeight: 800 }}>
            {bus.currentOccupancy} / {bus.capacity} seats ({occupancyPercent}%)
          </span>
        </div>
        <div className="progress-bar-container" style={{ height: '8px' }}>
          <div
            className={`progress-bar-fill ${occupancyClass}`}
            style={{ width: `${Math.min(100, occupancyPercent)}%` }}
          />
        </div>
      </div>

      {/* Telematics Triple Stat Metric Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '6px',
        marginTop: '10px',
        padding: '7px 10px',
        background: '#0a1222',
        border: '1.5px solid #1e2c46',
        borderRadius: '6px',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        textAlign: 'center'
      }}>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.65rem' }}>SPEED</span>
          <div style={{ color: isMoving ? '#34d399' : '#ffffff', fontWeight: 800 }}>
            {bus.speedKmH || 0} km/h
          </div>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.65rem' }}>SAFETY</span>
          <div style={{ color: '#38bdf8', fontWeight: 800 }}>
            {bus.telematics ? bus.telematics.safetyScore : 98}/100
          </div>
        </div>
        <div>
          <span style={{ color: '#64748b', fontSize: '0.65rem' }}>FUEL/BAT</span>
          <div style={{ color: '#facc15', fontWeight: 800 }}>
            {bus.telematics ? bus.telematics.batteryOrFuel : 85}%
          </div>
        </div>
      </div>

      {/* Quick Incident Simulation Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
        {bus.status === 'EN_ROUTE' ? (
          <>
            <button
              type="button"
              className="neo-btn-outline"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '0.72rem',
                justifyContent: 'center',
                gap: '5px',
                background: '#15223c',
                border: '1.5px solid #d97706',
                color: '#facc15'
              }}
              onClick={() => onTriggerIncident(bus.id, 'DELAY')}
              title="Simulate sudden traffic congestion"
            >
              <AlertTriangle size={13} color="#f59e0b" />
              <span>Sim Delay</span>
            </button>
            <button
              type="button"
              className="neo-btn neo-btn-danger"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '0.72rem',
                justifyContent: 'center',
                gap: '5px'
              }}
              onClick={() => onTriggerIncident(bus.id, 'BREAKDOWN')}
              title="Simulate sudden mechanical breakdown"
            >
              <AlertTriangle size={13} color="#ffffff" />
              <span>Breakdown</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            className="neo-btn neo-btn-emerald"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.78rem',
              justifyContent: 'center',
              fontWeight: 900
            }}
            onClick={() => onTriggerIncident(bus.id, 'RESTORE')}
          >
            <CheckCircle2 size={15} />
            <span>Restore Active Service</span>
          </button>
        )}
      </div>
    </div>
  );
}
