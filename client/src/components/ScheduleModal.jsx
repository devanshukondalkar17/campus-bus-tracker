import React, { useState } from 'react';
import { X, Clock, Calendar, MapPin, Bus, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, BookmarkCheck } from 'lucide-react';

export default function ScheduleModal({ isOpen, onClose, schedules = [], onOpenBooking }) {
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [activeShiftFilter, setActiveShiftFilter] = useState('ALL');

  if (!isOpen) return null;

  const currentSchedule = schedules[selectedRouteIdx] || schedules[0] || {};
  const shifts = currentSchedule.shifts || {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" style={{ maxWidth: '850px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16,24,44,0.98)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(56,189,248,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={22} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>NUV Campus Bus Schedule & Academic Timetable</span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '12px', border: '1px solid #10b981' }}>
                  4 Buses • 55 Seats Each
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Synchronized for Regular (10:00-17:00), Electives (08:00-10:00 & 17:00-19:00), and 1:00-2:00 PM Break Commutes
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Corridor Selection Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {schedules.map((s, idx) => {
              const isSelected = selectedRouteIdx === idx;
              const busName = s.busCallsign || `Bus ${idx + 1}`;
              return (
                <button
                  key={s.routeId || idx}
                  type="button"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? '#38bdf8' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => setSelectedRouteIdx(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: isSelected ? '#38bdf8' : '#e2e8f0' }}>
                      {busName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>55 Seats</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.coverageAreas || s.routeName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Academic Timetable Alignment Guide */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.8))',
            borderRadius: '10px',
            border: '1px solid rgba(56,189,248,0.2)',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#38bdf8" />
                <span>How This Schedule Matches the University Timetable</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                200 Enrolled Students (50 per Corridor)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', fontSize: '0.75rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>🌅 07:00 AM Inbound</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Early Morning Arrival</div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>
                  Pickup from home stop ~07:15 AM → Arrives at Campus ~07:50 AM
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                <div style={{ color: '#34d399', fontWeight: 700, marginBottom: '2px' }}>☀️ 09:00 AM Inbound</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Regular Morning Arrival</div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>
                  Pickup from home stop ~09:00 AM → Arrives at Campus ~09:45 AM
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '2px' }}>🥪 01:00 PM Inbound</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Afternoon Session Arrival</div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>
                  Pickup from home stop ~01:15 PM → Arrives at Campus ~01:55 PM
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #a855f7' }}>
                <div style={{ color: '#a855f7', fontWeight: 700, marginBottom: '2px' }}>🌙 07:00 PM Outbound</div>
                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>Evening Campus Dispersal</div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '4px' }}>
                  Departs Navrachana Central Bay at <strong>07:00 PM sharp</strong> to home stops
                </div>
              </div>
            </div>
          </div>

          {/* Shift Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center', marginRight: '4px' }}>Filter:</span>
            {[
              { id: 'ALL', label: 'All 6 Shifts' },
              { id: 'ELECTIVE_MORNING', label: '08:00 AM Elective' },
              { id: 'REGULAR_MORNING', label: '10:00 AM Regular' },
              { id: 'BREAK', label: '🥪 1:00-2:00 PM Break Shuttles' },
              { id: 'REGULAR_EVENING', label: '05:00 PM Dispersal' },
              { id: 'ELECTIVE_EVENING', label: '07:00 PM Late Elective' }
            ].map(filter => (
              <button
                key={filter.id}
                type="button"
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${activeShiftFilter === filter.id ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: activeShiftFilter === filter.id ? 'rgba(56,189,248,0.2)' : 'rgba(0,0,0,0.2)',
                  color: activeShiftFilter === filter.id ? '#ffffff' : '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setActiveShiftFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Stops Timetable Table */}
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Corridor Stop</th>
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'ELECTIVE_MORNING') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#f59e0b' }}>
                      Early Inbound<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(For 08:00 AM Elective)</span>
                    </th>
                  )}
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'REGULAR_MORNING') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#34d399' }}>
                      Regular Inbound<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(For 10:00 AM Class)</span>
                    </th>
                  )}
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'BREAK') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', background: 'rgba(56,189,248,0.08)' }}>
                      🥪 Break Early Exit<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(Leaves 01:05 PM)</span>
                    </th>
                  )}
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'BREAK') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', background: 'rgba(56,189,248,0.08)' }}>
                      🥪 Afternoon Arrival<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(Reaches 01:55 PM)</span>
                    </th>
                  )}
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'REGULAR_EVENING') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#93c5fd' }}>
                      Regular Outbound<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(Leaves 05:15 PM)</span>
                    </th>
                  )}
                  {(activeShiftFilter === 'ALL' || activeShiftFilter === 'ELECTIVE_EVENING') && (
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: '#c084fc' }}>
                      Late Elective Exit<br />
                      <span style={{ fontSize: '0.66rem', fontWeight: 400 }}>(Leaves 07:15 PM)</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(currentSchedule.stopsSchedule || []).map((stop, i) => {
                  const isCampus = stop.stopName.includes('Navrachana University');
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isCampus ? 'rgba(56,189,248,0.06)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: isCampus ? 800 : 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={14} color={isCampus ? '#34d399' : '#38bdf8'} />
                          <span>{stop.stopName}</span>
                          {isCampus && (
                            <span style={{ fontSize: '0.65rem', background: 'rgba(52,211,153,0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>
                              Campus Terminal
                            </span>
                          )}
                        </div>
                      </td>

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'ELECTIVE_MORNING') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#f59e0b', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {stop.earlyMorningEta || '—'}
                        </td>
                      )}

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'REGULAR_MORNING') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {stop.regularMorningEta || '—'}
                        </td>
                      )}

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'BREAK') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontFamily: 'var(--font-mono)', background: 'rgba(56,189,248,0.05)', fontWeight: 600 }}>
                          {stop.middayExitDropEta || '—'}
                        </td>
                      )}

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'BREAK') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#38bdf8', fontFamily: 'var(--font-mono)', background: 'rgba(56,189,248,0.05)', fontWeight: 600 }}>
                          {stop.middayArrivalEta || '—'}
                        </td>
                      )}

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'REGULAR_EVENING') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>
                          {stop.regularEveningEta || '—'}
                        </td>
                      )}

                      {(activeShiftFilter === 'ALL' || activeShiftFilter === 'ELECTIVE_EVENING') && (
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                          {stop.lateEveningEta || '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick Booking Callout */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
            borderRadius: '8px',
            border: '1px solid rgba(56,189,248,0.3)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.84rem' }}>
                Need to travel during 1:00 PM - 2:00 PM Break?
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                Students who want to leave early at lunch or arrive for afternoon classes can book the Midday Shuttle in 1 click.
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.78rem' }}
              onClick={() => {
                onClose();
                if (onOpenBooking) onOpenBooking();
              }}
            >
              <span>Book Midday Break Shuttle</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
