import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Password hashing utilities
export class PasswordUtils {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

// JWT utilities
export class JWTUtils {
  private static getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }
    return secret;
  }

  static generateToken(payload: { userId: number; email: string }): string {
    // Add expiration to payload to avoid TypeScript issues with options
    const tokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
    };
    return jwt.sign(tokenPayload, this.getSecret());
  }

  static verifyToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.getSecret()) as any;
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static generateRefreshToken(payload: { userId: number; email: string }): string {
    // Add expiration to payload (7 days)
    const tokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days from now
    };
    return jwt.sign(tokenPayload, this.getSecret());
  }
}

// Password validation
export class PasswordValidator {
  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Email validation
export class EmailValidator {
  static validate(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}