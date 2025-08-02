import { emailService } from '../services/emailService';
import { logger } from './logger';
import { prisma } from '../lib/prisma';

export interface LoginAttemptResult {
  success: boolean;
  user?: any;
  error?: string;
  isLocked?: boolean;
  lockoutMinutes?: number;
  attemptsRemaining?: number;
}

export class AuthSecurity {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;

  /**
   * Check if user account is currently locked
   */
  static async isAccountLocked(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lockedUntil: true }
    });

    if (!user?.lockedUntil) return false;
    
    // Check if lockout period has expired
    if (new Date() > user.lockedUntil) {
      // Unlock the account
      await this.unlockAccount(userId);
      return false;
    }
    
    return true;
  }

  /**
   * Record a failed login attempt
   */
  static async recordFailedAttempt(userId: number, ipAddress?: string, userAgent?: string, reason?: string): Promise<LoginAttemptResult> {
    try {
      // First, record the login attempt
      await prisma.loginHistory.create({
        data: {
          userId,
          ipAddress,
          userAgent,
          success: false,
          failureReason: reason || 'invalid_credentials'
        }
      });

      // Increment login attempts and check if we need to lock
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: {
            increment: 1
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          loginAttempts: true,
          isActive: true,
          emailVerified: true
        }
      });

      const attemptsRemaining = this.MAX_LOGIN_ATTEMPTS - user.loginAttempts;

      // Check if we need to lock the account
      if (user.loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        await this.lockAccount(userId);
        
        // Send account locked email
        try {
          await emailService.sendAccountLocked(
            user.email,
            user.firstName,
            this.LOCKOUT_DURATION_MINUTES
          );
        } catch (emailError) {
          logger.error('Failed to send account locked email', emailError);
        }

        return {
          success: false,
          error: `Account locked due to ${this.MAX_LOGIN_ATTEMPTS} failed login attempts. Try again in ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
          isLocked: true,
          lockoutMinutes: this.LOCKOUT_DURATION_MINUTES
        };
      }

      return {
        success: false,
        error: `Invalid email or password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining before account lockout.`,
        attemptsRemaining
      };

    } catch (error) {
      logger.error('Error recording failed login attempt', error);
      return {
        success: false,
        error: 'Authentication service temporarily unavailable. Please try again.'
      };
    }
  }

  /**
   * Record a successful login attempt
   */
  static async recordSuccessfulLogin(userId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const dbOperationStartTime = Date.now();
      console.log(`🔐 [AUTH-SECURITY-TIMING] Starting database operations for successful login`);
      
      await Promise.all([
        // Record successful login in history
        (async () => {
          const historyStartTime = Date.now();
          const result = await prisma.loginHistory.create({
            data: {
              userId,
              ipAddress,
              userAgent,
              success: true
            }
          });
          const historyEndTime = Date.now();
          console.log(`🔐 [AUTH-SECURITY-TIMING] LoginHistory.create completed in ${historyEndTime - historyStartTime}ms`);
          return result;
        })(),
        // Reset login attempts and update last login
        (async () => {
          const userUpdateStartTime = Date.now();
          const result = await prisma.user.update({
            where: { id: userId },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date()
            }
          });
          const userUpdateEndTime = Date.now();
          console.log(`🔐 [AUTH-SECURITY-TIMING] User.update completed in ${userUpdateEndTime - userUpdateStartTime}ms`);
          return result;
        })()
      ]);

      const dbOperationEndTime = Date.now();
      console.log(`🔐 [AUTH-SECURITY-TIMING] ✅ All database operations completed in ${dbOperationEndTime - dbOperationStartTime}ms`);

      logger.info(`Successful login for user ${userId}`, undefined);
    } catch (error) {
      logger.error('Error recording successful login', error);
    }
  }

  /**
   * Lock a user account
   */
  static async lockAccount(userId: number): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCKOUT_DURATION_MINUTES);

    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: lockUntil
      }
    });

    logger.warning(`Account ${userId} locked until ${lockUntil.toISOString()}`, undefined);
  }

  /**
   * Unlock a user account
   */
  static async unlockAccount(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    logger.info(`Account ${userId} unlocked`, undefined);
  }

  /**
   * Get user login statistics for admin
   */
  static async getUserLoginStats(userId: number): Promise<{
    totalAttempts: number;
    successfulLogins: number;
    failedAttempts: number;
    lastLogin: Date | null;
    recentFailures: number;
  }> {
    const [user, loginHistory, recentFailures] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { lastLogin: true }
      }),
      prisma.loginHistory.groupBy({
        by: ['success'],
        where: { userId },
        _count: { _all: true }
      }),
      prisma.loginHistory.count({
        where: {
          userId,
          success: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ]);

    const stats = loginHistory.reduce((acc, item) => {
      if (item.success) {
        acc.successfulLogins = item._count._all;
      } else {
        acc.failedAttempts = item._count._all;
      }
      return acc;
    }, { successfulLogins: 0, failedAttempts: 0 });

    return {
      totalAttempts: stats.successfulLogins + stats.failedAttempts,
      successfulLogins: stats.successfulLogins,
      failedAttempts: stats.failedAttempts,
      lastLogin: user?.lastLogin || null,
      recentFailures
    };
  }

  /**
   * Check for suspicious login patterns
   */
  static async detectSuspiciousActivity(userId: number): Promise<{
    isSuspicious: boolean;
    reasons: string[];
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [recentFailures, uniqueIPs] = await Promise.all([
      prisma.loginHistory.count({
        where: {
          userId,
          success: false,
          createdAt: { gte: last24Hours }
        }
      }),
      prisma.loginHistory.findMany({
        where: {
          userId,
          createdAt: { gte: last24Hours }
        },
        select: { ipAddress: true },
        distinct: ['ipAddress']
      })
    ]);

    const reasons: string[] = [];
    let isSuspicious = false;

    // Too many failed attempts in 24 hours
    if (recentFailures > 10) {
      reasons.push(`${recentFailures} failed login attempts in 24 hours`);
      isSuspicious = true;
    }

    // Login attempts from many different IPs
    if (uniqueIPs.length > 5) {
      reasons.push(`Login attempts from ${uniqueIPs.length} different IP addresses`);
      isSuspicious = true;
    }

    return { isSuspicious, reasons };
  }
}

export default AuthSecurity;