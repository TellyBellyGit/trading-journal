import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate email verification token with expiration
 */
export function generateEmailVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken(32);
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours from now
  
  return { token, expires };
}

/**
 * Generate password reset token with expiration
 */
export function generatePasswordResetToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken(32);
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15); // 15 minutes from now
  
  return { token, expires };
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}

/**
 * Generate a random verification code (6 digits)
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}