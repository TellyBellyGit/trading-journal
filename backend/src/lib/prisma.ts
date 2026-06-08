import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

/**
 * Per-request PrismaClient instance.
 * Cloudflare Workers run a single request at a time in each V8 isolate,
 * so a module-level variable is safe. The instance is set at the start of
 * each fetch handler and cleared afterward.
 */
let _instance: PrismaClient | null = null;

/**
 * Sanitize the DATABASE_URL for Neon serverless driver compatibility.
 * - Strips `channel_binding=require` (NOT supported by Neon's WebSocket
 *   driver in Cloudflare Workers — causes "Connection terminated unexpectedly")
 * - Ensures sslmode is set
 */
function sanitizeDatabaseUrl(url: string): string {
  let sanitized = url;

  // Remove channel_binding — the root cause of "Connection terminated unexpectedly"
  sanitized = sanitized.replace(/[&?]channel_binding=[^&]/g, '');

  // Ensure sslmode=require is present
  if (!sanitized.includes('sslmode=')) {
    const separator = sanitized.includes('?') ? '&' : '?';
    sanitized += `${separator}sslmode=require`;
  }

  // Clean up any resulting double-? or trailing &
  sanitized = sanitized.replace(/\?&/, '?').replace(/&$/, '');

  return sanitized;
}

/**
 * Factory that creates a PrismaClient backed by the Neon serverless driver
 * via a secure WebSocket connection. Designed for Cloudflare Workers where
 * traditional TCP sockets and heavy Prisma query engines are unavailable.
 *
 * PrismaNeon (v7.8.0) constructor takes (PoolConfig, options). It creates its
 * own Pool internally in connect(). We pass { connectionString: cleanUrl } as
 * the config — let PrismaNeon manage the Pool lifecycle.
 *
 * Called once per request from the Worker fetch handler:
 *   setPrismaInstance(getPrisma(env.DATABASE_URL));
 */
export const getPrisma = (databaseUrl: string): PrismaClient => {
  // Validate and debug the DATABASE_URL
  if (!databaseUrl || typeof databaseUrl !== 'string') {
    throw new Error(`DATABASE_URL is ${typeof databaseUrl}: ${JSON.stringify(databaseUrl)}`);
  }
  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    throw new Error(`DATABASE_URL must start with postgres:// or postgresql://. Got: ${databaseUrl.substring(0, 15)}...`);
  }

  // Check for literal "DATABASE_URL_HERE" placeholder
  if (databaseUrl.includes('DATABASE_URL_HERE') || databaseUrl.includes('NEON_DIRECT_URL_HERE')) {
    throw new Error('DATABASE_URL still contains placeholder text — replace with real Neon connection string');
  }

  const cleanUrl = sanitizeDatabaseUrl(databaseUrl);

  console.log('🗄️ [prisma] Creating PrismaNeon (v6.0 — let PrismaNeon manage its own Pool)');
  console.log('🗄️ [prisma]   Stripped channel_binding:', databaseUrl.includes('channel_binding'));
  console.log('🗄️ [prisma]   Pooled endpoint:', databaseUrl.includes('-pooler'));

  // PrismaNeon constructor takes PoolConfig — it creates its own Pool in connect()
  const adapter = new PrismaNeon({ connectionString: cleanUrl });
  return new PrismaClient({ adapter });
};

/**
 * Sets the per-request PrismaClient instance.
 * Must be called at the start of each fetch handler.
 */
export function setPrismaInstance(client: PrismaClient): void {
  _instance = client;
}

/**
 * Clears the per-request PrismaClient instance.
 * Called after each request completes (in a finally block).
 */
export function clearPrismaInstance(): void {
  _instance = null;
}

// ---------------------------------------------------------------------------
// Request-scoped Prisma proxy
// ---------------------------------------------------------------------------
const getInstanceOrThrow = (): Record<string | symbol, unknown> => {
  if (!_instance) {
    throw new Error(
      'PrismaClient has not been initialized for this request. ' +
      'Ensure setPrismaInstance() is called at the start of the fetch handler.'
    );
  }
  return _instance as unknown as Record<string | symbol, unknown>;
};

const PRISMA_PROXY_HANDLER: ProxyHandler<object> = {
  get(_target, prop: string | symbol) {
    const inst = getInstanceOrThrow();
    const value = inst[prop];
    if (typeof value === 'function') {
      return (value as Function).bind(inst);
    }
    return value;
  },
  set(_target, prop: string | symbol, value: unknown) {
    const inst = getInstanceOrThrow();
    inst[prop] = value;
    return true;
  },
  has(_target, prop: string | symbol) {
    return _instance ? prop in (_instance as unknown as Record<string | symbol, unknown>) : false;
  },
  ownKeys() {
    return _instance ? Reflect.ownKeys(_instance) : [];
  },
  getOwnPropertyDescriptor(_target, prop: string | symbol) {
    if (!_instance) return undefined;
    return Object.getOwnPropertyDescriptor(_instance, prop);
  },
};

/**
 * The `prisma` export that all existing route files import.
 */
export const prisma: PrismaClient = new Proxy(
  {} as PrismaClient,
  PRISMA_PROXY_HANDLER
) as unknown as PrismaClient;

export default getPrisma;