import React, { useState } from 'react';
import { X, Check, Armchair, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playAlertChime } from '../utils/geoHelpers';

export default function SeatMapModal({ isOpen, onClose, bus, onSeatUpdated }) {
  const { currentUser, reserveSeat, cancelSeat } = useAuth();
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen || !bus) return null;

  const reservedSeats = bus.reservedSeats || [];
  const mySeat = currentUser ? currentUser.bookedSeatNumber : null;

  // 55-Seat Capacity: 13 rows of 4 seats (52) + rear row 14 with 3 seats (55 total)
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const handleSeatClick = (seatCode) => {
    if (reservedSeats.includes(seatCode) && seatCode !== mySeat) {
      setFeedback({ type: 'error', message: `Seat ${seatCode} is already booked by another student.` });
      return;
    }
    setSelectedSeat(seatCode);
    setFeedback(null);
  };

  const handleConfirmReservation = async () => {
    if (!selectedSeat) return;
    setLoading(true);
    setFeedback(null);

    try {
      await reserveSeat(selectedSeat, bus.id);
      playAlertChime('DISPATCH');
      setFeedback({ type: 'success', message: `Seat ${selectedSeat} confirmed on ${bus.callsign}!` });
      if (onSeatUpdated) onSeatUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Seat booking failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    setLoading(true);
    try {
      await cancelSeat();
      setSelectedSeat(null);
      setFeedback({ type: 'success', message: 'Your seat has been released.' });
      if (onSeatUpdated) onSeatUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="copilot-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(16,24,44,0.95)'
        }}>
          <div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Armchair size={18} color="#38bdf8" />
              <span>Interactive Seat Map (2x2 Layout)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              {bus.callsign} ({bus.numberPlate}) • {bus.seatedCapacity - reservedSeats.length} seats remaining
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '16px',
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.3)',
            padding: '8px 12px',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'rgba(16,185,129,0.3)', border: '1px solid #10b981' }} />
              <span style={{ color: '#a7f3d0' }}>Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'rgba(56,189,248,0.4)', border: '2px solid #38bdf8' }} />
              <span style={{ color: '#bae6fd' }}>Your Seat</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 14, height: 14, borderRadius: '4px', background: 'rgba(244,63,94,0.2)', border: '1px solid #f43f5e' }} />
              <span style={{ color: '#fca5a5' }}>Reserved</span>
            </div>
          </div>

          {feedback && (
            <div style={{
              background: feedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)',
              border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#f43f5e'}`,
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              marginBottom: '14px',
              textAlign: 'center'
            }}>
              {feedback.message}
            </div>
          )}

          {/* Bus Cabin Interior Representation */}
          <div style={{
            background: '#090f1d',
            border: '2px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px 14px',
            position: 'relative',
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
            {/* Front Windshield & Driver Cab */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px dashed rgba(255,255,255,0.12)',
              paddingBottom: '12px',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ENTRY DOOR [DOOR 1]</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#f1f5f9' }}>👨‍✈️ Driver: {bus.driver ? bus.driver.name.split(' ')[0] : 'Driver'}</span>
              </div>
            </div>

            {/* Seat Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {rows.map(rowNum => {
                const seatA = `${rowNum}A`;
                const seatB = `${rowNum}B`;
                const seatC = `${rowNum}C`;
                const seatD = `${rowNum}D`;

                const renderSeatBtn = (seatCode) => {
                  const isMySeat = mySeat === seatCode;
                  const isReserved = reservedSeats.includes(seatCode);
                  const isCurrentlySelected = selectedSeat === seatCode;

                  let bg = 'rgba(16,185,129,0.1)';
                  let border = 'rgba(16,185,129,0.3)';
                  let color = '#34d399';

                  if (isMySeat || isCurrentlySelected) {
                    bg = 'rgba(56,189,248,0.35)';
                    border = '#38bdf8';
                    color = '#ffffff';
                  } else if (isReserved) {
                    bg = 'rgba(244,63,94,0.15)';
                    border = 'rgba(244,63,94,0.35)';
                    color = '#f87171';
                  }

                  return (
                    <button
                      key={seatCode}
                      type="button"
                      disabled={isReserved && !isMySeat}
                      onClick={() => handleSeatClick(seatCode)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        border: `1px solid ${border}`,
                        background: bg,
                        color: color,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: (isReserved && !isMySeat) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      title={isReserved ? `Seat ${seatCode} (Reserved)` : `Select Seat ${seatCode}`}
                    >
                      {seatCode}
                    </button>
                  );
                };

                if (rowNum === 14) {
                  return (
                    <div key={rowNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {renderSeatBtn(seatA)}
                        {renderSeatBtn(seatB)}
                      </div>
                      <div style={{ width: '32px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        R14
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {renderSeatBtn(seatC)}
                        <div style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#64748b' }}>
                          EXIT
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={rowNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {/* Left 2 Seats (A, B) */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {renderSeatBtn(seatA)}
                      {renderSeatBtn(seatB)}
                    </div>

                    {/* Center Aisle */}
                    <div style={{ width: '32px', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      R{rowNum}
                    </div>

                    {/* Right 2 Seats (C, D) */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {renderSeatBtn(seatC)}
                      {renderSeatBtn(seatD)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            {mySeat && (
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, borderColor: '#f43f5e', color: '#fca5a5' }}
                onClick={handleCancelReservation}
                disabled={loading}
              >
                Release Seat ({mySeat})
              </button>
            )}

            <button
              type="button"
              className="btn-primary"
              style={{ flex: 2 }}
              onClick={handleConfirmReservation}
              disabled={loading || !selectedSeat || selectedSeat === mySeat}
            >
              <Check size={16} />
              <span>{loading ? 'Confirming...' : selectedSeat ? `Confirm Seat ${selectedSeat}` : 'Select an Available Seat'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
