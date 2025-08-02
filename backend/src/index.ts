//import express from 'express';
//import cors from 'cors';
//import dotenv from 'dotenv';
//import { PrismaClient } from '@prisma/client';
//import tradesRouter from './routes/trades';
//import brokersRouter from './routes/brokers';  // 🔥 ADDED

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tradesRouter from './routes/trades';
import brokersRouter from './routes/brokers';
import importRoutes from './routes/import';
import notesRouter from './routes/notes';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';
import { JWTUtils } from './utils/auth';
import PrismaClientSingleton, { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002; // 🔥 CHANGED: Use 3002 instead of 3001

// Middleware
app.use(cors());

// Special webhook route (needs raw body for Stripe signature verification)
app.use('/api/webhooks', webhooksRouter);

// Standard JSON parsing
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes
app.use('/api/auth', authRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/trades/import', importRoutes);
app.use('/api/notes', notesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/subscriptions', subscriptionsRouter); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trading Journal API is running' });
});

// Global error handler for JSON parsing and other errors
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (error.type === 'entity.parse.failed' || error.message.includes('JSON')) {
    return res.status(400).json({
      type: 'error',
      error: {
        type: 'invalid_request_error',
        message: 'Invalid JSON format. Please check for special characters or encoding issues.'
      }
    });
  }

  res.status(500).json({
    type: 'error',
    error: {
      type: 'internal_server_error',
      message: 'An internal server error occurred'
    }
  });
});

// Database warmup function
const warmupDatabase = async () => {
  console.log('🔥 Warming up shared database connection pool...');
  
  try {
    // Pre-connect to database using singleton
    await PrismaClientSingleton.connect();
    
    // Run some dummy queries to initialize connection pool and caches
    await Promise.all([
      prisma.user.findFirst(),
      prisma.trade.findFirst(),  
      prisma.subscription.findFirst(),
      prisma.broker.findFirst(),
      prisma.note.findFirst(),
      prisma.loginHistory.findFirst() // Add LoginHistory to warmup
    ]);
    
    // Pre-load JWT verification library (dummy token will fail but loads crypto)
    try {
      JWTUtils.verifyToken('dummy.token.string');
    } catch (e) {
      // Expected to fail, just loads the JWT library
    }
    
    console.log('✅ Shared database connection pool warmed up and ready!');
  } catch (error) {
    console.error('⚠️  Database warmup failed:', error);
    // Don't crash the server, just log the warning
  }
};

// Start server with error handling
const startServer = async () => {
  // Warmup database before starting server
  await warmupDatabase();
  
  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Trading Journal API ready`);
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`❌ Port ${PORT} is already in use`);
      console.log(`🔄 Trying port ${parseInt(PORT.toString()) + 1}...`);
      
      // Try next port
      process.env.PORT = (parseInt(PORT.toString()) + 1).toString();
      setTimeout(startServer, 1000);
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  });
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});