import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Gauge, AlertTriangle, CheckCircle, Shield, Navigation, Users, Zap,
  Play, Square, QrCode, Plus, Minus, Siren, UserCheck, MapPin, Compass, Radio, Crosshair, Lock
} from 'lucide-react';
import { playAlertChime } from '../utils/geoHelpers';
import { useAuth } from '../context/AuthContext';

// Embedded Mini Google Maps Radar for Driver Cockpit
function DriverLiveMiniMap({ bus, isTripActive, route }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const pulseCircleRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const lat = bus.lat || 22.2845;
    const lng = bus.lng || 73.1335;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // Google Maps Roadmap tiles
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    const busIcon = L.divIcon({
      className: 'driver-cockpit-marker',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${isTripActive ? '#10b981' : '#64748b'};
          border: 2px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 16px;
        ">
          🚌
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    markerRef.current = L.marker([lat, lng], { icon: busIcon }).addTo(map);

    if (isTripActive) {
      pulseCircleRef.current = L.circle([lat, lng], {
        radius: 120,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);
    }

    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync position & pan when bus updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !bus.lat || !bus.lng) return;

    const newLatLng = [bus.lat, bus.lng];

    if (markerRef.current) {
      markerRef.current.setLatLng(newLatLng);
      
      const busIcon = L.divIcon({
        className: 'driver-cockpit-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: ${isTripActive ? '#10b981' : '#64748b'};
            border: 2.5px solid #000000;
            box-shadow: 2px 2px 0px #000000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 18px;
          ">
            🚌
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });
      markerRef.current.setIcon(busIcon);
    }

    if (pulseCircleRef.current) {
      pulseCircleRef.current.setLatLng(newLatLng);
      if (!isTripActive) {
        pulseCircleRef.current.remove();
        pulseCircleRef.current = null;
      }
    } else if (isTripActive && map) {
      pulseCircleRef.current = L.circle(newLatLng, {
        radius: 120,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);
    }

    if (isTripActive) {
      map.panTo(newLatLng, { animate: true, duration: 0.8 });
    }
  }, [bus.lat, bus.lng, isTripActive]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && bus.lat && bus.lng) {
      mapInstanceRef.current.flyTo([bus.lat, bus.lng], 16, { duration: 0.8 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #000000', boxShadow: '3px 3px 0px #000000', marginBottom: '16px' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Banner on Mini Map */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 500,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: isTripActive ? '#10b981' : '#000000',
          color: isTripActive ? '#000000' : '#ffffff',
          fontWeight: 900,
          fontSize: '0.7rem',
          padding: '3px 8px',
          borderRadius: '4px',
          border: '1.5px solid #000000',
          boxShadow: '1.5px 1.5px 0px #000000',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          pointerEvents: 'auto'
        }}>
          <Radio size={12} className={isTripActive ? "driver-radar-dot" : ""} />
          <span>{isTripActive ? 'GOOGLE MAPS • LIVE GPS BROADCASTING' : 'TRIP STANDBY • LOCATION PAUSED'}</span>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          style={{
            background: '#162238',
            color: '#ffffff',
            border: '1.5px solid #233554',
            boxShadow: '1.5px 1.5px 0px #000000',
            padding: '3px 8px',
            fontSize: '0.68rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'auto'
          }}
        >
          <Crosshair size={11} color="#38bdf8" />
          <span>Center</span>
        </button>
      </div>

      {/* Bottom Live Lat/Lng Coordinates Bar */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1.5px solid #233554',
        boxShadow: '1.5px 1.5px 0px #000000',
        padding: '5px 12px',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono)',
        fontWeight: 800,
        color: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 500
      }}>
        <span style={{ color: '#38bdf8' }}>
          📍 GPS: <strong style={{ color: '#ffffff' }}>{bus.lat ? bus.lat.toFixed(5) : '22.29800'}°N, {bus.lng ? bus.lng.toFixed(5) : '73.15500'}°E</strong>
        </span>
        <span style={{ color: isTripActive ? '#34d399' : '#94a3b8' }}>
          {isTripActive ? `● Speed: ${bus.speedKmH || 0} km/h` : '○ Standby'}
        </span>
      </div>
    </div>
  );
}

