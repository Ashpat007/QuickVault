import { describe, it, expect } from 'vitest';
import { detectEntryType, detectPasswordRisk } from '../lib/typeDetector';

describe('Smart Type Detector & Pattern Matching', () => {
  it('correctly auto-detects GitHub URLs and handles', () => {
    const res = detectEntryType('https://github.com/torvalds');
    expect(res.entryType).toBe('github');
    expect(res.suggestedLabel).toBe('GitHub (@torvalds)');
  });

  it('correctly auto-detects LinkedIn profile URLs', () => {
    const res = detectEntryType('https://www.linkedin.com/in/satyanadella');
    expect(res.entryType).toBe('linkedin');
    expect(res.suggestedLabel).toBe('LinkedIn (satyanadella)');
  });

  it('correctly auto-detects email addresses', () => {
    const res = detectEntryType('developer@example.com');
    expect(res.entryType).toBe('email');
    expect(res.suggestedLabel).toBe('Email (developer@example.com)');
  });

  it('correctly auto-detects phone numbers', () => {
    const res = detectEntryType('+1 (555) 234-5678');
    expect(res.entryType).toBe('phone');
    expect(res.suggestedLabel).toBe('Phone Number');
  });

  it('correctly extracts and formats generic web domains', () => {
    const res = detectEntryType('https://linear.app');
    expect(res.entryType).toBe('link');
    expect(res.suggestedLabel).toBe('Linear.app Link');
  });
});

describe('Non-Password Policy & Security Risk Heuristics', () => {
  it('flags passwords and secret keywords', () => {
    expect(detectPasswordRisk('mySecretPassword123!')).not.toBeNull();
    expect(detectPasswordRisk('apikey=xyz123456789')).not.toBeNull();
    expect(detectPasswordRisk('Bearer eyJhbGciOi...')).not.toBeNull();
  });

  it('flags high-entropy live secret tokens (sk_live, ghp)', () => {
    expect(detectPasswordRisk('sk_live_51Ny8ZkAB...')).not.toBeNull();
    expect(detectPasswordRisk('ghp_99kAbcDefGhIjKlM...')).not.toBeNull();
  });

  it('allows safe public links and handles without warnings', () => {
    expect(detectPasswordRisk('https://github.com/myorg/myproject')).toBeNull();
    expect(detectPasswordRisk('hello@myportfolio.dev')).toBeNull();
  });
});
