import type { Request, Response, NextFunction } from 'express';
import { createScope, disposeScope, runInScope } from '../lib/prisma';

/**
 * Gives every incoming request its own Prisma client (and therefore its own
 * database connection pool), and closes that pool when the response is done.
 *
 * Required on Cloudflare Workers: a TCP socket may not be created in global
 * scope nor shared between requests, so a long-lived pooled client (the old
 * behaviour) deadlocks the runtime — the request is cancelled by the edge with
 * a response that has no CORS headers, which the browser reports as
 * "blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present".
 *
 * The client itself is created lazily (on the first `prisma.*` access inside
 * the request), so requests that never touch the database — /api/health, CORS
 * preflights — pay nothing.
 *
 * Must be registered before any route/middleware that touches the database.
 */
export function prismaScope(_req: Request, res: Response, next: NextFunction): void {
  const scope = createScope();
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    disposeScope(scope);
  };

  // `finish` = response fully written, `close` = client went away / aborted.
  res.on('finish', dispose);
  res.on('close', dispose);

  runInScope(scope, () => next());
}

export default prismaScope;
