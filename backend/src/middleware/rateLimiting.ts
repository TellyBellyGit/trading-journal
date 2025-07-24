import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting for login attempts (per IP)
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    retryAfter: 15 * 60, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
  // Remove custom keyGenerator to use default (which handles IPv6 properly)
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
      retryAfter: Math.ceil(15 * 60), // 15 minutes in seconds
      type: 'rate_limit'
    });
  }
});

// Rate limiting for password reset requests (per IP)
export const passwordResetRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // Limit each IP to 1 password reset request per windowMs
  message: {
    error: 'Password reset requests are limited to 1 per 5 minutes. Please try again later.',
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Password reset requests are limited to 1 per 5 minutes. Please try again later.',
      retryAfter: Math.ceil(5 * 60),
      type: 'rate_limit'
    });
  }
});

// Rate limiting for email verification requests (per IP)
export const emailVerificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 email verification requests per hour
  message: {
    error: 'Email verification requests are limited to 3 per hour. Please try again later.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Email verification requests are limited to 3 per hour. Please try again later.',
      retryAfter: Math.ceil(60 * 60),
      type: 'rate_limit'
    });
  }
});

// General API rate limiting (per IP)
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP address. Please try again in 15 minutes.',
      retryAfter: Math.ceil(15 * 60),
      type: 'rate_limit'
    });
  }
});