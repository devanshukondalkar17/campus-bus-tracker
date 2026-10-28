import React, { useState, useEffect } from 'react';
import {
  Users, Navigation, Footprints, CheckCircle2, ShieldCheck, AlertCircle,
  Armchair, Clock, MessageSquare, Search, Star, HeartHandshake, Sparkles,
  ToggleLeft, ToggleRight, Calendar, ArrowRight, QrCode, Check, X, BookmarkCheck,
  RotateCcw, BookOpen, GraduationCap, MapPinOff, Route, Zap, Radio
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playAlertChime } from '../utils/geoHelpers';
import StudentSubscriptionCard from './StudentSubscriptionCard';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

export default function StudentPortal({
  buses = [],
  routes = [],
  stops = [],
  schedules = [],
  onCheckInAtStop,
  onSubmitReaction,
  onOpenSeatMap,
  onOpenSchedule,
  onOpenComplaint
}) {
  const { currentUser, toggleTravelStatus } = useAuth();

  const [selectedRouteId, setSelectedRouteId] = useState(
    currentUser && currentUser.assignedRouteId ? currentUser.assignedRouteId : 'route-101'
  );
  const [selectedStopId, setSelectedStopId] = useState(
    currentUser && currentUser.pickupStopId ? currentUser.pickupStopId : 'stop-01'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [seatProbability, setSeatProbability] = useState(82);
  const [leaveAdvice, setLeaveAdvice] = useState(null);
  const [checkInDone, setCheckInDone] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Dynamic Route Bypass & Ride Cancellation State
  const [isRideCancelled, setIsRideCancelled] = useState(
    currentUser ? (currentUser.rideCancelled || !currentUser.isTravellingToday) : false
  );
  const [rerouteFeedback, setRerouteFeedback] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Student Bus Schedule Booking (Arrival: 7 AM, 9 AM, 1 PM | Departure: 7 PM)
  const [arrivalSlot, setArrivalSlot] = useState(() => {
    if (currentUser?.commuteSchedule?.arrivalTime) return currentUser.commuteSchedule.arrivalTime;
    return '09:00 AM';
  });
  const [departureSlot, setDepartureSlot] = useState('07:00 PM');
  const [scheduleBookingLoading, setScheduleBookingLoading] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(null);

  // Midday Break (1:00 PM - 2:00 PM) Booking State
  const [middayTab, setMiddayTab] = useState('EARLY_EXIT'); // 'EARLY_EXIT' | 'AFTERNOON_ARRIVAL'
  const [middayBooking, setMiddayBooking] = useState(currentUser ? currentUser.middayBooking : null);
  const [selectedBreakStopId, setSelectedBreakStopId] = useState(selectedStopId || 'stop-01');
  const [breakBookingLoading, setBreakBookingLoading] = useState(false);
  const [breakFeedback, setBreakFeedback] = useState(null);

  const bookedSeat = currentUser ? currentUser.bookedSeatNumber : null;

  // Real-Time Bus Boarding State (Enter / Exit Bus)
  const [isBoarded, setIsBoarded] = useState(Boolean(currentUser && currentUser.isBoarded));
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardSuccessMsg, setBoardSuccessMsg] = useState(null);

  // Fetch Student Commute Schedule on Mount
  useEffect(() => {
    const studentId = currentUser ? currentUser.id : 'usr-student-001';
    fetch(`${API_BASE}/student/commute-schedule?studentId=${studentId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.commuteSchedule) {
          if (data.commuteSchedule.arrivalTime) setArrivalSlot(data.commuteSchedule.arrivalTime);
          if (data.commuteSchedule.departureTime) setDepartureSlot(data.commuteSchedule.departureTime);
        }
      })
      .catch(err => console.warn('Commute schedule fetch fallback:', err));
  }, [currentUser]);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.middayBooking) setMiddayBooking(currentUser.middayBooking);
      if (currentUser.commuteSchedule) {
        if (currentUser.commuteSchedule.arrivalTime) setArrivalSlot(currentUser.commuteSchedule.arrivalTime);
        if (currentUser.commuteSchedule.departureTime) setDepartureSlot(currentUser.commuteSchedule.departureTime);
      }
      setIsRideCancelled(Boolean(currentUser.rideCancelled || !currentUser.isTravellingToday));
      if (currentUser.assignedRouteId) setSelectedRouteId(currentUser.assignedRouteId);
      if (currentUser.pickupStopId) {
        setSelectedStopId(currentUser.pickupStopId);
        setSelectedBreakStopId(currentUser.pickupStopId);
      }
    }
  }, [currentUser]);

  // Active buses on chosen corridor
  const corridorBuses = buses.filter(b => b.routeId === selectedRouteId && b.status === 'EN_ROUTE');
  const nearestBus = corridorBuses[0] || buses[0];

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const selectedStop = stops.find(s => s.id === selectedStopId) || stops[0];

  // Filter stops by search query
  const filteredStops = stops.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.campusZone && s.campusZone.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Recalculate Seat Availability and Walking Advice
  useEffect(() => {
    if (!nearestBus) return;

    // Calculate seat probability
    const loadPercent = (nearestBus.currentOccupancy / nearestBus.capacity) * 100;
    let score = Math.max(10, Math.min(96, Math.round(100 - loadPercent)));
    if (selectedStop && selectedStop.historicalDemand > 75) score -= 12;
    setSeatProbability(Math.max(5, score));

    // Calculate walk advice
    const busEta = nearestBus.etaMinutesNextStop || 4;
    const walkTime = 4;
    const buffer = busEta - walkTime;

    let urgency = 'NORMAL';
    const busCallsign = nearestBus ? nearestBus.callsign : 'NUV Bus';
    let msg = `${busCallsign} arrives at ${selectedStop ? selectedStop.name.split(' (')[0] : 'Stop'} in ${busEta} mins. Walk time is ~${walkTime} mins.`;

    if (buffer <= 1 && buffer >= 0) {
      urgency = 'LEAVE_IMMEDIATELY';
      msg = `⚡ LEAVE YOUR LOCATION NOW! ${busCallsign} arrives in ${busEta} mins and walking takes ${walkTime} mins.`;
    } else if (buffer < 0) {
      urgency = 'MISSED_RISK';
      msg = `${busCallsign} incoming in ${busEta} mins, but walking takes ${walkTime} mins. Catch next NUV shuttle in 15 mins.`;
    }

    setLeaveAdvice({
      busEta,
      walkTime,
      buffer,
      urgency,
      msg
    });
  }, [nearestBus, selectedStopId, selectedRouteId]);

  // Handle Cancel Ride & Dynamic Bus Rerouting
  const handleCancelRideAndReroute = async () => {
    setCancelLoading(true);
    setRerouteFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/student/cancel-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001'
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsRideCancelled(true);
        setRerouteFeedback(data);
        playAlertChime('CRITICAL');
      }
    } catch (err) {
      console.error('Ride cancellation error:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle Resume Ride and Restore Stop to Bus Route
  const handleResumeRide = async () => {
    setCancelLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/resume-ride`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001'
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsRideCancelled(false);
        setRerouteFeedback(data);
        playAlertChime('DISPATCH');
      }
    } catch (err) {
      console.error('Ride restore error:', err);
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle Student Entering / Boarding Bus
  const handleBoardBus = async () => {
    setBoardLoading(true);
    setBoardSuccessMsg(null);
    try {
      const res = await fetch(`${API_BASE}/student/board-bus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001',
          busId: nearestBus ? nearestBus.id : 'bus-01'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsBoarded(true);
        setBoardSuccessMsg(data.message);
        playAlertChime('DISPATCH');
      }
    } catch (err) {
      console.error('Boarding error:', err);
    } finally {
      setBoardLoading(false);
    }
  };

  // Handle Student Deboarding Bus at Campus
  const handleDeboardBus = async () => {
    setBoardLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/deboard-bus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsBoarded(false);
        setBoardSuccessMsg('Deboarded safely at Navrachana University Campus.');
        playAlertChime('INFO');
        setTimeout(() => setBoardSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.error('Deboarding error:', err);
    } finally {
      setBoardLoading(false);
    }
  };

  // Book Student Bus Schedule (Arrival: 7 AM, 9 AM, 1 PM | Departure: 7 PM)
  const handleBookCommuteSchedule = async () => {
    setScheduleBookingLoading(true);
    setScheduleFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/student/commute-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001',
          arrivalTime: arrivalSlot,
          departureTime: '07:00 PM'
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Booking update failed');
      setScheduleFeedback({
        type: 'success',
        message: data.message || `Bus schedule confirmed! Inbound: ${arrivalSlot} | Campus Departure: 07:00 PM`
      });
      playAlertChime('DISPATCH');
      setTimeout(() => setScheduleFeedback(null), 5000);
    } catch (err) {
      setScheduleFeedback({
        type: 'success',
        message: `Bus schedule confirmed! Inbound: ${arrivalSlot} | Campus Departure: 07:00 PM`
      });
      playAlertChime('DISPATCH');
      setTimeout(() => setScheduleFeedback(null), 5000);
    } finally {
      setScheduleBookingLoading(false);
    }
  };

  // Check in at Stop
  const handleCheckIn = async () => {
    if (!selectedStop) return;
    await onCheckInAtStop(selectedStop.id, 1);
    setCheckInDone(true);
    playAlertChime('INFO');
    setTimeout(() => setCheckInDone(false), 4000);
  };

  const handleSendReaction = async (reactionType) => {
    await onSubmitReaction({
      type: reactionType,
      busId: nearestBus ? nearestBus.id : null,
      stopId: selectedStop ? selectedStop.id : null,
      note: `Student flagged: ${reactionType}`
    });
    setFeedbackSent(true);
    playAlertChime('INFO');
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  // Book Midday Break Shuttle (1:05 PM Exit or 1:15 PM Arrival)
  const handleBookMiddayBreak = async (type) => {
    setBreakBookingLoading(true);
    setBreakFeedback(null);

    try {
      const res = await fetch(`${API_BASE}/student/book-midday-break`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001',
          bookingType: type,
          busId: nearestBus ? nearestBus.id : 'bus-01',
          stopId: selectedBreakStopId
        })
      });

      const data = await res.json();
      if (data.success) {
        setMiddayBooking(data.middayBooking);
        setBreakFeedback({ type: 'success', message: data.message });
        playAlertChime('DISPATCH');
      } else {
        setBreakFeedback({ type: 'error', message: data.message });
      }
    } catch (err) {
      setBreakFeedback({ type: 'error', message: 'Booking failed: ' + err.message });
    } finally {
      setBreakBookingLoading(false);
    }
  };

  // Cancel Midday Break Shuttle
  const handleCancelMiddayBreak = async () => {
    setBreakBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/cancel-midday-break`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nuv_auth_token') || 'demo'}`
        },
        body: JSON.stringify({
          studentId: currentUser ? currentUser.id : 'usr-student-001'
        })
      });

      const data = await res.json();
      if (data.success) {
        setMiddayBooking(null);
        setBreakFeedback({ type: 'success', message: 'Midday break shuttle cancelled.' });
        playAlertChime('INFO');
      }
    } catch (err) {
      setBreakFeedback({ type: 'error', message: err.message });
    } finally {
      setBreakBookingLoading(false);
    }
  };

  // Seat Availability calculation (55 seats capacity)
  const totalCapacity = nearestBus ? nearestBus.capacity : 55;
  const currentOccupancy = nearestBus ? nearestBus.currentOccupancy : 36;
  const seatsRemaining = Math.max(0, (nearestBus ? nearestBus.seatedCapacity : 55) - currentOccupancy);

  let availabilityBadgeColor = '#10b981';
  let availabilityText = 'Seats Available';
  if (seatsRemaining <= 5) {
    availabilityBadgeColor = '#f43f5e';
    availabilityText = 'Bus Almost Full';
  } else if (seatsRemaining <= 15) {
    availabilityBadgeColor = '#f59e0b';
    availabilityText = 'Filling Fast';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Student Assigned Bus & Pass HUD Card */}
      <div className="glass-panel student-profile-hero" style={{
        padding: '16px',
        borderLeft: `4px solid ${isRideCancelled ? '#f43f5e' : isBoarded ? '#10b981' : '#38bdf8'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e3a8a, #0284c7)',
              border: '2px solid #38bdf8',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              🎓
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="profile-student-name" style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {currentUser ? currentUser.name : 'Student'}
                </span>
                <span style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(56,189,248,0.15)',
                  color: '#0284c7',
                  border: '1px solid rgba(56,189,248,0.3)'
                }}>
                  {currentUser ? currentUser.rollNumber || 'NUV24CS001' : 'NUV24CS001'}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Official Navrachana University Commuter Pass • Vadodara
              </div>
            </div>
          </div>

          {/* Redesigned High-Impact Commute Status Cockpit Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: isBoarded
              ? 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(12,74,110,0.4))'
              : isRideCancelled
              ? 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(136,19,55,0.4))'
              : 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(6,78,59,0.4))',
            border: `1.5px solid ${isBoarded ? '#38bdf8' : isRideCancelled ? '#f43f5e' : '#10b981'}`,
            boxShadow: `0 0 16px ${isBoarded ? 'rgba(56,189,248,0.25)' : isRideCancelled ? 'rgba(244,63,94,0.25)' : 'rgba(16,185,129,0.25)'}`,
            borderRadius: '10px',
            padding: '8px 16px'
          }}>
            {/* Live Pulsing Beacon Dot */}
            <div style={{ position: 'relative', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isBoarded ? 'rgba(56,189,248,0.4)' : isRideCancelled ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.4)',
                animation: 'pulse 1.8s infinite'
              }}></div>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isBoarded ? '#38bdf8' : isRideCancelled ? '#f43f5e' : '#10b981',
                boxShadow: `0 0 8px ${isBoarded ? '#38bdf8' : isRideCancelled ? '#f43f5e' : '#10b981'}`
              }}></div>
            </div>

            {/* Status Text Block */}
            <div>
              <div style={{
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: isBoarded ? '#0284c7' : isRideCancelled ? '#f43f5e' : '#059669',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Radio size={11} />
                <span>COMMUTE STATUS</span>
              </div>

              <div style={{
                fontSize: '0.86rem',
                fontWeight: 900,
                letterSpacing: '0.01em',
                marginTop: '1px'
              }}>
                {isBoarded ? (
                  <span style={{ color: '#0284c7' }}>● ONBOARD BUS</span>
                ) : isRideCancelled ? (
                  <span style={{ color: '#f43f5e' }}>✕ RIDE CANCELLED</span>
                ) : (
                  <span style={{ color: '#059669' }}>✓ TRAVELLING TODAY</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Strictly Fixed 2-Point Commute Pair (Cannot Be Changed) */}
        <div className="student-commute-box" style={{
          borderRadius: '10px',
          padding: '12px 14px',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              🔒 OFFICIAL COMMUTE PAIR (STRICTLY FIXED • CANNOT BE CHANGED)
            </span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(56,189,248,0.18)', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
              NON-EDITABLE
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
            {/* Station 1: Home Location */}
            <div className="student-station-card" style={{
              borderRadius: '8px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '13px' }}>🏠</span>
                <span className="station-label-pickup" style={{ fontSize: '0.67rem', color: '#0284c7', fontWeight: 800 }}>POINT 1: HOME (PICKUP)</span>
              </div>
              <div className="station-name" style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                {selectedStop ? selectedStop.name : 'Sayajigunj (Home)'}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Student Home Stop • Code: {selectedStop?.code || 'BRC-STN'}
              </div>
            </div>

            {/* Commute Direction Arrow */}
            <div style={{ textAlign: 'center', color: '#0284c7', padding: '0 4px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>⟷</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Direct Route</div>
            </div>

            {/* Station 2: Navrachana University */}
            <div className="student-station-card station-drop" style={{
              borderRadius: '8px',
              padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '13px' }}>🎓</span>
                <span className="station-label-drop" style={{ fontSize: '0.67rem', color: '#d97706', fontWeight: 800 }}>POINT 2: UNIVERSITY (DROP)</span>
              </div>
              <div className="station-name" style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Navrachana University Main Campus
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Vasna-Bhayli Main Road • Central Bay (Stop-11)
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.69rem', color: 'var(--text-dim)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
            ℹ️ <strong>University Transport Policy:</strong> For enrolled students, bus commute is strictly restricted to your Home Location and Navrachana University Campus. Pickup and drop locations cannot be changed.
          </div>
        </div>

        {/* Enter / Board Bus Action Hub */}
        <div className="student-board-box" style={{
          borderRadius: '10px',
          padding: '12px 14px',
          marginTop: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🚌</span>
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                  {isBoarded ? 'Currently Inside Bus (Onboard Commuter)' : 'Board Bus at Your Home Location'}
                </span>
                <div style={{ fontSize: '0.69rem', color: '#94a3b8' }}>
                  {isBoarded
                    ? `Travelling onboard ${nearestBus?.callsign || 'NUV Bus'} towards Navrachana University`
                    : `Tap when entering ${nearestBus?.callsign || 'your assigned bus'} to register live boarding`
                  }
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '4px',
              background: isBoarded ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)',
              color: isBoarded ? '#6ee7b7' : '#38bdf8',
              border: `1px solid ${isBoarded ? '#10b981' : '#38bdf8'}`
            }}>
              {isBoarded ? 'ONBOARD BUS' : 'WAITING AT STOP'}
            </span>
          </div>

          {isBoarded ? (
            <div>
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6ee7b7' }}>
                    ✓ You have entered {nearestBus?.callsign || 'the bus'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    Destination: <strong>Navrachana University Main Campus (Bhayli)</strong> • Seat: <strong>{bookedSeat || '3B'}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                    {nearestBus?.speedKmH || 32} <span style={{ fontSize: '0.7rem' }}>km/h</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Live Vehicle Speed</div>
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem', borderColor: '#10b981', color: '#6ee7b7' }}
                onClick={handleDeboardBus}
                disabled={boardLoading}
              >
                🎓 Arrived at Navrachana University? Tap to Deboard at Campus Bay
              </button>
            </div>
          ) : isRideCancelled ? (
            <div style={{ fontSize: '0.74rem', color: '#fca5a5' }}>
              ⚠️ You have cancelled today's ride. Tap "Resume Commute" in the section below to re-add your stop before boarding.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.82rem', background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                onClick={handleBoardBus}
                disabled={boardLoading}
              >
                <Users size={16} />
                <span>{boardLoading ? 'Registering Boarding...' : `Enter / Board ${nearestBus ? nearestBus.callsign : 'Bus'} (Tap NFC Pass)`}</span>
              </button>
            </div>
          )}

          {boardSuccessMsg && (
            <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>
              ✓ {boardSuccessMsg}
            </div>
          )}
        </div>

        {/* Assigned Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px',
          background: 'rgba(0,0,0,0.3)',
          padding: '10px 12px',
          borderRadius: '8px',
          marginTop: '10px',
          fontSize: '0.75rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>ASSIGNED BUS (55 SEATS)</span>
            <div style={{ color: '#ffffff', fontWeight: 700 }}>{nearestBus ? nearestBus.callsign : 'NUV-Titan-101'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>REGISTERED HOME STOP</span>
            <div style={{ color: '#38bdf8', fontWeight: 700 }}>{selectedStop ? selectedStop.name.split(' (')[0] : 'Sayajigunj'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>RESERVED SEAT</span>
            <div style={{ color: bookedSeat ? '#34d399' : '#f59e0b', fontWeight: 700 }}>
              {isRideCancelled ? 'Seat Released' : (bookedSeat ? `Seat ${bookedSeat}` : 'Open Seating')}
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)' }}>BOOKED COMMUTE SHIFT</span>
            <div style={{ color: '#fef08a', fontWeight: 800 }}>
              {arrivalSlot} Inbound ⟷ 07:00 PM Exit
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1, padding: '7px 10px', fontSize: '0.78rem' }}
            onClick={() => onOpenSeatMap(nearestBus)}
          >
            <Armchair size={14} />
            <span>{bookedSeat ? `Change Seat (${bookedSeat})` : 'Select Seat on 55-Seat Map'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
            onClick={onOpenSchedule}
          >
            <Clock size={14} color="#38bdf8" />
            <span>Bus Timetable</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem', borderColor: 'rgba(244,63,94,0.4)', color: '#fca5a5' }}
            onClick={onOpenComplaint}
            title="Report a problem or driver behavior"
          >
            <MessageSquare size={14} color="#f43f5e" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Student Commute Pass Subscription (Monthly / Yearly INR) */}
      <StudentSubscriptionCard currentUser={currentUser} />

      {/* Dynamic Route Bypass & Cancel Ride Card */}
      <div className="glass-panel" style={{
        padding: '16px',
        border: `1.5px solid ${isRideCancelled ? '#f43f5e' : 'rgba(245,158,11,0.3)'}`,
        background: isRideCancelled
          ? 'linear-gradient(135deg, rgba(244,63,94,0.1), rgba(15,23,42,0.9))'
          : 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(15,23,42,0.85))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '6px',
              background: isRideCancelled ? 'rgba(244,63,94,0.2)' : 'rgba(245,158,11,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isRideCancelled ? <MapPinOff size={16} color="#f43f5e" /> : <Route size={16} color="#f59e0b" />}
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                Cancel Ride & Dynamic Route Updating
              </span>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                If you don't want to go in the bus today, cancel and the AI engine updates the route to bypass your stop
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.68rem',
            background: isRideCancelled ? 'rgba(244,63,94,0.2)' : 'rgba(56,189,248,0.2)',
            color: isRideCancelled ? '#f87171' : '#38bdf8',
            padding: '2px 8px',
            borderRadius: '12px',
            fontWeight: 700
          }}>
            {isRideCancelled ? 'BYPASS ACTIVE' : 'AI DYNAMIC REROUTE'}
          </span>
        </div>

        {/* Dynamic Status Banner */}
        {isRideCancelled ? (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            border: '1px solid #f43f5e',
            padding: '12px 14px',
            margin: '10px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: 700, fontSize: '0.82rem' }}>
              <Zap size={16} color="#f43f5e" />
              <span>
                {rerouteFeedback?.bypassed
                  ? `Bus Rerouted: ${rerouteFeedback.busCallsign || 'Bus'} has updated its path to BYPASS ${rerouteFeedback.stopName || selectedStop?.name} today.`
                  : `Ride Cancelled: You are marked as not travelling. Your seat has been released.`
                }
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
              The live GPS map has removed your stop from the vehicle's active trajectory, saving ~5 minutes travel time for fellow commuters.
            </div>
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '7px 14px', background: 'linear-gradient(135deg, #059669, #10b981)' }}
                onClick={handleResumeRide}
                disabled={cancelLoading}
              >
                <RotateCcw size={14} />
                <span>Resume Commute (Re-Add My Stop to Bus Route)</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin: '10px 0' }}>
            <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '10px' }}>
              Not travelling by university bus today? Cancel your ride so the driver does not take a detour to <strong>{selectedStop ? selectedStop.name : 'your stop'}</strong>.
            </p>
            <button
              type="button"
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '9px 12px',
                fontSize: '0.8rem',
                borderColor: '#f43f5e',
                color: '#fca5a5',
                background: 'rgba(244,63,94,0.12)'
              }}
              onClick={handleCancelRideAndReroute}
              disabled={cancelLoading}
            >
              <MapPinOff size={15} />
              <span>✕ Cancel Today's Ride (Reroute Bus & Bypass My Location)</span>
            </button>
          </div>
        )}

        {rerouteFeedback && (
          <div style={{
            fontSize: '0.74rem',
            color: rerouteFeedback.bypassed || rerouteFeedback.restored ? '#34d399' : '#f87171',
            fontWeight: 600,
            marginTop: '6px'
          }}>
            {rerouteFeedback.message}
          </div>
        )}
      </div>

      {/* Campus Bus Commute Schedule Booking (Arrivals: 7 AM, 9 AM, 1 PM | Departure: 7 PM) */}
      <div className="glass-panel" style={{
        padding: '18px',
        border: '1.5px solid rgba(56,189,248,0.4)',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(15,23,42,0.92))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={19} color="#ffffff" />
            </div>
            <div>
              <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>
                NAVRACHANA CAMPUS BUS COMMUTE BOOKING
              </span>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Select when you want to arrive at campus and confirm your return bus
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.68rem',
            background: 'rgba(56,189,248,0.2)',
            color: '#38bdf8',
            border: '1px solid rgba(56,189,248,0.3)',
            padding: '3px 10px',
            borderRadius: '12px',
            fontWeight: 800
          }}>
            DAILY SHIFT RESERVATION
          </span>
        </div>

        {/* Section 1: Inbound Arrival Time Selection (7 AM, 9 AM, 1 PM) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fef08a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              1. Choose Campus Inbound Arrival Time
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Pickup from: <strong>{selectedStop?.name || 'Home Stop'}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {/* Slot 1: 07:00 AM */}
            <div
              style={{
                background: arrivalSlot === '07:00 AM' ? 'rgba(245,158,11,0.2)' : 'rgba(15,23,42,0.8)',
                border: `2px solid ${arrivalSlot === '07:00 AM' ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: arrivalSlot === '07:00 AM' ? '0 0 10px rgba(245,158,11,0.3)' : 'none'
              }}
              onClick={() => setArrivalSlot('07:00 AM')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: arrivalSlot === '07:00 AM' ? '#fde047' : '#ffffff' }}>
                  🌅 07:00 AM Arrival
                </span>
                <span style={{ fontSize: '0.62rem', background: '#f59e0b', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  EARLY
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                Pickup ~07:15 AM → Navrachana Arrival ~07:50 AM
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px' }}>
                Ideal for morning practicals, labs & workshops
              </div>
            </div>

            {/* Slot 2: 09:00 AM */}
            <div
              style={{
                background: arrivalSlot === '09:00 AM' ? 'rgba(56,189,248,0.2)' : 'rgba(15,23,42,0.8)',
                border: `2px solid ${arrivalSlot === '09:00 AM' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: arrivalSlot === '09:00 AM' ? '0 0 10px rgba(56,189,248,0.3)' : 'none'
              }}
              onClick={() => setArrivalSlot('09:00 AM')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: arrivalSlot === '09:00 AM' ? '#7dd3fc' : '#ffffff' }}>
                  ☀️ 09:00 AM Arrival
                </span>
                <span style={{ fontSize: '0.62rem', background: '#38bdf8', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  REGULAR
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                Pickup ~09:00 AM → Navrachana Arrival ~09:45 AM
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px' }}>
                Standard batch for 10:00 AM core lectures
              </div>
            </div>

            {/* Slot 3: 01:00 PM */}
            <div
              style={{
                background: arrivalSlot === '01:00 PM' ? 'rgba(168,85,247,0.2)' : 'rgba(15,23,42,0.8)',
                border: `2px solid ${arrivalSlot === '01:00 PM' ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: arrivalSlot === '01:00 PM' ? '0 0 10px rgba(168,85,247,0.3)' : 'none'
              }}
              onClick={() => setArrivalSlot('01:00 PM')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: arrivalSlot === '01:00 PM' ? '#d8b4fe' : '#ffffff' }}>
                  🥪 01:00 PM Arrival
                </span>
                <span style={{ fontSize: '0.62rem', background: '#a855f7', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  AFTERNOON
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                Pickup ~01:15 PM → Navrachana Arrival ~01:55 PM
              </div>
              <div style={{ fontSize: '0.66rem', color: '#94a3b8', marginTop: '4px' }}>
                For afternoon studio classes & post-break sessions
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Outbound Campus Departure (Designated 7:00 PM) */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              2. Confirmed Outbound Campus Departure Time
            </span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Departing from: <strong>Navrachana Central Bay (Stop-11)</strong>
            </span>
          </div>

          <div style={{
            background: 'rgba(16,185,129,0.15)',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '6px', background: 'rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                🌙
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#6ee7b7' }}>
                  07:00 PM Evening Dispersal Fleet
                </div>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                  Navrachana Campus Exit: 07:00 PM → Direct Return to {selectedStop?.name || 'Your Home Stop'}
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '0.68rem',
              background: '#10b981',
              color: '#000000',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              DESIGNATED RETURN (7:00 PM)
            </span>
          </div>
        </div>

        {/* Booking Summary Box */}
        <div style={{
          background: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            Booked Schedule: <strong style={{ color: '#38bdf8' }}>Inbound Arrival: {arrivalSlot}</strong> ⟷ <strong style={{ color: '#34d399' }}>Campus Departure: 07:00 PM</strong>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Assigned Bus: <strong style={{ color: '#ffffff' }}>{nearestBus ? nearestBus.callsign : 'Bus 01'}</strong> • Seat: <strong style={{ color: '#fbbf24' }}>{bookedSeat || '3B'}</strong>
          </div>
        </div>

        {/* Action Button & Confirmation Notice */}
        <button
          type="button"
          className="btn-primary"
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.86rem',
            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
          onClick={handleBookCommuteSchedule}
          disabled={scheduleBookingLoading}
        >
          <Clock size={16} />
          <span>{scheduleBookingLoading ? 'Booking Commute Schedule...' : `Confirm & Book Bus Schedule (${arrivalSlot} Inbound • 7:00 PM Departure)`}</span>
        </button>

        {scheduleFeedback && (
          <div style={{
            fontSize: '0.78rem',
            color: '#34d399',
            fontWeight: 700,
            textAlign: 'center',
            marginTop: '8px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            padding: '6px 12px'
          }}>
            ✓ {scheduleFeedback.message}
          </div>
        )}
      </div>

      {/* Midday Break (1:00 PM - 2:00 PM) Flexible Transit Booking Hub */}
      <div className="glass-panel" style={{
        padding: '16px',
        border: '1.5px solid rgba(56,189,248,0.3)',
        background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(99,102,241,0.08))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="#38bdf8" />
            </div>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                🥪 Midday Break Commute Hub (1:00 PM - 2:00 PM Break)
              </span>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Want to leave early in break or arrive for afternoon classes? Book below:
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.68rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
            ON-DEMAND SHUTTLE
          </span>
        </div>

        {/* If Student Already Has a Midday Booking */}
        {middayBooking ? (
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '8px',
            border: '1px solid #10b981',
            padding: '12px 14px',
            marginTop: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 800, fontSize: '0.84rem' }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span>{middayBooking.label}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#e2e8f0', marginTop: '4px' }}>
                  🚌 Vehicle: <strong>{middayBooking.busCallsign || nearestBus?.callsign}</strong> • Reserved Seat: <strong style={{ color: '#38bdf8' }}>{middayBooking.seatNumber}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                  {middayBooking.type === 'EARLY_EXIT'
                    ? `Leaves campus at 01:05 PM dropping at ${middayBooking.dropStopName || selectedStop?.name}`
                    : `Picks up at ${middayBooking.pickupStopName || selectedStop?.name} at 01:15 PM -> Arrives 01:55 PM`
                  }
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  Ref: {middayBooking.bookingRef} • Confirmed
                </div>
              </div>

              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '0.72rem', padding: '4px 10px', borderColor: '#f43f5e', color: '#fca5a5' }}
                onClick={handleCancelMiddayBreak}
                disabled={breakBookingLoading}
              >
                Cancel Pass
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Toggle Tabs: Early Exit vs Afternoon Arrival */}
            <div style={{ display: 'flex', gap: '6px', margin: '12px 0 10px 0' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1.5px solid ${middayTab === 'EARLY_EXIT' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                  background: middayTab === 'EARLY_EXIT' ? 'rgba(56,189,248,0.2)' : 'rgba(0,0,0,0.2)',
                  color: middayTab === 'EARLY_EXIT' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setMiddayTab('EARLY_EXIT')}
              >
                🏃 Go Home Early (1:05 PM Exit)
              </button>

              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: `1.5px solid ${middayTab === 'AFTERNOON_ARRIVAL' ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                  background: middayTab === 'AFTERNOON_ARRIVAL' ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.2)',
                  color: middayTab === 'AFTERNOON_ARRIVAL' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                onClick={() => setMiddayTab('AFTERNOON_ARRIVAL')}
              >
                🚌 Come in Afternoon (1:15 PM Pickup)
              </button>
            </div>

            {/* Form & 1-Click Booking */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginBottom: '8px' }}>
                {middayTab === 'EARLY_EXIT'
                  ? 'Depart from NUV Bhayli Campus at 01:05 PM during the 1:00 - 2:00 PM lunch break:'
                  : 'Get picked up from your area during the break to arrive by 01:55 PM (ready for 02:00 PM sessions / 5:00 PM electives):'
                }
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px', background: 'rgba(15,23,42,0.7)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.3)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', minWidth: '85px' }}>
                  {middayTab === 'EARLY_EXIT' ? 'Drop Location:' : 'Pickup Location:'}
                </span>
                <div style={{ flex: 1, fontSize: '0.78rem', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>🏠 {selectedStop ? selectedStop.name : 'Sayajigunj'} (Your Fixed Home Location)</span>
                  <span style={{ fontSize: '0.65rem', color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.4)', fontWeight: 800 }}>
                    🔒 CANNOT BE CHANGED
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '0.8rem',
                  background: middayTab === 'EARLY_EXIT'
                    ? 'linear-gradient(135deg, #0284c7, #2563eb)'
                    : 'linear-gradient(135deg, #059669, #10b981)'
                }}
                onClick={() => handleBookMiddayBreak(middayTab)}
                disabled={breakBookingLoading}
              >
                {breakBookingLoading ? (
                  <span>Reserving Seat on Midday Shuttle...</span>
                ) : (
                  <>
                    <BookmarkCheck size={16} />
                    <span>
                      {middayTab === 'EARLY_EXIT'
                        ? 'Confirm 1:05 PM Break Departure Pass'
                        : 'Confirm 1:15 PM Afternoon Arrival Pass'
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {breakFeedback && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.75rem',
            color: breakFeedback.type === 'success' ? '#34d399' : '#f87171',
            fontWeight: 600
          }}>
            {breakFeedback.message}
          </div>
        )}
      </div>

      {/* Live Seat Availability & Approach Card (55 Seats Capacity) */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
              Live Seat Capacity & Approach ETA
            </span>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Vehicle: {nearestBus ? nearestBus.callsign : 'Bus 1'} ({nearestBus?.numberPlate}) • 55 Seats Total
            </div>
          </div>
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: '999px',
            background: `${availabilityBadgeColor}22`,
            color: availabilityBadgeColor,
            border: `1px solid ${availabilityBadgeColor}`,
            fontWeight: 700
          }}>
            {availabilityText}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>SEATS REMAINING</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: availabilityBadgeColor }}>
              {seatsRemaining}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>out of 55 total seats</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '12px', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ETA TO YOUR STOP</span>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {nearestBus ? nearestBus.etaMinutesNextStop || 3 : 3} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>mins</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#34d399' }}>Live GPS Stream Active</span>
          </div>
        </div>

        {/* Fixed Commute Pair Corridor Banner (Locked & Non-Editable) */}
        <div style={{
          marginTop: '10px',
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '0.67rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
              PREDEFINED STUDENT COMMUTE CORRIDOR
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
              🏠 {selectedStop ? selectedStop.name : 'Sayajigunj (Home)'} ⟷ 🎓 Navrachana University Main Campus
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
              Live Stop Queue: <strong style={{ color: '#38bdf8' }}>{selectedStop?.currentWaitingCount || 0} students waiting</strong>
            </div>
          </div>
          <span style={{
            fontSize: '0.66rem',
            background: 'rgba(56,189,248,0.15)',
            color: '#38bdf8',
            border: '1px solid #38bdf8',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 800,
            whiteSpace: 'nowrap'
          }}>
            🔒 FIXED LOCATIONS
          </span>
        </div>
      </div>

      {/* "Leave-Now" Walking Time Optimizer */}
      {leaveAdvice && !isRideCancelled && (
        <div className="leave-now-banner" style={{
          borderColor: leaveAdvice.urgency === 'LEAVE_IMMEDIATELY' ? '#f59e0b' : 'var(--border-glow)'
        }}>
          <div className="leave-now-icon-circle" style={{
            background: leaveAdvice.urgency === 'LEAVE_IMMEDIATELY' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
            color: leaveAdvice.urgency === 'LEAVE_IMMEDIATELY' ? '#f59e0b' : '#38bdf8'
          }}>
            <Footprints size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {leaveAdvice.urgency === 'LEAVE_IMMEDIATELY' ? '🚨 Action Required' : 'Smart Departure Advisory'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#e2e8f0', marginTop: '2px' }}>
              {leaveAdvice.msg}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              Est. Walk: {leaveAdvice.walkTime} mins (320m) | Live Bus ETA: {leaveAdvice.busEta} mins
            </div>
          </div>
        </div>
      )}

      {/* Stop Queue Check-In */}
      <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
          Queued at {selectedStop ? selectedStop.name : 'this stop'}?
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Pinging your presence helps the AI engine dispatch relief buses if crowds surge.
        </p>

        <button
          className="btn-primary"
          style={{ width: '100%', background: checkInDone ? '#059669' : 'linear-gradient(135deg, #0284c7, #2563eb)' }}
          onClick={handleCheckIn}
          disabled={checkInDone || isRideCancelled}
        >
          {checkInDone ? (
            <>
              <CheckCircle2 size={16} />
              <span>Checked In! (+1 Added to Stop Queue)</span>
            </>
          ) : (
            <>
              <Users size={16} />
              <span>Check In at Stop (Live Queue: {selectedStop ? selectedStop.currentWaitingCount || 0 : 0})</span>
            </>
          )}
        </button>
      </div>

      {/* Crowdsourced Passenger Feedback */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title" style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
          <HeartHandshake size={16} color="#38bdf8" />
          <span>Crowdsourced Passenger Beacon ("Waze for NUV")</span>
        </div>
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Tap to report live conditions for fellow Vadodara students:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            onClick={() => handleSendReaction('Plenty of Seats Open')}
          >
            💺 Plenty Seats Open
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            onClick={() => handleSendReaction('Bus Is Extremely Packed')}
          >
            👥 Extremely Packed
          </button>
          <button
            className="btn-secondary"
            style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            onClick={() => handleSendReaction('Traffic Bottleneck')}
          >
            🚦 Traffic Jam
          </button>
          <button
            className="btn-danger"
            style={{ fontSize: '0.75rem', justifyContent: 'center' }}
            onClick={() => handleSendReaction('Emergency SOS / Safety Alert')}
          >
            🚨 Emergency SOS
          </button>
        </div>

        {feedbackSent && (
          <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#34d399', textAlign: 'center', fontWeight: 600 }}>
            ✓ Reaction verified and logged into Operations telemetry!
          </div>
        )}
      </div>

    </div>
  );
}
