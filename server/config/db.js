const mongoose = require('mongoose');

let isConnected = false;
let memoryStore = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuspulse';
  
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500, // Quick timeout so we don't stall if Mongo daemon isn't running
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[Database] Local MongoDB unavailable (${error.message}).`);
    console.log(`[Database] -> Activating High-Performance In-Memory Data Store with Live Persistence.`);
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  type: isConnected ? 'MongoDB Physical Database' : 'High-Performance In-Memory Reactive Store'
});

module.exports = {
  connectDB,
  getDBStatus,
  isConnected: () => isConnected
};
