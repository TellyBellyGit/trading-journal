import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Express-compatibility shim for Cloudflare Workers.
 *
 * Cloudflare Workers expose the web-standard `Request` / `Response` pair.
 * Existing Express route handlers expect Node.js `(req, res, next)` —
 * objects that descend from `http.IncomingMessage` and `http.ServerResponse`.
 *
 * This module converts between the two worlds so that every route file
 * (auth.ts, trades.ts, brokers.ts, etc.) and every middleware file
 * (auth.ts middleware, rateLimiting.ts) remains completely unchanged.
 *
 * ------------------------------------------------------------------
 * IMPORTANT — NO BUSINESS LOGIC OR SCHEMA CHANGES ARE MADE.
 * This file is purely an infrastructure adapter.
 * ------------------------------------------------------------------
 */

export interface WorkifyEnv {
  DATABASE_URL: string;
  [key: string]: string | undefined;
}

export type ExpressHandler = (req: ExpressCompatRequest, res: ExpressCompatResponse, next?: (err?: unknown) => void) => void | Promise<void>;

export type ExpressErrorHandler = (err: unknown, req: ExpressCompatRequest, res: ExpressCompatResponse, next: (err?: unknown) => void) => void;

// ---------------------------------------------------------------------------
// Express-compatible Request
// ---------------------------------------------------------------------------
export class ExpressCompatRequest {
  public body: Record<string, unknown> = {};
  public params: Record<string, string> = {};
  public query: Record<string, string | undefined> = {};
  public headers: Record<string, string | string[] | undefined> = {};
  public method = 'GET';
  public url = '/';
  public path = '/';
  public ip = '127.0.0.1';
  public originalUrl = '/';
  public connection = { remoteAddress: '127.0.0.1' };
  public user?: { userId: number; email: string; isAdmin?: boolean };
  public cookies: Record<string, string> = {};

  /** The native Worker Request (preserved for middleware that might need it) */
  public raw: Request;

  // Minimal EventEmitter polyfill for multer compat (req.on('data', ...) / req.on('end', ...))
  private _listeners: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(listener);
    // For 'end' event, emit immediately since body is already parsed in workify handler
    if (event === 'end') {
      listener();
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this._listeners[event];
    if (!listeners) return false;
    for (const fn of listeners) {
      fn(...args);
    }
    return true;
  }

  constructor(request: Request, routeParams?: Record<string, string>) {
    this.raw = request;
    this.method = request.method;
    this.url = new URL(request.url).pathname + new URL(request.url).search;
    this.path = new URL(request.url).pathname;
    this.originalUrl = this.url;

    // Headers → lowercase map (Express convention)
    const h: Record<string, string> = {};
    request.headers.forEach((v, k) => { h[k.toLowerCase()] = v; });
    this.headers = h;

    // IP
    this.ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    this.connection.remoteAddress = this.ip;

    // Query string
    const searchParams = new URL(request.url).searchParams;
    const q: Record<string, string | undefined> = {};
    searchParams.forEach((v, k) => { q[k] = v; });
    this.query = q;

    // Route params
    if (routeParams) {
      this.params = routeParams;
    }

    // Cookies
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      this.cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
          const [k, ...v] = c.trim().split('=');
          return [k, v.join('=')];
        })
      );
    }
  }

  get(name: string): string | undefined {
    return (this.headers[name.toLowerCase()] as string) || undefined;
  }
}

// ---------------------------------------------------------------------------
// Express-compatible Response
// ---------------------------------------------------------------------------
export class ExpressCompatResponse {
  private _status = 200;
  private _body: unknown = null;
  private _headers = new Headers();
  private _headersSent = false;
  private _finished = false;
  public statusCode = 200;

  status(code: number): this {
    this._status = code;
    this.statusCode = code;
    return this;
  }

  json(data: unknown): this {
    this._body = data;
    this._headers.set('content-type', 'application/json; charset=utf-8');
    this._finished = true;
    this._headersSent = true;
    return this;
  }

