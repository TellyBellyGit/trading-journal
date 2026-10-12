/**
 * Minimal type declarations for Cloudflare's built-in `cloudflare:node` module.
 *
 * Workers can run a Node.js HTTP server (e.g. an Express app) by creating a
 * `node:http` server and handing it to `httpServerHandler`, which returns a
 * standard Workers fetch handler. See:
 * https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/
 *
 * These declarations only matter for `tsc` type-checking; Wrangler/esbuild
 * resolve the module at bundle time regardless.
 */
declare module 'cloudflare:node' {
  export function httpServerHandler(server: unknown): {
    fetch(request: Request, env: unknown, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<Response>;
  };
  export function handleAsNodeRequest(...args: unknown[]): unknown;
}
