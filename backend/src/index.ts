//import express from 'express';
//import cors from 'cors';
//import dotenv from 'dotenv';
//import { PrismaClient } from '@prisma/client';
//import tradesRouter from './routes/trades';
//import brokersRouter from './routes/brokers';  // 🔥 ADDED

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import tradesRouter from './routes/trades';
import brokersRouter from './routes/brokers';
import importRoutes from './routes/import';
import notesRouter from './routes/notes'; 

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002; // 🔥 CHANGED: Use 3002 instead of 3001

// Middleware
app.use(cors());
//app.use(express.json());

// Enhanced JSON parsing with better error handling
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: Buffer) => {
    try {
      // Attempt to parse the buffer to validate JSON format
      const body = buf.toString('utf8');
      
      // Check for common Unicode surrogate issues that break JSON parsing
      if (body.includes('\uD800') || body.includes('\uDFFF')) {
        console.warn('Request contains potentially problematic Unicode surrogates');
      }
      
      JSON.parse(body);
    } catch (error: any) {
      console.error('JSON parsing validation failed:', {
        error: error.message,
        url: req.url,
        method: req.method,
        contentLength: buf.length,
        contentPreview: buf.toString('utf8').substring(0, 200) + '...'
      });
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes
app.use('/api/trades', tradesRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/trades/import', importRoutes);
app.use('/api/notes', notesRouter); 

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

// Start server with error handling
const startServer = () => {
  const server = app.listen(PORT, () => {
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
  await prisma.$disconnect();
  console.log('📊 Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});