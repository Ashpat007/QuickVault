import { describe, it, expect } from 'vitest';

/**
 * Helper simulating the App.jsx URL token extraction logic
 */
function parseAuthRedirect(urlOrHash) {
  const isRecovery = urlOrHash.includes('type=recovery');
  const hasAccessToken = urlOrHash.includes('access_token=');
  const hasAuthCode = urlOrHash.includes('code=');

  let accessToken = null;
  let refreshToken = null;

  if (hasAccessToken) {
    const hashParams = new URLSearchParams(urlOrHash.split('#')[1] || urlOrHash);
    accessToken = hashParams.get('access_token');
    refreshToken = hashParams.get('refresh_token');
  }

  return {
    isRecovery,
    hasAuthToken: hasAccessToken || hasAuthCode,
    accessToken,
    refreshToken
  };
}

describe('Auth Redirect & Token Parser (P2 Smoke Test)', () => {
  it('correctly detects password recovery flow from URL hash', () => {
    const result = parseAuthRedirect('#access_token=ey123&refresh_token=rf456&type=recovery');
    expect(result.isRecovery).toBe(true);
    expect(result.hasAuthToken).toBe(true);
    expect(result.accessToken).toBe('ey123');
    expect(result.refreshToken).toBe('rf456');
  });

  it('correctly detects email confirmation from query code parameter', () => {
    const result = parseAuthRedirect('http://127.0.0.1:5173/?code=supabase-auth-code-123');
    expect(result.isRecovery).toBe(false);
    expect(result.hasAuthToken).toBe(true);
  });

  it('correctly returns false for normal URLs without tokens', () => {
    const result = parseAuthRedirect('http://127.0.0.1:5173/');
    expect(result.isRecovery).toBe(false);
    expect(result.hasAuthToken).toBe(false);
    expect(result.accessToken).toBeNull();
  });
});
