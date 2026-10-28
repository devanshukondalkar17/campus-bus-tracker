require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { connectDB, getDBStatus } = require('./config/db');

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.io & REST
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Import Services
const TelemetrySimulator = require('./services/telemetrySimulator');
const AIDispatchEngine = require('./services/aiDispatchEngine');

// Instantiate Simulation & AI Engine
const simulator = new TelemetrySimulator(io);
const aiEngine = new AIDispatchEngine(simulator);

// Start Real-time Telemetry Loop
simulator.start();

// Connect to Database (with automatic graceful fallback)
connectDB();

// API Routes
const fleetRoutes = require('./routes/fleetRoutes')(simulator, aiEngine, io);
const aiRoutes = require('./routes/aiRoutes')(simulator, aiEngine, io);
const studentRoutes = require('./routes/studentRoutes')(simulator, aiEngine, io);
const authRoutes = require('./routes/authRoutes')(simulator, io);
const adminRoutes = require('./routes/adminRoutes')(simulator, aiEngine, io);
const tripRoutes = require('./routes/tripRoutes')(simulator, aiEngine, io);
const notificationRoutes = require('./routes/notificationRoutes')(simulator);
const complaintRoutes = require('./routes/complaintRoutes')(simulator, aiEngine, io);

app.use('/api/fleet', fleetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);

// Health & System Info Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Navrachana University (NUV) AI Transit & Fleet Operations Engine - Vadodara',
    campus: 'Vasna-Bhayli Main Road, Vadodara, Gujarat',
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
    telemetryStreaming: true,
    activeBuses: simulator.getBuses().filter(b => b.status === 'EN_ROUTE').length,
    activeAlertsCount: aiEngine.getActiveAlerts().length
  });
});

// Socket.io Connection Management
io.on('connection', (socket) => {
  console.log(`[Socket.io] Real-time client connected: ${socket.id}`);

  // Send initial full fleet snapshot immediately upon connecting
  socket.emit('initial_state', {
    buses: simulator.getBuses(),
    routes: simulator.getRoutes(),
    stops: simulator.getStops(),
    alerts: aiEngine.getActiveAlerts(),
    timetableSurges: simulator.getTimetableSurges()
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Serve frontend in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>CampusPulse AI Backend Server</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px; text-align: center; }
              .card { background: #131d31; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              h1 { color: #38bdf8; }
              code { background: #1e293b; padding: 4px 8px; border-radius: 6px; color: #a5f3fc; }
              .status { color: #34d399; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>⚡ Navrachana Transit AI Engine</h1>
              <p>Backend API & Real-time Telemetry Service is <span class="status">ONLINE (Port ${process.env.PORT || 5000})</span>.</p>
              <div style="margin: 24px 0;">
                <a href="http://localhost:5173" style="display: inline-block; background: #38bdf8; color: #000; font-weight: 700; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 1.05rem;">
                  🚀 Open Live Operations Dashboard (Port 5173)
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 0.85rem;">The frontend dashboard is running at: <a style="color: #38bdf8;" href="http://localhost:5173">http://localhost:5173</a></p>
              <p style="color: #64748b; font-size: 0.8rem;">Health check endpoint: <a style="color: #a5f3fc;" href="/api/health">/api/health</a></p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CampusPulse AI Dispatch Server running on port ${PORT}`);
  console.log(`📡 WebSocket Engine ready for live telemetry streams`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/fleet/overview`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
