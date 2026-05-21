/**
 * Express Compatibility Layer for Cloudflare Workers
 *
 * This module provides drop-in replacements for `express()`, `express.Router()`,
 * `express.json()`, and other Express APIs that existing route/middleware files
 * expect. Under the hood, it delegates to the workify router.
 *
 * All existing route files (auth.ts, trades.ts, brokers.ts, etc.) keep their
 * original `import express from 'express'; const router = express.Router()`
 * syntax. The only file that changes is `src/index.ts`.
 *
 * IMPORTANT — NO BUSINESS LOGIC OR ROUTE/MIDDLEWARE FILES ARE MODIFIED.
 */

import {
  createWorkify,
  ExpressCompatRequest as ECR,
  ExpressCompatResponse as ECS,
  type ExpressHandler,
  type ExpressErrorHandler,
  type WorkifyEnv,
} from './workify';

// Re-export Request/Response types so route files that do
//   import { Request, Response } from 'express'
// can still work (we map them to our compat types)
export type Request = ECR;
export type Response = ECS;
export type NextFunction = (err?: unknown) => void;

// ---------------------------------------------------------------------------
// Router (mimics express.Router())
// ---------------------------------------------------------------------------

interface RouteMethodEntry {
  method: string;
  path: string;
  handlers: ExpressHandler[];
}

export class CompatRouter {
  public routes: RouteMethodEntry[] = [];
  public middlewares: ExpressHandler[] = [];
  public prefix = '';

  /** Used by middleware to check path prefix */
  private _parentPrefix?: string;

  get(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'GET', path, handlers });
  }
  post(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'POST', path, handlers });
  }
  put(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'PUT', path, handlers });
  }
  patch(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'PATCH', path, handlers });
  }
  delete(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'DELETE', path, handlers });
  }
  options(path: string, ...handlers: ExpressHandler[]) {
    this.routes.push({ method: 'OPTIONS', path, handlers });
  }

  /**
   * Middleware at router level (e.g., router.use(authMiddleware))
   * Handlers are stored and run before route matching.
   */
  use(pathOrHandler: string | ExpressHandler | ExpressErrorHandler, ...handlers: (ExpressHandler | ExpressErrorHandler)[]) {
    if (typeof pathOrHandler === 'string') {
      for (const h of handlers) {
        (h as ExpressHandler & { __prefix?: string }).__prefix = pathOrHandler;
        this.middlewares.push(h as ExpressHandler);
      }
    } else {
      this.middlewares.push(pathOrHandler as ExpressHandler);
      for (const h of handlers) {
        this.middlewares.push(h as ExpressHandler);
      }
    }
  }

  /**
   * Flatten route entries with their prefix for the workify router.
   */
  flatten(prefix: string): RouteMethodEntry[] {
    const entries: RouteMethodEntry[] = [];
    for (const entry of this.routes) {
      const fullPath = prefix + entry.path;
      entries.push({ method: entry.method, path: fullPath, handlers: entry.handlers });
    }
    return entries;
  }
}

// ---------------------------------------------------------------------------
// App (mimics express() application)
// ---------------------------------------------------------------------------

export class CompatApp {
  private workify = createWorkify();
  public wRouter = this.workify.router;
  private _globalMiddlewares: ExpressHandler[] = [];
  private _globalErrorHandlers: ExpressErrorHandler[] = [];
  /** Mounted sub-routers: { prefix, router }[] */
  private _mountedRouters: { prefix: string; router: CompatRouter }[] = [];

