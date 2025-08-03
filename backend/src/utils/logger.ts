// backend/src/utils/logger.ts
import { Request } from 'express';

// Extend Express Request type to include user (if not already extended)
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        isAdmin?: boolean;
      };
    }
  }
}

interface LogContext {
  userId?: number;
  email?: string;
  ip?: string;
  method?: string;
  url?: string;
}

class Logger {
  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatUserInfo(req?: Request): string {
    if (!req?.user) return '[No User]';
    return `[User ${req.user.userId}: ${req.user.email}]`;
  }

  private formatRequest(req?: Request): string {
    if (!req) return '';
    return `${req.method} ${req.originalUrl}`;
  }

  // Log with user context from request
  info(message: string, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const requestInfo = this.formatRequest(req);
    const logLevel = this.isProduction() ? 'INFO' : 'ℹ️ ';
    console.log(`${logLevel} ${timestamp} ${userInfo} ${message} ${requestInfo}`);
  }

  success(message: string, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const requestInfo = this.formatRequest(req);
    console.log(`✅ ${timestamp} ${userInfo} ${message} ${requestInfo}`);
  }

  warning(message: string, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const requestInfo = this.formatRequest(req);
    console.log(`⚠️  ${timestamp} ${userInfo} ${message} ${requestInfo}`);
  }

  error(message: string, error?: any, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const requestInfo = this.formatRequest(req);
    console.error(`❌ ${timestamp} ${userInfo} ${message} ${requestInfo}`);
    if (error) {
      console.error(`   Error details:`, error);
    }
  }

  // Log authentication events
  auth(message: string, userId?: number, email?: string, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = userId ? `[User ${userId}: ${email}]` : '[Anonymous]';
    const requestInfo = this.formatRequest(req);
    console.log(`🔐 ${timestamp} ${userInfo} ${message} ${requestInfo}`);
  }

  // Log import/export operations
  import(message: string, count?: number, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const countInfo = count ? `(${count} records)` : '';
    console.log(`📤 ${timestamp} ${userInfo} ${message} ${countInfo}`);
  }

  // Log data operations
  data(operation: string, table: string, count?: number, req?: Request): void {
    const timestamp = this.formatTimestamp();
    const userInfo = this.formatUserInfo(req);
    const countInfo = count ? `(${count} records)` : '';
    console.log(`💾 ${timestamp} ${userInfo} ${operation} ${table} ${countInfo}`);
  }
}

export const logger = new Logger();