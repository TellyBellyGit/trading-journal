import type { Request, Response, NextFunction } from 'express';

/**
 * Workers-safe request body parsers.
 *
 * Express's built-in `express.json()` / `express.raw()` delegate to body-parser
 * → raw-body → iconv-lite. iconv-lite eagerly loads its `./streams` helper when
 * `process.versions.node` is truthy (which it is under Cloudflare's
 * `nodejs_compat`), and that helper is not compatible with the Workers runtime:
 *
 *   Uncaught TypeError: require_streams(...) is not a function
 *
 * To avoid pulling in body-parser/raw-body/iconv-lite at all, these small
 * middleware read the request stream directly (Cloudflare's IncomingMessage is a
 * standard Readable) and populate `req.body` exactly like their Express
 * counterparts.
 */

function isJsonContentType(contentType: string | undefined): boolean {
  const type = (contentType || '').split(';')[0].trim().toLowerCase();
  return type === 'application/json' || type.endsWith('+json');
}

/** Read the full request body into a Buffer. */
function readStream(req: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    req.on('data', (chunk: any) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => finish(() => resolve(Buffer.concat(chunks))));
    req.on('aborted', () => finish(() => reject(new Error('Request aborted'))));
    req.on('error', (err: any) => finish(() => reject(err)));
  });
}

export interface JsonBodyOptions {
  /** Maximum accepted body size in bytes (default 10 MB). */
  limit?: number;
  /** Return true to skip parsing for a given request. */
  skip?: (req: Request) => boolean;
}

/**
 * Replacement for `express.json()`. Populates `req.body` (parsed JSON) and
 * `req.rawBody` (the raw string).
 */
export function jsonBody(options: JsonBodyOptions = {}) {
  const limit = options.limit ?? 10 * 1024 * 1024;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const method = (req.method || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
    if (options.skip && options.skip(req)) return next();
    if (!isJsonContentType(req.headers['content-type'] as string | undefined)) return next();

    try {
      const buf = await readStream(req);
      if (buf.length > limit) {
        res.status(413).json({ error: 'Payload too large' });
        return;
      }

      const raw = buf.toString('utf8');
      (req as any).rawBody = raw;
      req.body = raw ? JSON.parse(raw) : {};
      next();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
      }
      next(err);
    }
  };
}

/**
 * Replacement for `express.raw()`. Populates `req.body` with the raw Buffer and
 * `req.rawBody` with the raw string (used for Stripe webhook verification).
 */
export function rawBody(type: string | string[] = 'application/json') {
  const types = (Array.isArray(type) ? type : [type]).map((t) => t.toLowerCase());

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ct = ((req.headers['content-type'] as string) || '').split(';')[0].trim().toLowerCase();
    if (!types.includes(ct)) return next();

    try {
      const buf = await readStream(req);
      (req as any).rawBody = buf.toString('utf8');
      req.body = buf;
      next();
    } catch (err) {
      next(err);
    }
  };
}
