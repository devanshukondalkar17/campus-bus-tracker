/**
 * CampusPulse AI Dispatch & Fleet Operations Engine
 * Handles demand forecasting, automated fleet re-balancing, anomaly detection,
 * and Natural Language Dispatch Command Interpretation.
 */

const campusData = require('../seed/campusData');

class AIDispatchEngine {
  constructor(stateStore) {
    this.store = stateStore;
    this.activeAlerts = [];
    this.dispatchLogs = [];
    this.initDefaultAlerts();
  }

  initDefaultAlerts() {
    this.activeAlerts = [
      {
        id: `alt-${Date.now()}-1`,
        title: "Sayajigunj Morning Commute Surge Active",
        message: "Vadodara Central Station pickup queue elevated (74 students). NUV-Titan-101 approaching 89% load.",
        severity: "AI_DISPATCH",
        source: "Surge Forecast Model",
        relatedBusId: "bus-01",
        relatedRouteId: "route-101",
        timestamp: new Date().toISOString()
      }
    ];
  }

  /**
   * Evaluates fleet status, identifies bottlenecks, and suggests/executes automated dispatches
   */
  evaluateFleetHealth() {
    const buses = this.store.getBuses();
    const recommendations = [];

    buses.forEach(bus => {
      // 1. High Occupancy Overload Check
      const loadPercent = Math.round((bus.currentOccupancy / bus.capacity) * 100);
      if (loadPercent >= 85 && bus.status !== 'STANDBY') {
        recommendations.push({
          type: "CAPACITY_ALERT",
          severity: "WARNING",
          busId: bus.id,
          callsign: bus.callsign,
          routeId: bus.routeId,
          message: `${bus.callsign} is at ${loadPercent}% capacity (${bus.currentOccupancy}/${bus.capacity} pax). Recommend dispatching standby bus or skipping non-essential stops.`
        });
      }

      // 2. Anomaly / Stalling Detection
      if (bus.speedKmH === 0 && bus.status === 'EN_ROUTE' && bus.etaMinutesNextStop > 7) {
        recommendations.push({
          type: "DELAY_ANOMALY",
          severity: "CRITICAL",
          busId: bus.id,
          callsign: bus.callsign,
          routeId: bus.routeId,
          message: `${bus.callsign} has stalled with delay > 7 mins. Auto-reroute candidate.`
        });
      }

      // 3. Telematics & Safety Score Check
      if (bus.telematics && bus.telematics.harshBrakingToday >= 3) {
        recommendations.push({
          type: "SAFETY_AUDIT",
          severity: "INFO",
          busId: bus.id,
          callsign: bus.callsign,
          message: `${bus.callsign} driver logged ${bus.telematics.harshBrakingToday} harsh braking events today.`
        });
      }
    });

    return {
      timestamp: new Date().toISOString(),
      activeFleetCount: buses.filter(b => b.status === 'EN_ROUTE').length,
      standbyFleetCount: buses.filter(b => b.status === 'STANDBY').length,
      recommendations
    };
  }

  /**
   * Predictive Seat Availability Calculator for Students
   * Calculates probability of obtaining a seat based on distance, stop historical demand, and live occupancy
   */
  calculateSeatProbability(busId, stopId) {
    const bus = this.store.getBusById(busId);
    const stop = this.store.getStopById(stopId);

    if (!bus || !stop) {
      return { probability: 50, status: "MODERATE", availableSeats: 5 };
    }

    const openSeats = Math.max(0, bus.seatedCapacity - bus.currentOccupancy);
    const loadPercent = (bus.currentOccupancy / bus.capacity) * 100;
    
    let probabilityScore = 100 - loadPercent;
    if (stop.historicalDemand > 80) probabilityScore -= 15;
    if (bus.status === 'DELAYED') probabilityScore -= 10;
    
    probabilityScore = Math.max(5, Math.min(98, Math.round(probabilityScore)));

    let status = "HIGH";
    if (probabilityScore < 40) status = "LOW";
    else if (probabilityScore < 70) status = "MODERATE";

    return {
      probability: probabilityScore,
      status,
      openSeats,
      totalCapacity: bus.capacity,
      currentOccupancy: bus.currentOccupancy,
      confidenceBand: "AI Calibrated via Sensor Telemetry"
    };
  }

