/**
 * Smart type detection and security checks for QuickVault items.
 */

// Regex specifications as per QuickVault spec
const GITHUB_REGEX = /github\.com\/[\w-]+/i;
const LINKEDIN_REGEX = /linkedin\.com\/in\/[\w-]+/i;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
const PHONE_REGEX = /^[\+\d][\d\s\-\(\)]{6,}$/;

/**
 * Detects if the value appears to be a password, secret, or sensitive credential.
 * QuickVault is explicitly NOT a password manager.
 * @param {string} value 
 * @returns {string|null} Warning message or null
 */
export function detectPasswordRisk(value) {
  if (!value) return null;
  const lower = value.toLowerCase().trim();

  const passwordKeywords = [
    'password', 'passwd', 'secret', 'private_key', 'apikey', 'api_key', 
    'bearer ', 'access_token', 'token=', 'auth_token', 'credentials'
  ];

  for (const kw of passwordKeywords) {
    if (lower.includes(kw)) {
      return '⛔ QuickVault is NOT a password manager! Never store account passwords, secrets, or API keys here.';
    }
  }

  // Heuristic for high-entropy secrets (e.g. sk_live_..., ghp_..., eyJ...)
  if (/^(sk_live|ghp_|glpat-|eyJh|Bearer\s)[A-Za-z0-9_\-]{6,}/.test(value.trim())) {
    return '⛔ High security risk: This value looks like a secret API key or token! Do NOT store sensitive keys here.';
  }

  return null;
}

/**
 * Detect entry type and suggest a suitable label & icon based on input value.
 * @param {string} value 
 * @returns {{ entryType: string, suggestedLabel: string }}
 */
export function detectEntryType(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return { entryType: 'text', suggestedLabel: '' };
  }

  // If secret/password risk, do NOT suggest auto labels
  if (detectPasswordRisk(trimmed)) {
    return { entryType: 'text', suggestedLabel: '' };
  }

  // 1. GitHub
  if (GITHUB_REGEX.test(trimmed)) {
    const match = trimmed.match(/github\.com\/([\w-]+)/i);
    const handle = match ? match[1] : '';
    return {
      entryType: 'github',
      suggestedLabel: handle ? `GitHub (@${handle})` : 'GitHub Profile',
    };
  }

  // 2. LinkedIn
  if (LINKEDIN_REGEX.test(trimmed)) {
    const match = trimmed.match(/linkedin\.com\/in\/([\w-]+)/i);
    const handle = match ? match[1] : '';
    return {
      entryType: 'linkedin',
      suggestedLabel: handle ? `LinkedIn (${handle})` : 'LinkedIn Profile',
    };
  }

  // 3. Email
  if (EMAIL_REGEX.test(trimmed) || (trimmed.includes('@') && !trimmed.includes(' ') && trimmed.includes('.'))) {
    return {
      entryType: 'email',
      suggestedLabel: `Email (${trimmed})`,
    };
  }

  // 4. Phone
  const digitCount = (trimmed.match(/\d/g) || []).length;
  if (PHONE_REGEX.test(trimmed) && digitCount >= 7) {
    return {
      entryType: 'phone',
      suggestedLabel: 'Phone Number',
    };
  }

  // 5. Link fallback (starts with http / https or www.)
  if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://') || trimmed.toLowerCase().startsWith('www.')) {
    try {
      const urlObj = new URL(trimmed.startsWith('www.') ? `https://${trimmed}` : trimmed);
      const host = urlObj.hostname.replace(/^www\./, '');
      const capitalizedHost = host.charAt(0).toUpperCase() + host.slice(1);
      return {
        entryType: 'link',
        suggestedLabel: `${capitalizedHost} Link`,
      };
    } catch {
      return {
        entryType: 'link',
        suggestedLabel: 'Web Link',
      };
    }
  }

  // 6. Generic Text fallback
  return {
    entryType: 'text',
    suggestedLabel: trimmed.length > 25 ? `${trimmed.substring(0, 22)}...` : trimmed,
  };
}
