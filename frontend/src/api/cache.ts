// Lightweight response cache + in-flight request de-duplication for the
// browser API layer.
//
// The app has no data-fetching library (no react-query/SWR), so several views
// were independently re-fetching the same trade data on every mount. This
// module keeps short-lived copies of read responses in memory so that view
// switches do not hammer the Worker.
//
// Notes:
// - Entries are scoped by the current auth token, so a logout/login (or a
//   session swap) can never surface another user's cached data.
// - The cache lives in module memory only: it disappears on reload.

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const entries = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

const MAX_ENTRIES = 100;
export const DEFAULT_TTL_MS = 30_000;

const scope = (): string => {
  try {
    const token = sessionStorage.getItem('auth_token');
    return token ? token.slice(-16) : 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const scopedKey = (key: string): string => `${scope()}::${key}`;

const bareKey = (key: string): string => {
  const index = key.indexOf('::');
  return index === -1 ? key : key.slice(index + 2);
};

const evictOldest = (): void => {
  while (entries.size > MAX_ENTRIES) {
    const oldest = entries.keys().next();
    if (oldest.done) {
      return;
    }
    entries.delete(oldest.value);
  }
};

/**
 * Removes cached entries whose key starts with `keyPrefix` (default: all).
 */
export const clearApiCache = (keyPrefix: string = ''): void => {
  for (const key of [...entries.keys()]) {
    if (!keyPrefix || bareKey(key).startsWith(keyPrefix)) {
      entries.delete(key);
    }
  }
};

/**
 * Returns a cached response when one is still fresh, otherwise runs `fetcher`
 * and caches the result. Concurrent calls for the same key share one request.
 */
export const cachedApi = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> => {
  const cacheKey = scopedKey(key);
  const hit = entries.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.data as T;
  }

  const pending = inFlight.get(cacheKey);
  if (pending) {
    return pending as Promise<T>;
  }

  const request = fetcher()
    .then((data) => {
      entries.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
      evictOldest();
      inFlight.delete(cacheKey);
      return data;
    })
    .catch((error) => {
      inFlight.delete(cacheKey);
      throw error;
    });

  inFlight.set(cacheKey, request);
  return request;
};
