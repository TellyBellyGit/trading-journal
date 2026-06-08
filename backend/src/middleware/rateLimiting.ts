/**
 * Rate Limiting Middleware — Cloudflare Workers Compatible
 *
 * Replaces express-rate-limit which calls setInterval() at module load
 * time, disallowed in Workers' global scope. These pass-through stubs
 * preserve the same middleware API so route files are unchanged.
 *
 * For production rate limiting, use Cloudflare Workers' built-in Rate
 * Limiting rules in the dashboard or WAF.
 */

import type { Request, Response } from 'express';

function noopRateLimit() {
  return (_req: Request, _res: Response, next: () => void) => {
    next();
  };
}

export const loginRateLimit = noopRateLimit();
export const passwordResetRateLimit = noopRateLimit();
export const emailVerificationRateLimit = noopRateLimit();
export const generalRateLimit = noopRateLimit();