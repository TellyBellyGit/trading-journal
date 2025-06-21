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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002; // 🔥 CHANGED: Use 3002 instead of 3001

// Middleware
app.use(cors());
//app.use(express.json());

app.use(express.json({ limit: '10mb' })); // Increase from default 1mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes
app.use('/api/trades', tradesRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/trades/import', importRoutes); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trading Journal API is running' });
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