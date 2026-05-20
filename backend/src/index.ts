//import express from 'express';
//import cors from 'cors';
//import dotenv from 'dotenv';
//import { PrismaClient } from '@prisma/client';
//import tradesRouter from './routes/trades';
//import brokersRouter from './routes/brokers';  // 🔥 ADDED

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import tradesRouter from './routes/trades';
import brokersRouter from './routes/brokers';
import importRoutes from './routes/import';
import notesRouter from './routes/notes';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import userRouter from './routes/user';
import subscriptionsRouter from './routes/subscriptions';
import webhooksRouter from './routes/webhooks';
import analysisRouter from './routes/analysis';
import { JWTUtils } from './utils/auth';
import PrismaClientSingleton, { prisma } from './lib/prisma';
import { emailService } from './services/emailService';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3002; // 🔥 CHANGED: Use 3002 instead of 3001

// Middleware - CORS configuration (env-driven, dev-safe)
const allowedOrigins = new Set<string>();
if (process.env.FRONTEND_URL) {
  allowedOrigins.add(process.env.FRONTEND_URL);
}
// Allow Cloudflare Pages production domain
allowedOrigins.add('https://trading-journal-dlb.pages.dev');
// Allow local dev origins only when not in production
if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5174');
}
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Allow same-origin or non-browser requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Explicitly handle CORS preflight for all routes
app.options('*', cors(corsOptions));

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
app.use('/api/user', userRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/analysis', analysisRouter); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trading Journal API is running' });
});

// Email config health check
app.get('/api/health/email', async (req, res) => {
  try {
    const apiKey = process.env.RESEND_API_KEY || '';
    const fromEmail = process.env.FROM_EMAIL || '';
    const fromName = process.env.FROM_NAME || '';
    const frontendUrl = process.env.FRONTEND_URL || '';

    let configurationValid = false;
    try {
      configurationValid = await emailService.testConfiguration();
    } catch (_) {
      configurationValid = false;
    }

    res.json({
      resend: {
        apiKeyPresent: !!apiKey,
        apiKeyFormatValid: !!apiKey && apiKey.startsWith('re_'),
        configurationValid,
      },
      fromEmailPresent: !!fromEmail,
      fromNamePresent: !!fromName,
      frontendUrlSet: !!frontendUrl,
      frontendUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check email configuration',
    });
  }
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
    
    console.log('🔥 [WARMUP] Phase 1: Initializing read connections...');
    // Run some dummy queries to initialize connection pool and caches
    await Promise.all([
      prisma.user.findFirst(),
      prisma.trade.findFirst(),  
      prisma.subscription.findFirst(),
      prisma.broker.findFirst(),
      prisma.note.findFirst(),
      prisma.loginHistory.findFirst()
    ]);
    
    console.log('🔥 [WARMUP] Phase 2: Initializing write connections and query plans...');
    // Initialize write paths by performing safe UPDATE operations
    // This warms up the connection pool for write operations and caches query plans
    
    // Find a user to perform dummy update (should exist after seeding)
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      // Perform a safe dummy update that doesn't change anything meaningful
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          updatedAt: new Date() // Just update the timestamp, harmless operation
        }
      });
      console.log('🔥 [WARMUP] User.update path initialized');
    }
    
    // Warm up LoginHistory create operation (used in every login)
    // We'll create and immediately delete a dummy record
    try {
      const dummyHistory = await prisma.loginHistory.create({
        data: {
          userId: testUser?.id || 1,
          ipAddress: '127.0.0.1',
          userAgent: 'warmup-agent',
          success: true,
          failureReason: 'warmup-test'
        }
      });
      
      // Immediately clean up the dummy record
      await prisma.loginHistory.delete({
        where: { id: dummyHistory.id }
      });
      console.log('🔥 [WARMUP] LoginHistory.create/delete paths initialized');
    } catch (warmupError) {
      console.log('🔥 [WARMUP] LoginHistory warmup skipped (no test user available)');
    }
    
    console.log('🔥 [WARMUP] Phase 3: Loading JWT crypto libraries...');
    // Pre-load JWT verification library (dummy token will fail but loads crypto)
    try {
      JWTUtils.verifyToken('dummy.token.string');
    } catch (e) {
      // Expected to fail, just loads the JWT library
    }
    
    console.log('✅ Database connection pool (read + write paths) warmed up and ready!');
  } catch (error) {
    console.error('⚠️  Database warmup failed:', error);
    // Don't crash the server, just log the warning
  }
};

// Create SuperUser if it doesn't exist
const ensureSuperUser = async () => {
  try {
    const existingSuperUser = await prisma.user.findUnique({
      where: { email: 'superuser@tradrdash.com' }
    });

    if (!existingSuperUser) {
      console.log('🔐 Creating SuperUser admin account...');
      const hashedPassword = await bcrypt.hash('Mypassword123!', 12);
      
      await prisma.user.create({
        data: {
          email: 'superuser@tradrdash.com',
          firstName: 'Super',
          lastName: 'User',
          password: hashedPassword,
          emailVerified: true,
          isAdmin: true,
          timezone: 'UTC',
          isActive: true
        }
      });
      
      console.log('✅ SuperUser created successfully');
      console.log('   Email: superuser@tradrdash.com');
      console.log('   Password: Mypassword123!');
    } else {
      console.log('✅ SuperUser already exists');
    }
  } catch (error) {
    console.error('❌ Error creating SuperUser:', error);
  }
};

// Start server with error handling
const startServer = async () => {
  // Warmup database before starting server
  await warmupDatabase();
  
  // Ensure SuperUser exists
  await ensureSuperUser();
  
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