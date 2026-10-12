/**
 * Cloudflare Workers entry point.
 *
 * Works because the `nodejs_compat` compatibility flag (with a compatibility
 * date >= 2025-09-01) enables the Node.js HTTP server APIs, so the existing
 * Express app can run unchanged on Workers.
 *
 *   createServer(app)            → a Node http.Server wrapping the Express app
 *   httpServerHandler(server)    → a standard Workers fetch handler
 *
 * Database access uses Prisma's node-postgres driver adapter (`pg`), which on
 * Workers connects over TCP via Cloudflare's built-in `cloudflare:sockets`.
 */
import { createServer } from 'node:http';
import { httpServerHandler } from 'cloudflare:node';
import app from './app';

const server = createServer(app);

export default httpServerHandler(server);
