import { describe, it, expect } from 'vitest';
import { generateSlug } from '../lib/supabaseClient';

describe('Slug Enumerability & Cryptographic Entropy (P1 Smoke Test)', () => {
  it('generates a slug starting with the given prefix', () => {
    const slug = generateSlug('share');
    expect(slug.startsWith('share-')).toBe(true);
  });

  it('generates a 21-character random nanoid string (total length 27)', () => {
    const slug = generateSlug('share');
    const parts = slug.split('share-');
    expect(parts[1]).toHaveLength(21);
    // Base62 character validation
    expect(/^[0-9a-zA-Z]{21}$/.test(parts[1])).toBe(true);
  });

  it('produces zero collisions across 1,000 generated slugs', () => {
    const slugs = new Set();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      const slug = generateSlug('share');
      slugs.add(slug);
    }
    expect(slugs.size).toBe(count);
  });
});