  send(body: unknown): this {
    if (typeof body === 'object') {
      this._body = body;
      this._headers.set('content-type', 'application/json; charset=utf-8');
    } else {
      this._body = body;
    }
    this._finished = true;
    this._headersSent = true;
    return this;
  }

  setHeader(name: string, value: string | number | string[]): this {
    this._headers.set(name, String(value));
    return this;
  }

  set(headers: Record<string, string | number>): this {
    for (const [k, v] of Object.entries(headers)) {
      this._headers.set(k, String(v));
    }
    return this;
  }

  getHeader(name: string): string | null {
    return this._headers.get(name);
  }

  removeHeader(name: string): void {
    this._headers.delete(name);
  }

  get headersSent(): boolean {
    return this._headersSent;
  }

  get finished(): boolean {
    return this._finished;
  }

  end(data?: unknown): void {
    if (data !== undefined) {
      this._body = data;
    }
    this._finished = true;
    this._headersSent = true;
  }

  /**
   * Build the final web-standard Response object.
   * Called once after the Express handler chain completes.
   */
  toResponse(): Response {
    const body = this._body;
    if (body === null || body === undefined) {
      return new Response(null, { status: this._status, headers: this._headers });
    }

    if (typeof body === 'object') {
      try {
        const json = JSON.stringify(body);
        return new Response(json, { status: this._status, headers: this._headers });
      } catch {
        return new Response(String(body), { status: 500, headers: this._headers });
      }
    }

    return new Response(String(body), { status: this._status, headers: this._headers });
  }
}

// ---------------------------------------------------------------------------
// Next function type
// ---------------------------------------------------------------------------
export type NextFunction = (err?: unknown) => void;

// ---------------------------------------------------------------------------
// Route matching helper — maps Express ":param" paths to regex
// ---------------------------------------------------------------------------
function pathToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = [];
  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

// ---------------------------------------------------------------------------
// Workify — the main bridge
// ---------------------------------------------------------------------------

interface RouteEntry {
  method: string;
  pattern: string;
  regex: RegExp;
  paramNames: string[];
  handlers: ExpressHandler[];
}

/**
 * Creates a Cloudflare Workers `fetch` handler from a collection of
 * Express-style route registrations.
 *
 * Example:
 *   const { router, toFetch } = createWorkify();
 *   router.get('/api/health', (req, res) => res.json({ ok: true }));
 *   router.post('/api/auth/login', ...authHandlers);
 *   export default { fetch: toFetch };
 */
