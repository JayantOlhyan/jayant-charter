interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  options: { maxRequests?: number; windowMs?: number } = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 8;
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = buckets.get(key) ?? { timestamps: [] };
  existing.timestamps = existing.timestamps.filter((t) => t > cutoff);

  if (existing.timestamps.length >= maxRequests) {
    const oldest = existing.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    buckets.set(key, existing);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.timestamps.push(now);
  buckets.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - existing.timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimiterForTests() {
  buckets.clear();
}
