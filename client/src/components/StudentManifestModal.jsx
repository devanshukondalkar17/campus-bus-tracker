import React, { useState, useEffect } from 'react';
import { X, Users, Search, Filter, Bus, Clock, Calendar, CheckCircle2, BookmarkCheck } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export default function StudentManifestModal({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBusFilter, setSelectedBusFilter] = useState('ALL');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API_BASE}/student/roster`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStudents(data.students || []);
          setSummary(data.summary || null);
        }
      })
      .catch(err => console.error('Failed to load roster:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredStudents = students.filter(s => {
    if (selectedBusFilter !== 'ALL' && s.assignedBusId !== selectedBusFilter) return false;
    if (selectedShiftFilter === 'EARLY_8AM' && s.morningShift !== 'EARLY_8AM') return false;
    if (selectedShiftFilter === 'REGULAR_10AM' && s.morningShift !== 'REGULAR_10AM') return false;
    if (selectedShiftFilter === 'MIDDAY_BREAK_1PM' && s.returnShift !== 'MIDDAY_BREAK_1PM') return false;
    if (selectedShiftFilter === 'AFTERNOON_2PM' && s.morningShift !== 'AFTERNOON_2PM') return false;
    if (selectedShiftFilter === 'REGULAR_5PM' && s.returnShift !== 'REGULAR_5PM') return false;
    if (selectedShiftFilter === 'LATE_7PM' && s.returnShift !== 'LATE_7PM') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.rollNumber && s.rollNumber.toLowerCase().includes(q);
      const matchArea = s.areaName && s.areaName.toLowerCase().includes(q);
      return matchName || matchRoll || matchArea;
    }
    return true;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" style={{ maxWidth: '950px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16,24,44,0.98)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>200 Students Commute Shift Manifest & Fleet Allocation</span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px' }}>
                  4 Buses • 55 Seats Each
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Complete roster of all 200 enrolled students with designated arrival shifts (07:00 AM, 09:00 AM, 01:00 PM) and evening departure (07:00 PM)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Summary Stats */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>TOTAL STUDENTS</span>
                <strong style={{ fontSize: '1.2rem', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{summary.totalStudents || 200}</strong>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>50 / corridor</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>🌅 07:00 AM ARRIVAL</span>
                <strong style={{ fontSize: '1.2rem', color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>{summary.morningElective8AM || 62}</strong>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Early Commute</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #34d399' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>☀️ 09:00 AM ARRIVAL</span>
                <strong style={{ fontSize: '1.2rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>{summary.regularClass10AM || 104}</strong>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Standard Peak</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>🍱 01:00 PM ARRIVAL</span>
                <strong style={{ fontSize: '1.2rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{summary.middayAfternoonInbound || 34}</strong>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Afternoon Shift</span>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #c084fc' }}>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block' }}>🌙 07:00 PM DEPARTURE</span>
                <strong style={{ fontSize: '1.2rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>200</strong>
                <span style={{ fontSize: '0.66rem', color: '#94a3b8', display: 'block' }}>Campus Dispersal</span>
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search by student name, roll number, or area (e.g. Sayajigunj, Gotri)..."
                style={{
                  width: '100%',
                  background: 'rgba(13,19,34,0.95)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  padding: '7px 10px 7px 32px',
                  fontSize: '0.78rem'
                }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              style={{
                background: 'rgba(13,19,34,0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '7px 10px',
                fontSize: '0.78rem'
              }}
              value={selectedBusFilter}
              onChange={e => setSelectedBusFilter(e.target.value)}
            >
              <option value="ALL">All 4 Buses (200 Students)</option>
              <option value="bus-01">Bus 1: Central East (Sayajigunj)</option>
              <option value="bus-02">Bus 2: North Hub (Fatehgunj)</option>
              <option value="bus-03">Bus 3: South Hub (Manjalpur)</option>
              <option value="bus-04">Bus 4: West Corridor (Subhanpura)</option>
            </select>

            <select
              style={{
                background: 'rgba(13,19,34,0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#ffffff',
                padding: '7px 10px',
                fontSize: '0.78rem'
              }}
              value={selectedShiftFilter}
              onChange={e => setSelectedShiftFilter(e.target.value)}
            >
              <option value="ALL">All Shifts</option>
              <option value="EARLY_8AM">🌅 Morning Elective (08:00 AM)</option>
              <option value="REGULAR_10AM">☀️ Regular Class (10:00 AM)</option>
              <option value="MIDDAY_BREAK_1PM">🥪 Break Early Exit (01:05 PM)</option>
              <option value="AFTERNOON_2PM">🍱 Afternoon Arrival (01:15 PM)</option>
              <option value="REGULAR_5PM">🌆 Regular Dispersal (05:15 PM)</option>
              <option value="LATE_7PM">🌙 Late Elective (07:15 PM)</option>
            </select>
          </div>

          {/* Student Table */}
          <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Roll No</th>
                  <th style={{ padding: '8px 10px' }}>Student Name</th>
                  <th style={{ padding: '8px 10px' }}>Assigned Bus</th>
                  <th style={{ padding: '8px 10px' }}>Area & Pickup Stop</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Electives Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Active Shifts</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Midday Booking</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                      Loading 200 student records...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
                      No students matching current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(s => {
                    const busNum = s.assignedBusId === 'bus-01' ? 'Bus 1' : s.assignedBusId === 'bus-02' ? 'Bus 2' : s.assignedBusId === 'bus-03' ? 'Bus 3' : 'Bus 4';
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', color: '#38bdf8', fontWeight: 700 }}>
                          {s.rollNumber}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#ffffff', fontWeight: 600 }}>
                          {s.name}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#e2e8f0' }}>
                          <span style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {busNum}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                          <span style={{ color: '#f1f5f9' }}>{s.areaName || 'Vadodara Area'}</span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {s.hasMorningElective && s.hasEveningElective ? (
                            <span style={{ fontSize: '0.68rem', background: 'rgba(168,85,247,0.2)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px' }}>
                              8-10 & 5-7 Electives
                            </span>
                          ) : s.hasMorningElective ? (
                            <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>
                              8-10 AM Elective
                            </span>
                          ) : s.hasEveningElective ? (
                            <span style={{ fontSize: '0.68rem', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', padding: '2px 6px', borderRadius: '4px' }}>
                              5-7 PM Elective
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              Regular (10-5)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                          <span style={{ color: s.morningShift === 'EARLY_8AM' ? '#f59e0b' : '#34d399' }}>
                            {s.morningShift === 'EARLY_8AM' ? '07:50 AM In' : s.morningShift === 'AFTERNOON_2PM' ? '01:55 PM In' : '09:45 AM In'}
                          </span>
                          {' → '}
                          <span style={{ color: s.returnShift === 'MIDDAY_BREAK_1PM' ? '#38bdf8' : s.returnShift === 'LATE_7PM' ? '#c084fc' : '#93c5fd' }}>
                            {s.returnShift === 'MIDDAY_BREAK_1PM' ? '01:05 PM Out' : s.returnShift === 'LATE_7PM' ? '07:15 PM Out' : '05:15 PM Out'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {s.middayBooking ? (
                            <span style={{
                              fontSize: '0.68rem',
                              background: s.middayBooking.type === 'EARLY_EXIT' ? 'rgba(56,189,248,0.2)' : 'rgba(16,185,129,0.2)',
                              color: s.middayBooking.type === 'EARLY_EXIT' ? '#38bdf8' : '#34d399',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              {s.middayBooking.type === 'EARLY_EXIT' ? '🥪 1:05 PM Exit' : '🍱 1:15 PM Inbound'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>None</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
