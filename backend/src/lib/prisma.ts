import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load .env before PrismaClient initialization
// In dev, override system DATABASE_URL with local .env value
// In production (Railway/etc.), system DATABASE_URL is the correct one
if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // no override in prod
}

// Singleton pattern for PrismaClient to ensure single instance across the application
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      const dbUrl = process.env.DATABASE_URL;
      console.log('🔗 Creating new PrismaClient instance');
      console.log('🔗 DATABASE_URL host:', dbUrl ? new URL(dbUrl).hostname : 'not set');
      PrismaClientSingleton.instance = new PrismaClient({
        log: ['error', 'warn'],
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });
    }
    return PrismaClientSingleton.instance;
  }

  public static async connect(): Promise<void> {
    const prisma = this.getInstance();
    await prisma.$connect();
    console.log('✅ PrismaClient connected to database');
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      console.log('📊 PrismaClient disconnected from database');
    }
  }
}

// Export the singleton instance
export const prisma = PrismaClientSingleton.getInstance();

// Export the class for connection management
export default PrismaClientSingleton;