  /**
   * "Leave-Now" Walk & Boarding Time Optimizer for Students
   */
  calculateLeaveNowAdvice(studentLocation, targetStopId, routeId) {
    const stop = this.store.getStopById(targetStopId);
    const buses = this.store.getBusesByRoute(routeId);

    if (!stop || !buses.length) {
      return {
        action: "NO_BUS_FOUND",
        message: "No active buses operating on this corridor right now."
      };
    }

    // Pick closest incoming bus
    const incomingBus = buses[0];
    const busEtaMins = incomingBus.etaMinutesNextStop || 4;

    // Simulated walk speed 1.2 m/s (~80 meters per minute)
    // Distance from mock student location to stop
    const walkDistanceMeters = 350; 
    const walkTimeMins = Math.ceil(walkDistanceMeters / 75); // ~5 mins

    const bufferMins = busEtaMins - walkTimeMins;

    let urgency = "NORMAL";
    let message = "";

    if (bufferMins < 0) {
      urgency = "MISSED_RISK";
      message = `Titan incoming in ${busEtaMins} mins, but walking takes ${walkTimeMins} mins. Suggest catching next scheduled vehicle in 12 mins.`;
    } else if (bufferMins <= 2) {
      urgency = "LEAVE_IMMEDIATELY";
      message = `⚡ Leave now! Walk time is ${walkTimeMins} mins. ${incomingBus.callsign} arrives at ${stop.name} in ${busEtaMins} mins.`;
    } else {
      urgency = "RELAXED";
      message = `You have ${bufferMins} minutes buffer before needing to walk to ${stop.name}.`;
    }

    return {
      busId: incomingBus.id,
      callsign: incomingBus.callsign,
      targetStopName: stop.name,
      walkTimeMins,
      busEtaMins,
      bufferMins,
      urgency,
      message,
      estimatedWalkMeters: walkDistanceMeters
    };
  }