export default function DriverSimulator({
  buses = [],
  routes = [],
  stops = [],
  onTriggerIncident
}) {
  const { currentUser, token } = useAuth() || {};
  const isDriver = currentUser?.role === 'driver';
  const assignedBusId = isDriver ? (currentUser?.assignedBusId || 'bus-01') : null;

  const [selectedDriverBusId, setSelectedDriverBusId] = useState(() => assignedBusId || (buses[0] ? buses[0].id : 'bus-01'));

  // Keep state synchronized with driver's assigned bus
  useEffect(() => {
    if (isDriver && currentUser?.assignedBusId) {
      setSelectedDriverBusId(currentUser.assignedBusId);
    }
  }, [isDriver, currentUser?.assignedBusId]);

  const effectiveBusId = isDriver ? (currentUser?.assignedBusId || selectedDriverBusId) : selectedDriverBusId;
  const bus = buses.find(b => b.id === effectiveBusId) || buses.find(b => b.id === selectedDriverBusId) || buses[0];
  
  // Trip status synced with bus data
  const [isTripActive, setIsTripActive] = useState(() => bus ? Boolean(bus.tripActive || bus.status === 'EN_ROUTE') : false);
  const [passengerCount, setPassengerCount] = useState(bus ? bus.currentOccupancy || 35 : 35);
  const [studentRollInput, setStudentRollInput] = useState('');
  const [boardingMessage, setBoardingMessage] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [useDeviceGps, setUseDeviceGps] = useState(false);
  const watchIdRef = useRef(null);

  if (!bus) return null;

  const route = routes.find(r => r.id === bus.routeId);
  const nextStop = stops.find(s => s.id === bus.nextStopId);

  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

  const getAuthToken = () => token || localStorage.getItem('nuv_auth_token') || 'demo-token-driver';

  // Keep trip state synchronized if remote update arrives
  useEffect(() => {
    if (bus) {
      setIsTripActive(Boolean(bus.tripActive || bus.status === 'EN_ROUTE'));
      if (bus.currentOccupancy !== undefined) {
        setPassengerCount(bus.currentOccupancy);
      }
    }
  }, [bus.id, bus.tripActive, bus.status, bus.currentOccupancy]);

  // Clean up browser geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Start / End Trip Function
  const toggleTripStatus = async () => {
    const endpoint = isTripActive ? `${API_BASE}/trip/end` : `${API_BASE}/trip/start`;
    try {
      const authToken = getAuthToken();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ busId: bus.id })
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        alert(data.message || 'Authorization failed: You are only permitted to manage trips for your assigned bus.');
        return;
      }

      const newActive = !isTripActive;
      setIsTripActive(newActive);
      playAlertChime('DISPATCH');

      if (!newActive && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setUseDeviceGps(false);
      }
    } catch (err) {
      console.error('Trip status toggle error:', err);
    }
  };

  // Toggle Real Device GPS
  const handleToggleDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Device geolocation is not supported on this browser.');
      return;
    }

    if (useDeviceGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setUseDeviceGps(false);
    } else {
      setUseDeviceGps(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, speed, heading } = pos.coords;
          try {
            const authToken = getAuthToken();
            await fetch(`${API_BASE}/trip/location`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                busId: bus.id,
                lat: latitude,
                lng: longitude,
                speedKmH: speed ? Math.round(speed * 3.6) : bus.speedKmH,
                headingDeg: heading || bus.headingDeg
              })
            });
          } catch (e) {}
        },
        (err) => {
          console.warn('Device GPS tracking error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
  };

  // Passenger count adjustment (+/-)
  const handlePassengerDelta = async (delta) => {
    const newCount = Math.max(0, Math.min(bus.capacity, passengerCount + delta));
    setPassengerCount(newCount);
    try {
      const authToken = getAuthToken();
      await fetch(`${API_BASE}/trip/passengers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ busId: bus.id, count: newCount })
      });
    } catch (e) {}
  };

  // Student Boarding Verification (QR / Roll Number)
  const handleVerifyBoarding = async (e) => {
    e.preventDefault();
    if (!studentRollInput.trim()) return;

    try {
      const authToken = getAuthToken();
      const res = await fetch(`${API_BASE}/trip/board-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          busId: bus.id,
          rollNumber: studentRollInput.trim().toUpperCase(),
          verificationMode: 'ROLL_CHECK'
        })
      });
      const data = await res.json();
      if (data.success) {
        setBoardingMessage({ type: 'success', text: data.message });
        setPassengerCount(prev => prev + 1);
        playAlertChime('INFO');
        setStudentRollInput('');
      } else {
        setBoardingMessage({ type: 'error', text: data.message });
      }
    } catch (err) {
      setBoardingMessage({ type: 'error', text: 'Verification error: ' + err.message });
    }
  };

  // Emergency SOS Button
  const handleEmergencySOS = async () => {
    setSosActive(true);
    playAlertChime('CRITICAL');
    try {
      const authToken = getAuthToken();
      await fetch(`${API_BASE}/trip/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ busId: bus.id })
      });
    } catch (e) {}
  };

  const handleAction = async (actionType) => {
    await onTriggerIncident(bus.id, actionType);
    if (actionType === 'BREAKDOWN') playAlertChime('CRITICAL');
    else if (actionType === 'RESTORE') playAlertChime('DISPATCH');
    else playAlertChime('INFO');
  };

  // Compass text generator
  const getCompassHeading = (deg = 0) => {
    const val = Math.floor((deg / 45) + 0.5);
    const arr = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return arr[(val % 8)];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Driver Cockpit Header */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={20} color="#fbbf24" />
            </div>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                Driver Operations Terminal
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>
                {bus.callsign} • Plate: {bus.numberPlate}
              </div>
            </div>
          </div>

          {/* Bus Selector: Locked for Driver, Switchable for Admin Dispatcher */}
          {isDriver ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '8px',
              padding: '6px 12px'
            }}>
              <Lock size={14} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', fontWeight: 800 }}>
                  Assigned Bus (Locked)
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                  {bus.callsign} <span style={{ opacity: 0.65, fontSize: '0.72rem' }}>({bus.numberPlate})</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Dispatcher Select:</span>
              <select
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  outline: 'none'
                }}
                value={selectedDriverBusId}
                onChange={e => setSelectedDriverBusId(e.target.value)}
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {b.callsign} ({b.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 1. START TRIP / END TRIP MASTER BUTTON */}
        <div style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={isTripActive ? "neo-btn neo-btn-danger" : "neo-btn neo-btn-emerald"}
            style={{
              width: '100%',
              padding: '14px',
              justifyContent: 'center',
              fontSize: '0.92rem',
              fontWeight: 600
            }}
            onClick={toggleTripStatus}
          >
            {isTripActive ? (
              <>
                <Square size={18} fill="#ffffff" />
                <span>End Current Trip (Arrived at Destination)</span>
              </>
            ) : (
              <>
                <Play size={18} fill="#ffffff" />
                <span>Start Trip (Begin Live GPS Telemetry)</span>
              </>
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            padding: '6px 12px',
            background: isTripActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.4)',
            border: `1px solid ${isTripActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={isTripActive ? "driver-radar-dot" : "driver-idle-dot"} />
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: isTripActive ? '#34d399' : '#94a3b8' }}>
                {isTripActive ? 'Live Location Broadcasting Online (1Hz)' : 'Trip Idle • Live Location Sharing Paused'}
              </span>
            </div>

            {isTripActive && (
              <button
                type="button"
                onClick={handleToggleDeviceGps}
                style={{
                  background: useDeviceGps ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  color: useDeviceGps ? '#34d399' : '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Toggle Real Phone / Laptop Geolocation"
              >
                {useDeviceGps ? '🛰️ Device GPS Active' : '🛰️ Use Device GPS'}
              </button>
            )}
          </div>

          {/* Strict Role & Vehicle Ownership Authority Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '8px',
            padding: '7px 12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.22)',
            borderRadius: '8px',
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0' }}>
              <Shield size={14} color="#38bdf8" />
              <span>Trip Authority: <strong>{currentUser?.name || 'Driver'}</strong></span>
            </div>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {isDriver ? `Exclusive to ${bus.callsign} (${bus.numberPlate})` : 'Dispatcher Fleet Clearance'}
            </span>
          </div>
        </div>

        {/* 2. LIVE LOCATION DISPLAY & MINI GOOGLE MAP RADAR */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ffffff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Navigation size={14} color="#38bdf8" />
              <span>DRIVER LIVE LOCATION TELEMETRY:</span>
            </span>
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
              Google Maps Live
            </span>
          </div>

          {/* Embedded Mini Google Maps tracking */}
          <DriverLiveMiniMap
            bus={bus}
            isTripActive={isTripActive}
            route={route}
          />
        </div>

        {/* Speed & Live Passenger Counter (+/-) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
              Telemetry Speed
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {isTripActive ? bus.speedKmH || 0 : 0} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>km/h</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 500 }}>
              Heading: <strong style={{ color: '#ffffff' }}>{bus.headingDeg || 0}° ({getCompassHeading(bus.headingDeg)})</strong>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
              Passenger Count
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '4px 0' }}>
              <button
                type="button"
                className="neo-btn-outline"
                style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                onClick={() => handlePassengerDelta(-1)}
              >
                <Minus size={15} />
              </button>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                {passengerCount}
              </div>
              <button
                type="button"
                className="neo-btn-outline"
                style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', borderRadius: '50%' }}
                onClick={() => handlePassengerDelta(1)}
              >
                <Plus size={15} />
              </button>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
              Capacity: <strong style={{ color: '#ffffff' }}>{bus.capacity} seats</strong>
            </div>
          </div>
        </div>

        {/* Next Stop Navigation View */}
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Next Scheduled Vadodara Stop:</span>
            <strong style={{ color: '#ffffff' }}>{nextStop ? nextStop.name : 'Navrachana Bhayli Campus'}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>Estimated Arrival (ETA):</span>
            <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {isTripActive ? `${bus.etaMinutesNextStop || 1} mins` : '— (Trip Idle)'}
            </strong>
          </div>
        </div>
      </div>

      {/* Student Boarding Check-in (QR / Roll Number) */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={18} color="#38bdf8" />
          <span>Student Boarding Check-In (QR / Roll No.)</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '10px', fontWeight: 600 }}>
          Verify boarding passengers against the official Navrachana University student registry:
        </p>

        <form onSubmit={handleVerifyBoarding} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="neo-input"
            style={{ flex: 1, padding: '10px 14px', fontSize: '0.85rem' }}
            placeholder="Enter Roll Number (e.g. NUV24CS001)..."
            value={studentRollInput}
            onChange={e => setStudentRollInput(e.target.value)}
          />
          <button
            type="submit"
            className="neo-btn neo-btn-cyan"
            style={{ padding: '0 18px', fontSize: '0.85rem' }}
          >
            <UserCheck size={16} />
            <span>Verify</span>
          </button>
        </form>

        {boardingMessage && (
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            background: boardingMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            color: boardingMessage.type === 'success' ? '#34d399' : '#fca5a5',
            border: `1px solid ${boardingMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}>
            {boardingMessage.text}
          </div>
        )}
      </div>

      {/* Driver Simulation Control Panel & Flashing Emergency SOS */}
      <div className="glass-panel" style={{ padding: '16px' }}>
        <div className="panel-title" style={{ fontSize: '0.88rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="#fbbf24" />
          <span>Incident Reporting & Emergency SOS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            className="neo-btn-outline"
            style={{
              padding: '10px 14px',
              justifyContent: 'space-between',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc'
            }}
            onClick={() => handleAction('DELAY')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#ffffff' }}>
                Report Traffic Delay (+8m delay)
              </span>
            </div>
            <span className="neo-tag neo-tag-yellow" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>TRIGGER</span>
          </button>

          <button
            type="button"
            className="neo-btn-outline"
            style={{
              padding: '10px 14px',
              justifyContent: 'space-between',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc'
            }}
            onClick={() => handleAction('BREAKDOWN')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} color="#ef4444" />
              <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#ffffff' }}>
                Report Mechanical Breakdown
              </span>
            </div>
            <span className="neo-tag neo-tag-crimson" style={{ fontSize: '0.66rem', padding: '2px 8px' }}>TRIGGER</span>
          </button>

          {/* Emergency / SOS Button */}
          <button
            type="button"
            className="neo-btn neo-btn-danger"
            style={{
              padding: '12px',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.84rem'
            }}
            onClick={handleEmergencySOS}
          >
            <Siren size={18} />
            <span>{sosActive ? '🚨 SOS Beacon Active (Admin Alerted)' : '🚨 Emergency SOS Beacon'}</span>
          </button>

          <button
            type="button"
            className="neo-btn neo-btn-emerald"
            style={{ padding: '10px 14px', justifyContent: 'center', fontWeight: 600, fontSize: '0.84rem' }}
            onClick={() => handleAction('RESTORE')}
          >
            <CheckCircle size={16} />
            <span>Normalize & Resume Operations</span>
          </button>
        </div>
      </div>
    </div>
  );
}