export function createWorkify() {
  const routes: RouteEntry[] = [];
  const middlewares: ExpressHandler[] = [];
  const errorHandlers: ExpressErrorHandler[] = [];

  // ---- HTTP method helpers ----
  function addRoute(method: string, pattern: string, ...handlers: ExpressHandler[]) {
    const { regex, paramNames } = pathToRegex(pattern);
    routes.push({ method, pattern, regex, paramNames, handlers });
  }

  const router = {
    get(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('GET', pattern, ...handlers);
    },
    post(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('POST', pattern, ...handlers);
    },
    put(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('PUT', pattern, ...handlers);
    },
    patch(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('PATCH', pattern, ...handlers);
    },
    delete(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('DELETE', pattern, ...handlers);
    },
    options(pattern: string, ...handlers: ExpressHandler[]) {
      addRoute('OPTIONS', pattern, ...handlers);
    },
    use(pathOrHandler: string | ExpressHandler | ExpressErrorHandler, ...handlers: (ExpressHandler | ExpressErrorHandler)[]) {
      // If first arg is a string, it's a path prefix; implement minimal path-prefix matching
      if (typeof pathOrHandler === 'string') {
        const prefix = pathOrHandler;
        // Register as a catch-all for that prefix (middleware pattern)
        for (const handler of handlers) {
          middlewares.push(handler as ExpressHandler);
          // Store prefix info via closure
          (handler as ExpressHandler & { __prefix?: string }).__prefix = prefix;
        }
      } else {
        middlewares.push(pathOrHandler as ExpressHandler);
        for (const h of handlers) {
          middlewares.push(h as ExpressHandler);
        }
      }
    },
  };

  /**
   * Converts known Express route handlers into a Workers fetch handler.
   * Does NOT modify existing middleware files.
   */
  function toFetch(): (request: Request, env: WorkifyEnv) => Promise<Response> {
    return async function fetchHandler(request: Request, env: WorkifyEnv): Promise<Response> {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method.toUpperCase();

      try {
        // ---- Parse body (only for methods that carry a payload) ----
        const expressReq = new ExpressCompatRequest(request);
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          try {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              expressReq.body = await request.json() as Record<string, unknown>;
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              const text = await request.text();
              expressReq.body = Object.fromEntries(new URLSearchParams(text).entries()) as unknown as Record<string, unknown>;
            } else if (contentType.includes('text/plain')) {
              expressReq.body = { text: await request.text() };
            }
          } catch {
            // Body parse failed; leave body as empty object
          }
        }

        // ---- Apply global middlewares (path-prefix aware) ----
        const expressRes = new ExpressCompatResponse();
        let middlewareIdx = 0;

        const runMiddleware = (): Promise<void> => {
          return new Promise((resolve, reject) => {
            function next(err?: unknown) {
              if (err) {
                // Pass to first error handler
                for (const eh of errorHandlers) {
                  try {
                    eh(err, expressReq, expressRes, () => {});
                  } catch (e) {
                    // continue
                  }
                }
                reject(err);
                return;
              }

              while (middlewareIdx < middlewares.length) {
                const mw = middlewares[middlewareIdx++];
                const prefix = (mw as ExpressHandler & { __prefix?: string }).__prefix;
                if (prefix && !pathname.startsWith(prefix)) {
                  continue; // Skip middleware that doesn't match path prefix
                }
                try {
                  const result = mw(expressReq, expressRes, next);
                  if (result instanceof Promise) {
                    return; // Async middleware — wait for next() or resolve
                  }
                  // Sync middleware — if it didn't call next(), continue
                  continue;
                } catch (e) {
                  reject(e);
                  return;
                }
              }
              resolve();
            }
            next();
          });
        };

        await runMiddleware().catch(() => {});

        // If middleware already sent a response, return it
        if (expressRes.finished) {
          return expressRes.toResponse();
        }

        // ---- CORS preflight ----
        if (method === 'OPTIONS') {
          const corsRes = new ExpressCompatResponse();
          corsRes.status(204);
          corsRes.setHeader('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
          corsRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
          corsRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
          corsRes.setHeader('Access-Control-Allow-Credentials', 'true');
          corsRes.end();
          return corsRes.toResponse();
        }

        // ---- Match route ----
        for (const route of routes) {
          if (route.method !== method) continue;
          const match = pathname.match(route.regex);
          if (!match) continue;

          // Extract route params
          const params: Record<string, string> = {};
          route.paramNames.forEach((name, idx) => {
            params[name] = match[idx + 1];
          });
          expressReq.params = params;

          // Run route handlers sequentially — each handler is either sync or async.
          // We iterate through them, awaiting async ones and calling next() for sync ones.
          for (let i = 0; i < route.handlers.length; i++) {
            const handler = route.handlers[i];
            try {
              const result = handler(expressReq, expressRes, (err) => {
                if (err) throw err;
              });
              // If handler is async, await its completion
              if (result && typeof(result as any).then === 'function') {
                await result;
              }
              // If handler already sent a response, stop the chain
              if (expressRes.finished) break;
            } catch (err) {
              console.error('Route handler error:', err);
              if (!expressRes.finished) {
                expressRes.status(500).json({
                  error: 'Internal Server Error',
                  message: err instanceof Error ? err.message : 'Unknown error',
                });
              }
              break;
            }
          }

          if (expressRes.finished) {
            return expressRes.toResponse();
          }

          // If handler didn't explicitly send, send whatever body is set
          return expressRes.toResponse();
        }

        // ---- 404 ----
        return new Response(JSON.stringify({ error: 'Not Found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });

      } catch (err) {
        console.error('Worker fetch error:', err);
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: err instanceof Error ? err.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
    };
  }

  return { router, toFetch };
}

export default createWorkify;