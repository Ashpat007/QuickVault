/**
 * Client-side Rate Limiter & Cooldown Throttler
 * Protects auth endpoints, password resets, and analytics counters from abuse.
 */

const attemptsMap = new Map();

/**
 * Checks whether an action key is allowed to proceed under rate limit rules.
 * @param {string} actionKey - Unique identifier (e.g. 'auth:signin', 'auth:signup', 'share:view:123')
 * @param {Object} options
 * @param {number} options.maxAttempts - Maximum attempts allowed within the time window (default 5)
 * @param {number} options.windowMs - Time window in milliseconds (default 60000ms = 1 min)
 * @param {number} options.cooldownMs - Penalty cooldown if limit is exceeded (default 30000ms = 30s)
 * @returns {{ allowed: boolean, remainingMs: number, retryAfterSec: number }}
 */
export function checkRateLimit(actionKey, { maxAttempts = 5, windowMs = 60000, cooldownMs = 30000 } = {}) {
  const now = Date.now();
  let record = attemptsMap.get(actionKey);

  if (!record) {
    record = { timestamps: [], blockedUntil: 0 };
    attemptsMap.set(actionKey, record);
  }

  // Check if currently blocked
  if (record.blockedUntil > now) {
    const remainingMs = record.blockedUntil - now;
    return {
      allowed: false,
      remainingMs,
      retryAfterSec: Math.ceil(remainingMs / 1000)
    };
  }

  // Filter timestamps within the rolling window
  record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    record.blockedUntil = now + cooldownMs;
    const remainingMs = cooldownMs;
    return {
      allowed: false,
      remainingMs,
      retryAfterSec: Math.ceil(remainingMs / 1000)
    };
  }

  // Record this attempt
  record.timestamps.push(now);
  return {
    allowed: true,
    remainingMs: 0,
    retryAfterSec: 0
  };
}

/**
 * Resets rate limit for an action key (e.g. on successful login).
 * @param {string} actionKey 
 */
export function resetRateLimit(actionKey) {
  attemptsMap.delete(actionKey);
}
