/**
 * Workers-safe stand-in for `body-parser`.
 *
 * `express` requires body-parser and reads `bodyParser.json` / `.raw` /
 * `.text` / `.urlencoded` at load time. The real body-parser lazily requires
 * raw-body → iconv-lite, and iconv-lite eagerly loads its `./streams` helper
 * whenever `process.versions.node` is truthy (which it is under Cloudflare's
 * `nodejs_compat`), crashing the Workers runtime with:
 *
 *   Uncaught TypeError: require_streams(...) is not a function
 *
 * This project never uses body-parser (see `src/lib/bodyParser.ts` for
 * Workers-safe replacements), so this shim only needs to expose the same
 * factory names as no-op middlewares. It is wired up via the `[alias]` section
 * in `wrangler.toml`, so Node/local development still uses the real package.
 */
import type { Request, Response, NextFunction } from 'express';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

function noopFactory(): Middleware {
  return (_req: Request, _res: Response, next: NextFunction) => next();
}

export const json = noopFactory;
export const raw = noopFactory;
export const text = noopFactory;
export const urlencoded = noopFactory;

export default { json, raw, text, urlencoded };