  /**
   * Mount a sub-router at a given path prefix.
   * Equivalent to: app.use('/api/auth', authRouter)
   */
  use(pathOrRouter: string | CompatRouter | ExpressHandler | ExpressErrorHandler, ...args: unknown[]) {
    if (typeof pathOrRouter === 'string') {
      // app.use('/api/auth', authRouter)
      const subRouter = args[0] as CompatRouter;
      if (subRouter && subRouter instanceof CompatRouter) {
        this._mountedRouters.push({ prefix: pathOrRouter as string, router: subRouter });
        return;
      }
      // app.use('/api/webhooks', rawHandler) — path-prefixed middleware
      const handler = args[0] as ExpressHandler;
      if (handler) {
        (handler as ExpressHandler & { __prefix?: string }).__prefix = pathOrRouter;
        this._globalMiddlewares.push(handler);
        this.wRouter.use(pathOrRouter, handler);
        return;
      }
    } else if (pathOrRouter instanceof CompatRouter) {
      // Mount root-level router (no prefix)
      this._mountedRouters.push({ prefix: '/', router: pathOrRouter });
      return;
    } else {
      // app.use(corsMiddleware), app.use(express.json()), etc.
      this._globalMiddlewares.push(pathOrRouter as ExpressHandler);
      this.wRouter.use(pathOrRouter as ExpressHandler);
      for (const arg of args) {
        this._globalMiddlewares.push(arg as ExpressHandler);
        this.wRouter.use(arg as ExpressHandler);
      }
      return;
    }
  }

  /**
   * Register an error handler (app.use(errorHandler))
   */
  setErrorHandler(pathOrHandler: ExpressErrorHandler | string, ...handlers: ExpressErrorHandler[]) {
    if (typeof pathOrHandler === 'string') {
      for (const h of handlers) {
        this._globalErrorHandlers.push(h);
      }
    } else {
      this._globalErrorHandlers.push(pathOrHandler);
      for (const h of handlers) {
        this._globalErrorHandlers.push(h);
      }
    }
  }

  /**
   * Build the final fetch handler. Called once after all routes are registered.
   * This is the Cloudflare Workers entry point.
   */
  toFetch(): (req: globalThis.Request, env: WorkifyEnv) => Promise<globalThis.Response> {
    // Flatten all mounted sub-routers into the workify routes
    for (const { prefix, router } of this._mountedRouters) {
      // Register router-level middlewares
      for (const mw of router.middlewares) {
        const mwPrefix = (mw as ExpressHandler & { __prefix?: string }).__prefix;
        const fullMwPrefix = mwPrefix ? prefix + mwPrefix : prefix;
        this.wRouter.use(fullMwPrefix, mw);
      }
      // Register routes
      const flatRoutes = router.flatten(prefix);
      for (const entry of flatRoutes) {
        // Map method to correct router method
        const method = entry.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
        if (method in this.wRouter) {
          (this.wRouter[method] as (pattern: string, ...handlers: ExpressHandler[]) => void)(entry.path, ...entry.handlers);
        }
      }
    }

    return this.workify.toFetch();
  }
}

// ---------------------------------------------------------------------------
// Express-compatible factory functions
// ---------------------------------------------------------------------------

/**
 * Creates an Express-compatible app instance.
 * Usage (in new index.ts):
 *   const app = express();
 *   app.use(corsMiddleware);
 *   app.use('/api/auth', authRouter);
 *   export default { fetch: app.toFetch() };
 */
export function createApp(): CompatApp {
  return new CompatApp();
}

/**
 * Creates an Express-compatible Router.
 * Usage (in route files — unchanged):
 *   import express from '../lib/express-compat';
 *   const router = express.Router();
 */
export function Router(): CompatRouter {
  return new CompatRouter();
}

/**
 * JSON body parsing middleware (no-op in Workers — body is parsed in the bridge).
 * Provided for compatibility with route files that use `app.use(express.json())`.
 */
export function json(_options?: Record<string, unknown>): ExpressHandler {
  return (_req, _res, next) => {
    if (next) next();
  };
}

/**
 * URL-encoded body parsing middleware (no-op in Workers).
 */
export function urlencoded(_options?: Record<string, unknown>): ExpressHandler {
  return (_req, _res, next) => {
    if (next) next();
  };
}

/**
 * Raw body parser (no-op — Stripe webhooks use the raw request in the bridge).
 */
export function raw(_options?: Record<string, unknown>): ExpressHandler {
  return (_req, _res, next) => {
    if (next) next();
  };
}

/**
 * Default export for files that do `import express from 'express'`.
 * Returns an object with `.Router`, `.json`, etc.
 */
const expressCompat = {
  Router,
  json,
  urlencoded,
  raw,
  createApp,
};

export default expressCompat;