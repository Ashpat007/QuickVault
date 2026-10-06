import { describe, it, expect } from 'vitest';

/**
 * Origin validation logic from extension/content.js
 */
function isOriginTrusted(origin) {
  const trustedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
  return trustedOrigins.includes(origin) || origin.startsWith('chrome-extension://');
}

describe('Extension Origin Validation & Message Bridge (Security Test)', () => {
  it('accepts trusted local application origins', () => {
    expect(isOriginTrusted('http://localhost:5173')).toBe(true);
    expect(isOriginTrusted('http://127.0.0.1:5173')).toBe(true);
  });

  it('accepts valid chrome-extension scheme origins', () => {
    expect(isOriginTrusted('chrome-extension://abcdefghijklmno123456')).toBe(true);
  });

  it('rejects untrusted third-party origins and arbitrary webpage origins', () => {
    expect(isOriginTrusted('https://evil-attacker.com')).toBe(false);
    expect(isOriginTrusted('https://malicious-site.com')).toBe(false);
    expect(isOriginTrusted('http://localhost:3000')).toBe(false);
    expect(isOriginTrusted('https://supabase.co')).toBe(false);
    expect(isOriginTrusted('javascript:alert(1)')).toBe(false);
  });
});
