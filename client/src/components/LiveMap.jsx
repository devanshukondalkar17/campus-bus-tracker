import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Navigation, Eye, EyeOff, Compass, Crosshair, Play, Square, Radio } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

// Google Maps Tile Providers
const GOOGLE_TILE_LAYERS = {
  roadmap: {
    name: 'Google Streets',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  },
  satellite: {
    name: 'Google Satellite',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  },
  terrain: {
    name: 'Google Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    maxZoom: 20
  }
};

export default function LiveMap({
  buses = [],
  routes = [],
  stops = [],
  selectedBusId,
  onSelectBus,
  currentRole,
  currentUser,
  onTripToggle
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({ buses: {}, stops: {}, polylines: {} });
  
  const [mapStyle, setMapStyle] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'
  const [activeRouteFilter, setActiveRouteFilter] = useState('ALL');
  const [showStops, setShowStops] = useState(true);
  const [currentTripBusId, setCurrentTripBusId] = useState(null);

  // 1. Initialize Map Once with Google Maps
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered at Vadodara city corridor connecting to Navrachana University, Bhayli
    const map = L.map(mapContainerRef.current, {
      center: [22.2980, 73.1550],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Add Google Maps standard roadmap tile layer
    const layerConfig = GOOGLE_TILE_LAYERS.roadmap;
    const initialTiles = L.tileLayer(layerConfig.url, {
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains
    }).addTo(map);

    tileLayerRef.current = initialTiles;

    // Zoom controls at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    // Force map to re-measure container and render Google tiles without delay
    const resizeTimer1 = setTimeout(() => map.invalidateSize(), 100);
    const resizeTimer2 = setTimeout(() => map.invalidateSize(), 300);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      clearTimeout(resizeTimer1);
      clearTimeout(resizeTimer2);
      window.removeEventListener('resize', handleWindowResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Google Maps Style Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    const layerConfig = GOOGLE_TILE_LAYERS[mapStyle] || GOOGLE_TILE_LAYERS.roadmap;
    const newTiles = L.tileLayer(layerConfig.url, {
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains
    }).addTo(map);

    tileLayerRef.current = newTiles;
    map.invalidateSize();
  }, [mapStyle]);

  // 3. Draw Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routes.length) return;

    // Clear existing polylines
    Object.values(markersRef.current.polylines).forEach(poly => poly.remove());
    markersRef.current.polylines = {};

    routes.forEach(route => {
      if (activeRouteFilter !== 'ALL' && route.id !== activeRouteFilter) return;

      const latlngs = route.waypoints.map(wp => [wp.lat, wp.lng]);
      
      // Main glowing polyline
      const polyline = L.polyline(latlngs, {
        color: route.color || '#2563eb',
        weight: 5,
        opacity: 0.9,
        smoothFactor: 1
      }).addTo(map);

      // Subtle border/shadow behind polyline for visibility on Google Maps
      const shadowLine = L.polyline(latlngs, {
        color: '#000000',
        weight: 9,
        opacity: 0.4
      }).addTo(map);

      shadowLine.bringToBack();

      markersRef.current.polylines[route.id] = {
        remove: () => {
          polyline.remove();
          shadowLine.remove();
        }
      };
    });
  }, [routes, activeRouteFilter]);

  // 4. Render Stop Markers with Distinct Predefined Start, Home, University & Bypassed Designs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing stops
    Object.values(markersRef.current.stops).forEach(marker => marker.remove());
    markersRef.current.stops = {};

    if (!showStops) return;

    stops.forEach(stop => {
      const isHighDemand = (stop.currentWaitingCount || 0) > 40;
      const isBypassed = Boolean(stop.isBypassed);
      const isUniversity = stop.id === 'stop-11' || (stop.name && stop.name.toLowerCase().includes('navrachana'));
      const isStartStop = routes.some(r => r.stops && r.stops[0] === stop.id);
      const isStudentHomeStop = currentUser && currentUser.pickupStopId === stop.id;

      let iconHtml = '';
      let iconSize = [24, 24];
      let iconAnchor = [12, 12];

      if (isUniversity) {
        // Navrachana University Campus (Prominent Destination)
        iconSize = [36, 36];
        iconAnchor = [18, 18];
        iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 100;
          ">
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(245, 158, 11, 0.2);
              border: 1.5px solid rgba(245, 158, 11, 0.5);
              animation: driverPulse 2s infinite;
            "></div>
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #f59e0b;
              border: 2px solid #ffffff;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 15px;
              color: #ffffff;
              z-index: 2;
            ">
              🎓
            </div>
            <span style="
              position: absolute;
              top: -24px;
              background: rgba(15, 23, 42, 0.9);
              backdrop-filter: blur(8px);
              color: #fbbf24;
              font-size: 9px;
              font-weight: 700;
              padding: 2px 8px;
              border-radius: 999px;
              border: 1px solid rgba(245, 158, 11, 0.4);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
              white-space: nowrap;
              letter-spacing: 0.02em;
            ">
              🎓 NUV Campus (Destination)
            </span>
          </div>
        `;
      } else if (isBypassed) {
        // Bypassed Stop (Cancelled by student)
        iconSize = [28, 28];
        iconAnchor = [14, 14];
        iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.9;
          ">
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: rgba(244, 63, 94, 0.15);
              border: 2px dashed #f43f5e;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              color: #f43f5e;
              font-weight: 700;
            ">
              🚫
            </div>
            <span style="
              position: absolute;
              top: -22px;
              background: rgba(15, 23, 42, 0.9);
              backdrop-filter: blur(8px);
              color: #fb7185;
              font-size: 8.5px;
              font-weight: 600;
              padding: 2px 7px;
              border-radius: 999px;
              border: 1px solid rgba(244, 63, 94, 0.4);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              white-space: nowrap;
            ">
              🚫 Bypassed (Cancelled)
            </span>
          </div>
        `;
      } else if (isStudentHomeStop) {
        // Student's Assigned Home Location
        iconSize = [32, 32];
        iconAnchor = [16, 16];
        iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.2);
              border: 1.5px solid rgba(56, 189, 248, 0.5);
              animation: driverPulse 1.8s infinite;
            "></div>
            <div style="
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #0284c7;
              border: 2px solid #ffffff;
              box-shadow: 0 3px 12px rgba(2, 132, 199, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              color: #ffffff;
              z-index: 2;
            ">
              🏠
            </div>
            <span style="
              position: absolute;
              top: -22px;
              background: rgba(15, 23, 42, 0.9);
              backdrop-filter: blur(8px);
              color: #38bdf8;
              font-size: 8.5px;
              font-weight: 600;
              padding: 2px 7px;
              border-radius: 999px;
              border: 1px solid rgba(56, 189, 248, 0.4);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              white-space: nowrap;
            ">
              🏠 Your Pickup Stop
            </span>
          </div>
        `;
      } else if (isStartStop) {
        // Predefined Route Start Stop (Depot / Origin)
        iconSize = [26, 26];
        iconAnchor = [13, 13];
        iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: #059669;
              border: 2px solid #ffffff;
              box-shadow: 0 3px 10px rgba(5, 150, 105, 0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #ffffff;
            ">
              🏁
            </div>
            <span style="
              position: absolute;
              top: -20px;
              background: rgba(15, 23, 42, 0.9);
              backdrop-filter: blur(8px);
              color: #34d399;
              font-size: 8.5px;
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 999px;
              border: 1px solid rgba(16, 185, 129, 0.4);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
              white-space: nowrap;
            ">
              🏁 Route Origin
            </span>
          </div>
        `;
      } else {
        // Predefined Intermediate Home / Pickup Stop
        iconSize = [20, 20];
        iconAnchor = [10, 10];
        iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: ${isHighDemand ? '#ea580c' : '#0ea5e9'};
              border: 2px solid #ffffff;
              box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
            "></div>
            ${stop.currentWaitingCount > 0 ? `
              <span style="
                position: absolute;
                top: -18px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(8px);
                color: ${isHighDemand ? '#fb923c' : '#38bdf8'};
                font-size: 8.5px;
                font-weight: 600;
                padding: 1.5px 6px;
                border-radius: 999px;
                border: 1px solid ${isHighDemand ? 'rgba(234, 88, 12, 0.4)' : 'rgba(56, 189, 248, 0.4)'};
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
              ">
                ${stop.currentWaitingCount} waiting
              </span>
            ` : ''}
          </div>
        `;
      }

      const stopIcon = L.divIcon({
        className: 'custom-stop-div-icon',
        html: iconHtml,
        iconSize,
        iconAnchor
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon })
        .bindPopup(`
          <div style="background: #0f172a; color: #ffffff; padding: 12px; font-family: sans-serif; border: 2px solid #233554; border-radius: 8px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #233554; padding-bottom: 6px; margin-bottom: 6px;">
              <strong style="color: ${isUniversity ? '#f59e0b' : isBypassed ? '#f43f5e' : isStudentHomeStop ? '#38bdf8' : '#ffffff'}; font-size: 13px;">
                ${isUniversity ? '🎓 ' : isBypassed ? '🚫 ' : isStudentHomeStop ? '🏠 ' : isStartStop ? '🏁 ' : '🚏 '}${stop.name}
              </strong>
              <span style="font-size: 10px; font-family: monospace; color: #94a3b8; background: #1e293b; padding: 2px 6px; border-radius: 4px;">
                ${stop.code}
              </span>
            </div>

            ${isUniversity ? `
              <div style="font-size: 11px; color: #fde68a; font-weight: 700; background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
                🎓 OFFICIAL CAMPUS DESTINATION: Fixed termination point for all student commute corridors. Cannot be altered.
              </div>
            ` : isBypassed ? `
              <div style="font-size: 11px; color: #fca5a5; font-weight: bold; background: rgba(244,63,94,0.15); border: 1px solid #f43f5e; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
                ⚡ STOP DYNAMICALLY BYPASSED: Student cancelled today's commute. The bus has rerouted directly to the next waypoint, saving corridor time.
              </div>
            ` : isStudentHomeStop ? `
              <div style="font-size: 11px; color: #bae6fd; font-weight: 700; background: rgba(56,189,248,0.15); border: 1px solid #38bdf8; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
                🔒 YOUR REGISTERED HOME LOCATION: Fixed pickup and evening drop point. Commute is bound to Navrachana University.
              </div>
            ` : isStartStop ? `
              <div style="font-size: 11px; color: #a7f3d0; font-weight: 700; background: rgba(16,185,129,0.15); border: 1px solid #10b981; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
                🏁 PREDEFINED ROUTE START DEPOT: Origin waypoint for corridor fleet towards campus.
              </div>
            ` : `
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px;">
                Predefined Student Home Pickup Point
              </div>
            `}

            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Zone: <strong style="color: #ffffff;">${stop.campusZone || 'Vadodara'}</strong></div>
            <div style="font-size: 11px; color: #e2e8f0; margin-top: 2px;">Students Waiting: <strong style="color: #38bdf8;">${stop.currentWaitingCount || 0}</strong></div>
            ${stop.amenities && stop.amenities.length ? `
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Amenities: ${stop.amenities.join(', ')}</div>
            ` : ''}
          </div>
        `)
        .addTo(map);

      markersRef.current.stops[stop.id] = marker;
    });
  }, [stops, showStops, routes, currentUser]);

  // 5. Render & Animate Bus Markers with Live Google Maps Positioning
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    buses.forEach(bus => {
      if (!bus.lat || !bus.lng) return;

      const isSelected = bus.id === selectedBusId;
      const isBreakdown = bus.status === 'BREAKDOWN';
      const isDelayed = bus.status === 'DELAYED';
      const isStandby = bus.status === 'STANDBY';
      const isTripActive = Boolean(bus.tripActive || bus.status === 'EN_ROUTE');
      const isMoving = isTripActive && (bus.speedKmH || 0) > 0 && !isBreakdown;

      let markerBg = '#0284c7'; // default blue
      if (isBreakdown) markerBg = '#f43f5e';
      else if (isDelayed) markerBg = '#f59e0b';
      else if (isStandby || !isTripActive) markerBg = '#475569';
      else if (isMoving) markerBg = '#10b981';

      // Match route color if active and moving
      const route = routes.find(r => r.id === bus.routeId);
      if (route && isMoving && !isBreakdown && !isDelayed) {
        markerBg = route.color || markerBg;
      }

      const busShortName = bus.callsign ? bus.callsign.split(' ')[0] : bus.id;
      const busSpeed = bus.speedKmH || 0;

      const busIconHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
        ">
          <!-- Animated Radar Wave Ripple when Bus is actively Moving -->
          ${isMoving ? `
            <div style="
              position: absolute;
              width: 52px;
              height: 52px;
              border-radius: 50%;
              border: 2.5px solid #10b981;
              background: rgba(16, 185, 129, 0.22);
              animation: busRadarWave 1.6s infinite ease-out;
              pointer-events: none;
            "></div>
          ` : ''}

          <!-- Bus Emoji Circle Badge -->
          <div style="
            position: relative;
            width: ${isSelected ? '44px' : '38px'};
            height: ${isSelected ? '44px' : '38px'};
            border-radius: 50%;
            background: ${markerBg};
            border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2;
            transition: all 0.2s ease;
          ">
            <span style="
              font-size: ${isSelected ? '22px' : '19px'};
              display: inline-block;
              animation: ${isMoving ? 'busDrivingVibe 0.5s infinite alternate ease-in-out' : 'none'};
            ">🚌</span>

            <!-- Directional Navigation Heading Arrow -->
            ${isMoving ? `
              <div style="
                position: absolute;
                top: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #090d16;
                border: 1.5px solid #10b981;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transform: rotate(${bus.headingDeg || 0}deg);
                z-index: 5;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                <span style="color: #10b981; font-size: 8px; font-weight: 900; line-height: 1;">▲</span>
              </div>
            ` : ''}
          </div>

          <!-- High-Contrast Status Pill Tag -->
          <div style="
            position: absolute;
            bottom: -20px;
            background: rgba(9, 13, 22, 0.92);
            backdrop-filter: blur(8px);
            color: #ffffff;
            font-size: 9.5px;
            font-weight: 600;
            font-family: var(--font-sans);
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid ${isMoving ? 'rgba(16, 185, 129, 0.5)' : isBreakdown ? 'rgba(244, 63, 94, 0.5)' : isDelayed ? 'rgba(245, 158, 11, 0.5)' : 'rgba(148, 163, 184, 0.3)'};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
            pointer-events: none;
            z-index: 10;
            display: flex;
            align-items: center;
            gap: 5px;
          ">
            ${isMoving ? `
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 6px #10b981; display: inline-block;"></span>
              <span style="color: #34d399;">${busShortName}</span>
              <span style="color: #64748b;">•</span>
              <span style="color: #38bdf8; font-family: var(--font-mono);">${busSpeed} km/h</span>
            ` : isBreakdown ? `
              <span style="color: #f43f5e;">⚠️ Breakdown • ${busShortName}</span>
            ` : isDelayed ? `
              <span style="color: #fbbf24;">⏳ Delayed • ${busShortName}</span>
            ` : `
              <span style="width: 5px; height: 5px; border-radius: 50%; background: #94a3b8; display: inline-block;"></span>
              <span style="color: #cbd5e1;">${busShortName}</span>
              <span style="color: #64748b;">•</span>
              <span style="color: #94a3b8;">Standby</span>
            `}
          </div>
        </div>
      `;

      const busIcon = L.divIcon({
        className: 'bus-marker-div',
        html: busIconHtml,
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      if (markersRef.current.buses[bus.id]) {
        // Smoothly animate marker position on Google Maps
        markersRef.current.buses[bus.id].setLatLng([bus.lat, bus.lng]);
        markersRef.current.buses[bus.id].setIcon(busIcon);
      } else {
        const marker = L.marker([bus.lat, bus.lng], { icon: busIcon })
          .on('click', () => {
            if (onSelectBus) onSelectBus(bus.id);
          })
          .addTo(map);

        markersRef.current.buses[bus.id] = marker;
      }
    });

    // Cleanup decommissioned buses
    Object.keys(markersRef.current.buses).forEach(id => {
      if (!buses.find(b => b.id === id)) {
        markersRef.current.buses[id].remove();
        delete markersRef.current.buses[id];
      }
    });
  }, [buses, routes, selectedBusId, onSelectBus]);

  // Center on selected bus
  const handleCenterBus = (busId) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const targetBus = buses.find(b => b.id === busId) || buses[0];
    if (targetBus && targetBus.lat && targetBus.lng) {
      map.flyTo([targetBus.lat, targetBus.lng], 15, { duration: 1.2 });
    }
  };

  const bypassedStops = stops.filter(s => s.isBypassed);

  const isDriver = currentRole === 'driver' || currentUser?.role === 'driver';
  const isAdmin = currentRole === 'admin' || currentUser?.role === 'admin';
  const isStudent = currentRole === 'student' || currentUser?.role === 'student';

  // Active bus for Map Trip Controller - strictly locked to driver's assigned vehicle
  const activeControlBusId = isDriver 
    ? (currentUser?.assignedBusId || 'bus-01') 
    : (currentTripBusId || selectedBusId || (buses[0] && buses[0].id));
  const activeControlBus = buses.find(b => b.id === activeControlBusId) || buses[0];
  const isControlBusTripActive = Boolean(activeControlBus && (activeControlBus.tripActive || activeControlBus.status === 'EN_ROUTE'));
  const isControlBusMoving = Boolean(
    isControlBusTripActive &&
    (activeControlBus.speedKmH || 0) > 0 &&
    activeControlBus.status !== 'BREAKDOWN'
  );

  const handleTripToggle = async (busId, start) => {
    if (!busId) return;

    if (isDriver && currentUser?.assignedBusId && busId !== currentUser.assignedBusId) {
      alert(`Access Denied: You are assigned to vehicle ${currentUser.assignedBusId.toUpperCase()}. You are only permitted to manage trips for your assigned bus.`);
      return;
    }

    const endpoint = start ? `${API_BASE}/trip/start` : `${API_BASE}/trip/end`;

    // Immediate optimistic update
    if (onTripToggle) {
      onTripToggle(busId, start);
    }

    try {
      const token = localStorage.getItem('nuv_auth_token') || 'demo-token-driver';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ busId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Authorization failed: Trip command rejected.');
        if (onTripToggle) {
          onTripToggle(busId, !start);
        }
      }
    } catch (err) {
      console.error('Trip toggle error:', err);
    }
  };

  return (
    <div className="map-wrapper" style={{ position: 'relative' }}>
      {/* Floating Fleet Trip Controller: Visible for Drivers & Admins, Hidden for Students */}
      {!isStudent && (
        <div style={{
          position: 'absolute',
          top: '64px',
          left: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(9, 13, 22, 0.88)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45)',
          borderRadius: '12px',
          padding: '6px 14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>⚡</span>
              <span>{isDriver ? 'Driver Trip Console:' : 'Trip Controller:'}</span>
            </span>
            {isDriver ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '8px',
                padding: '3px 10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ffffff'
              }}>
                <span style={{ fontSize: '0.75rem' }}>🔒</span>
                <span>{activeControlBus?.callsign}</span>
                <span style={{ opacity: 0.7, fontSize: '0.7rem' }}>({activeControlBus?.numberPlate})</span>
              </div>
            ) : (
              <select
                value={activeControlBusId || ''}
                onChange={e => setCurrentTripBusId(e.target.value)}
                style={{
                  background: 'rgba(30, 41, 59, 0.7)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {buses.map(b => (
                  <option key={b.id} value={b.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {b.callsign} ({b.tripActive || b.status === 'EN_ROUTE' ? 'Moving' : 'Standby'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Live Status indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '999px',
            background: isControlBusTripActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${isControlBusTripActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: isControlBusTripActive ? '#34d399' : '#fca5a5'
          }}>
            <span style={{
              fontSize: '13px',
              display: 'inline-block',
              animation: isControlBusMoving ? 'busDrivingVibe 0.5s infinite alternate ease-in-out' : 'none'
            }}>🚌</span>
            <span>{isControlBusTripActive ? `Moving (${activeControlBus?.speedKmH || 34} km/h)` : 'Stopped'}</span>
          </div>

          {/* Start Trip Button */}
          <button
            type="button"
            onClick={() => handleTripToggle(activeControlBusId, true)}
            disabled={isControlBusTripActive}
            style={{
              background: isControlBusTripActive ? 'rgba(6, 78, 59, 0.4)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: isControlBusTripActive ? '#6ee7b7' : '#ffffff',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: isControlBusTripActive ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '5px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: isControlBusTripActive ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isControlBusTripActive ? 0.45 : 1,
              transition: 'all 0.2s ease'
            }}
            title="Start Trip: Bus begins moving along the route"
          >
            <Play size={12} fill={isControlBusTripActive ? '#6ee7b7' : '#ffffff'} />
            <span>Start Trip</span>
          </button>

          {/* End Trip Button */}
          <button
            type="button"
            onClick={() => handleTripToggle(activeControlBusId, false)}
            disabled={!isControlBusTripActive}
            style={{
              background: !isControlBusTripActive ? 'rgba(76, 5, 25, 0.4)' : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              color: '#ffffff',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              boxShadow: !isControlBusTripActive ? 'none' : '0 2px 8px rgba(244, 63, 94, 0.3)',
              borderRadius: '8px',
              padding: '5px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: !isControlBusTripActive ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: !isControlBusTripActive ? 0.45 : 1,
              transition: 'all 0.2s ease'
            }}
            title="End Trip: Bus stops moving immediately"
          >
            <Square size={12} fill="#ffffff" />
            <span>End Trip</span>
          </button>
        </div>
      )}

      {/* Dynamic Route Rerouting Alert Banner */}
      {bypassedStops.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '116px',
          left: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.94)',
          border: '1.5px solid #f43f5e',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#fca5a5', fontWeight: 800 }}>
                DYNAMIC ROUTE REROUTING ACTIVE: {bypassedStops.map(s => s.name.split(' (')[0]).join(', ')} BYPASSED
              </div>
              <div style={{ fontSize: '0.71rem', color: '#cbd5e1' }}>
                Student cancelled trip. The bus is steering directly around this stop on Google Maps to save ~5 mins travel time.
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.68rem',
            background: '#f43f5e',
            color: '#ffffff',
            padding: '3px 8px',
            borderRadius: '4px',
            fontWeight: 800,
            fontFamily: 'monospace',
            whiteSpace: 'nowrap'
          }}>
            BYPASS DETOUR
          </span>
        </div>
      )}

      {/* Map Interactive HUD Header */}
      <div className="map-hud-overlay">
        {/* Left: Corridors Filter */}
        <div className="hud-panel route-filter-bar">
          <Layers size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Corridors:</span>
          
          <button
            type="button"
            className="route-chip"
            style={{
              background: activeRouteFilter === 'ALL' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: activeRouteFilter === 'ALL' ? '#38bdf8' : '#cbd5e1',
              border: activeRouteFilter === 'ALL' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
            onClick={() => setActiveRouteFilter('ALL')}
          >
            All Corridors
          </button>

          {routes.map(r => (
            <button
              key={r.id}
              type="button"
              className="route-chip"
              style={{
                background: activeRouteFilter === r.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
                color: activeRouteFilter === r.id ? '#ffffff' : '#cbd5e1',
                border: activeRouteFilter === r.id ? `1px solid ${r.color || '#38bdf8'}` : '1px solid rgba(255, 255, 255, 0.08)'
              }}
              onClick={() => setActiveRouteFilter(r.id)}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color || '#38bdf8' }}></span>
              {r.code}
            </button>
          ))}

          <button
            type="button"
            className="route-chip"
            style={{ background: 'rgba(30, 41, 59, 0.6)', color: '#cbd5e1', marginLeft: 'auto' }}
            onClick={() => setShowStops(!showStops)}
            title="Toggle Stops visibility"
          >
            {showStops ? <Eye size={13} color="#38bdf8" /> : <EyeOff size={13} color="#94a3b8" />}
            <span>Stops</span>
          </button>
        </div>

        {/* Right: Google Maps Style Selector & Center Action */}
        <div className="hud-panel" style={{ display: 'flex', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Map:</span>
          
          <button
            type="button"
            className="route-chip"
            style={{
              background: mapStyle === 'roadmap' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: mapStyle === 'roadmap' ? '#34d399' : '#cbd5e1',
              border: mapStyle === 'roadmap' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
            onClick={() => setMapStyle('roadmap')}
          >
            Streets
          </button>

          <button
            type="button"
            className="route-chip"
            style={{
              background: mapStyle === 'satellite' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: mapStyle === 'satellite' ? '#34d399' : '#cbd5e1',
              border: mapStyle === 'satellite' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
            onClick={() => setMapStyle('satellite')}
          >
            Satellite
          </button>

          <button
            type="button"
            className="route-chip"
            style={{
              background: mapStyle === 'terrain' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.6)',
              color: mapStyle === 'terrain' ? '#34d399' : '#cbd5e1',
              border: mapStyle === 'terrain' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}
            onClick={() => setMapStyle('terrain')}
          >
            Terrain
          </button>

          <button
            type="button"
            className="route-chip"
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              marginLeft: '4px'
            }}
            onClick={() => handleCenterBus(selectedBusId || (buses[0] && buses[0].id))}
            title="Focus Active Bus on Google Maps"
          >
            <Crosshair size={13} color="#38bdf8" />
            <span>Focus</span>
          </button>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        zIndex: 1000,
        background: 'rgba(9, 13, 22, 0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
        borderRadius: '10px',
        padding: '5px 12px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        fontSize: '0.72rem',
        color: '#cbd5e1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🏁</span>
          <span style={{ color: '#34d399', fontWeight: 500 }}>Origin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🏠</span>
          <span style={{ color: '#38bdf8', fontWeight: 500 }}>Pickup</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🎓</span>
          <span style={{ color: '#fbbf24', fontWeight: 500 }}>NUV Campus</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🚫</span>
          <span style={{ color: '#fb7185', fontWeight: 500 }}>Bypassed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span>🚌</span>
          <span style={{ color: '#34d399', fontWeight: 500 }}>Fleet 1Hz</span>
        </div>
      </div>

      {/* Leaflet Google Map Container */}
      <div ref={mapContainerRef} className="leaflet-map-element" />
    </div>
  );
}