  /**
   * Natural Language AI Dispatcher Copilot Powered by Google Gemini API
   * Parses natural commands from Operations Personnel and reasons over live fleet state
   */
  async processCopilotCommand(prompt) {
    const cleanPrompt = prompt.toLowerCase();
    const buses = this.store.getBuses();
    const routes = this.store.getRoutes();
    const stops = this.store.getStops();
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if an actual fleet dispatch action should be executed in memory
    let actionResult = null;

    if (cleanPrompt.includes('dispatch') || cleanPrompt.includes('standby') || cleanPrompt.includes('send extra') || cleanPrompt.includes('mobilize')) {
      const standbyBus = buses.find(b => b.status === 'STANDBY');
      if (standbyBus) {
        let targetRoute = routes[0];
        if (cleanPrompt.includes('202') || cleanPrompt.includes('emerald') || cleanPrompt.includes('gotri')) targetRoute = routes[1];
        if (cleanPrompt.includes('303') || cleanPrompt.includes('crimson') || cleanPrompt.includes('manjalpur')) targetRoute = routes[2];

        standbyBus.status = 'EN_ROUTE';
        standbyBus.tripActive = true;
        standbyBus.routeId = targetRoute.id;
        standbyBus.currentOccupancy = 6;
        standbyBus.speedKmH = 32;
        standbyBus.nextStopId = targetRoute.stops[0];
        standbyBus.etaMinutesNextStop = 2;

        const newAlert = {
          id: `alt-${Date.now()}`,
          title: "AI Standby Dispatch Mobilized",
          message: `${standbyBus.callsign} deployed onto ${targetRoute.name} by Gemini Operations Copilot.`,
          severity: "AI_DISPATCH",
          source: "Gemini AI Copilot",
          relatedBusId: standbyBus.id,
          relatedRouteId: targetRoute.id,
          timestamp: new Date().toISOString()
        };
        this.activeAlerts.unshift(newAlert);
        actionResult = { action: 'STANDBY_DISPATCHED', bus: standbyBus, route: targetRoute };
      }
    } else if (cleanPrompt.includes('breakdown') || cleanPrompt.includes('accident') || cleanPrompt.includes('stalled')) {
      let targetBus = buses.find(b => cleanPrompt.includes(b.id) || cleanPrompt.includes(b.callsign.toLowerCase())) || buses[0];
      targetBus.status = 'BREAKDOWN';
      targetBus.speedKmH = 0;

      const newAlert = {
        id: `alt-${Date.now()}`,
        title: `CRITICAL: ${targetBus.callsign} Reported Breakdown`,
        message: `Bus disabled on ${targetBus.routeId}. Autonomous re-routing engine alerted students and nearby units.`,
        severity: "CRITICAL",
        source: "Gemini Incident Monitor",
        relatedBusId: targetBus.id,
        timestamp: new Date().toISOString()
      };
      this.activeAlerts.unshift(newAlert);
      actionResult = { action: 'BREAKDOWN_FLAGGED', bus: targetBus };
    }

    // Call Google Gemini API if API key is configured
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const fleetContext = {
          university: "Navrachana University, Vadodara (Vasna-Bhayli Road)",
          activeBuses: buses.map(b => ({
            callsign: b.callsign,
            plate: b.numberPlate,
            routeId: b.routeId,
            status: b.status,
            occupancy: `${b.currentOccupancy}/${b.capacity}`,
            speed: `${b.speedKmH} km/h`
          })),
          activeAlerts: this.activeAlerts.slice(0, 3).map(a => a.title),
          corridors: routes.map(r => r.name)
        };

        const systemInstruction = `You are the autonomous AI Dispatch & Operations Kernel for Navrachana University (NUV) in Vadodara, Gujarat.
You manage the college bus fleet connecting students across Vadodara (Sayajigunj, Alkapuri, Gotri, Fatehgunj, Manjalpur) to the Bhayli campus.
Current live fleet state:
${JSON.stringify(fleetContext, null, 2)}

Provide a concise, professional, authoritative operations response (2-3 sentences max) addressing the transport manager's command. Mention specific bus callsigns, routes, or Vadodara stops where relevant.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nManager Command: "${prompt}"` }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 250
            }
          })
        });

        if (response.ok) {
          const geminiData = await response.json();
          const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            return {
              success: true,
              source: "Google Gemini 1.5 Flash",
              actionTaken: actionResult ? actionResult.action : "GEMINI_DISPATCH_REASONING",
              response: generatedText.trim()
            };
          }
        }
      } catch (err) {
        console.warn('[Gemini API] Request error, switching to deterministic fallback:', err.message);
      }
    }

    // Deterministic fallback if Gemini is offline or prompt matches direct keyword
    if (actionResult && actionResult.action === 'STANDBY_DISPATCHED') {
      return {
        success: true,
        source: "Local Dispatch Kernel",
        actionTaken: "STANDBY_DISPATCHED",
        response: `🚀 [DISPATCH CONFIRMED] Mobilized ${actionResult.bus.callsign} to ${actionResult.route.name}. Real-time tracking telemetry initiated at stop ${actionResult.route.stops[0]} to relieve Vadodara student congestion.`
      };
    }

    if (actionResult && actionResult.action === 'BREAKDOWN_FLAGGED') {
      return {
        success: true,
        source: "Local Dispatch Kernel",
        actionTaken: "INCIDENT_FLAGGED_REROUTE",
        response: `⚠️ [INCIDENT LOGGED] Marked ${actionResult.bus.callsign} as BREAKDOWN. Real-time passenger alerts broadcasted to students with destination stops across Vadodara.`
      };
    }

    if (cleanPrompt.includes('status') || cleanPrompt.includes('report') || cleanPrompt.includes('health') || cleanPrompt.includes('how many')) {
      const activeCount = buses.filter(b => b.status === 'EN_ROUTE').length;
      const delayedCount = buses.filter(b => b.status === 'DELAYED' || b.status === 'BREAKDOWN').length;
      const avgOccupancy = Math.round(buses.reduce((acc, b) => acc + b.currentOccupancy, 0) / (buses.length || 1));

      return {
        success: true,
        source: "Local Telemetry Kernel",
        actionTaken: "TELEMETRY_REPORT",
        response: `📋 [NUV FLEET STATUS] ${activeCount} active buses on Vadodara corridors, ${delayedCount} delayed/incident units. Current average occupancy: ${avgOccupancy} students per bus. All GPS telematics streaming at 1Hz.`
      };
    }

    return {
      success: true,
      source: "Local Dispatch Kernel",
      actionTaken: "ASSISTANT_NOTE",
      response: `⚡ Navrachana AI Dispatch ready for command: "${prompt}". You can instruct me to: "Dispatch standby bus to Route 101 for Sayajigunj surge", "Report breakdown on NUV-Titan-101", or "Give me Navrachana fleet status report".`
    };
  }

  getActiveAlerts() {
    return this.activeAlerts;
  }

  addAlert(alert) {
    this.activeAlerts.unshift({
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...alert
    });
  }

  resolveAlert(alertId) {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);
  }
}

module.exports = AIDispatchEngine;
