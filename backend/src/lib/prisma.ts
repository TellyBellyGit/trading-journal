import { PrismaClient } from '@prisma/client';

// Singleton pattern for PrismaClient to ensure single instance across the application
class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      console.log('🔗 Creating new PrismaClient instance');
      PrismaClientSingleton.instance = new PrismaClient({
        log: ['error', 'warn'],
        // Optimize connection pool settings
        datasources: {
          db: {
            url: process.env.DATABASE_URL
          }
        }
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