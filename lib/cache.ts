/**
 * Lightweight cache wrapper: use Redis when REDIS_URL is available, otherwise fallback to in-memory Map.
 * The Redis client is optional to avoid forcing a dependency during development.
 */

type CacheGet = (key: string) => Promise<any>;
type CacheSet = (key: string, value: any, ttlSeconds?: number) => Promise<void>;

let get: CacheGet;
let set: CacheSet;

if (process.env.REDIS_URL) {
  try {
    // Lazy require so projects without redis deps won't break
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL);
    get = async (k: string) => {
      const v = await redis.get(k);
      return v ? JSON.parse(v) : null;
    };
    set = async (k: string, value: any, ttlSeconds = 60) => {
      await redis.set(k, JSON.stringify(value), 'EX', ttlSeconds);
    };
  } catch (e) {
    // Fallback
    const map = new Map<string, { expires: number; v: any }>();
    get = async (k: string) => {
      const entry = map.get(k);
      if (!entry) return null;
      if (entry.expires < Date.now()) { map.delete(k); return null; }
      return entry.v;
    };
    set = async (k: string, value: any, ttlSeconds = 60) => {
      map.set(k, { expires: Date.now() + ttlSeconds * 1000, v: value });
    };
  }
} else {
  const map = new Map<string, { expires: number; v: any }>();
  get = async (k: string) => {
    const entry = map.get(k);
    if (!entry) return null;
    if (entry.expires < Date.now()) { map.delete(k); return null; }
    return entry.v;
  };
  set = async (k: string, value: any, ttlSeconds = 60) => {
    map.set(k, { expires: Date.now() + ttlSeconds * 1000, v: value });
  };
}

export { get, set };
