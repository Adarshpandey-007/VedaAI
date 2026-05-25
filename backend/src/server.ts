import dotenv from 'dotenv';
// Load environmental variables immediately as the first execution block
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import assignmentRoutes from './routes/assignmentRoutes';
import toolkitRoutes from './routes/toolkitRoutes';
import { initWebSocket } from './sockets/socket';
import { QueueManager } from './queues/queue';
import { DBStore } from './services/dbStore';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow requests from Next.js dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-key']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploaded reference materials
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log requests in development
app.use((req: any, res: any, next: any) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Configure API endpoints
app.use('/api/assignments', assignmentRoutes);
app.use('/api/toolkit', toolkitRoutes);

// Base healthcheck route
app.get('/health', (req: any, res: any) => {
  res.status(200).json({
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'running in fallback mode',
    time: new Date().toISOString()
  });
});

// Start initialization routines
const startServer = async () => {
  // 1. Initialize WebSocket Server
  console.log('[Server] Initializing WebSockets...');
  initWebSocket(server);

  // 2. Connect to MongoDB (Optional - graceful fallback)
  const dbUri = process.env.MONGODB_URI;
  if (dbUri) {
    console.log('[Server] Connecting to MongoDB...');
    try {
      await mongoose.connect(dbUri, {
        serverSelectionTimeoutMS: 5000 // 5s timeout for remote cloud handshakes
      });
      console.log('[Server] MongoDB connection established successfully!');
      DBStore.setStorageMode(true);
    } catch (err: any) {
      console.warn(`[Server] MongoDB connection failed: ${err.message || err}. Running in fallback storage mode.`);
      DBStore.setStorageMode(false);
    }
  } else {
    console.warn('[Server] MONGODB_URI is not set. Running in local JSON-file fallback storage mode.');
    DBStore.setStorageMode(false);
  }

  // 3. Initialize background queues (BullMQ / Emulator)
  console.log('[Server] Initializing background task queue...');
  await QueueManager.init();

  // 4. Start HTTP Server
  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 VedaAI Backend Server running on http://localhost:${PORT}`);
    console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================`);
  });
};

startServer().catch(err => {
  console.error('[Server] Critical start-up failure:', err);
  process.exit(1);
});
