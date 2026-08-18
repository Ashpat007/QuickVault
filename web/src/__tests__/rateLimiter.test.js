import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../lib/rateLimiter';

describe('Client Rate Limiter & Cooldown Throttling (P1 Smoke Test)', () => {
  beforeEach(() => {
    resetRateLimit('test:action');
  });

  it('allows actions within the threshold', () => {
    const r1 = checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000 });
    const r2 = checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000 });
    const r3 = checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000 });

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);
  });

  it('blocks actions and enforces cooldown once threshold is exceeded', () => {
    // 3 allowed
    checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000, cooldownMs: 5000 });
    checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000, cooldownMs: 5000 });
    checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000, cooldownMs: 5000 });

    // 4th attempt should be blocked
    const r4 = checkRateLimit('test:action', { maxAttempts: 3, windowMs: 10000, cooldownMs: 5000 });
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });

  it('resets cooldown immediately on resetRateLimit call', () => {
    checkRateLimit('test:action', { maxAttempts: 1, windowMs: 10000, cooldownMs: 5000 });
    const blocked = checkRateLimit('test:action', { maxAttempts: 1, windowMs: 10000, cooldownMs: 5000 });
    expect(blocked.allowed).toBe(false);

    resetRateLimit('test:action');
    const allowedAgain = checkRateLimit('test:action', { maxAttempts: 1, windowMs: 10000, cooldownMs: 5000 });
    expect(allowedAgain.allowed).toBe(true);
  });
});
