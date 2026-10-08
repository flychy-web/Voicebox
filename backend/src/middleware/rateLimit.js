/**
 * Small in-memory fixed-window rate limiter: a per-key limit plus a global
 * ceiling across all keys. State lives in this process only, which suits the
 * single-replica deployment in railway.json.
 */
export function createRateLimiter({ windowMs, max, globalMax, now = () => Date.now() }) {
  const buckets = new Map();
  let globalBucket = { count: 0, resetAt: 0 };

  function sweep(time) {
    if (buckets.size < 10000) return;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= time) buckets.delete(key);
    }
  }

  function check(key) {
    const time = now();
    sweep(time);

    if (globalBucket.resetAt <= time) {
      globalBucket = { count: 0, resetAt: time + windowMs };
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= time) {
      bucket = { count: 0, resetAt: time + windowMs };
      buckets.set(key, bucket);
    }

    if (bucket.count >= max) {
      return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - time) / 1000) };
    }
    if (globalMax && globalBucket.count >= globalMax) {
      return { allowed: false, retryAfterSeconds: Math.ceil((globalBucket.resetAt - time) / 1000) };
    }

    bucket.count += 1;
    globalBucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  function middleware(req, res, next) {
    const result = check(req.ip || 'unknown');
    if (!result.allowed) {
      res.set('Retry-After', String(Math.max(1, result.retryAfterSeconds)));
      return res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
    }
    next();
  }

  return { check, middleware };
}
