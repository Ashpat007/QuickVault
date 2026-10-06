/**
 * QuickVault Smart Form Autofill Engine
 * Client-side semantic intent matching engine for pairing form questions/fields
 * with stored QuickVault entries.
 */

// Word boundary helper to prevent loose substring false-positives (e.g. "digit" matching "git")
function matchesKeyword(text, keyword) {
  const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
  return pattern.test(text);
}

// Semantic field dictionary for mapping form questions to vault entry types & labels
const FIELD_INTENTS = [
  {
    category: 'github',
    typeMatch: ['github'],
    keywords: ['github', 'git', 'repo', 'repository', 'code link', 'github profile', 'github url'],
  },
  {
    category: 'linkedin',
    typeMatch: ['linkedin'],
    keywords: ['linkedin', 'linkedin profile', 'linkedin url', 'professional network'],
  },
  {
    category: 'email',
    typeMatch: ['email'],
    keywords: ['email', 'e-mail', 'mail address', 'contact email', 'work email', 'personal email'],
  },
  {
    category: 'phone',
    typeMatch: ['phone'],
    keywords: ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'phone number'],
  },
  {
    category: 'link',
    typeMatch: ['link'],
    keywords: ['portfolio', 'website', 'personal site', 'homepage', 'url', 'blog', 'project link'],
  },
  {
    category: 'name',
    typeMatch: ['text'],
    keywords: ['full name', 'candidate name', 'applicant name', 'first name', 'last name'],
  },
  {
    category: 'bio',
    typeMatch: ['text'],
    keywords: ['bio', 'about me', 'description', 'summary', 'introduction', 'headline', 'note'],
  },
  {
    category: 'address',
    typeMatch: ['text'],
    keywords: ['address', 'city', 'location', 'country', 'zip code', 'postal code', 'residence'],
  },
];

/**
 * Extracts question fields from raw text input (e.g. pasted form questions or prompt lines)
 * @param {string} rawText 
 * @returns {Array<{ id: string, label: string }>}
 */
export function parseFormQuestions(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n|,|;/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  return lines.map((line, idx) => {
    const cleanLabel = line.replace(/^[\d\.\*\-\–\•\?]+\s*/, '').replace(/[\:\?]+$/, '').trim();
    return {
      id: `field-${idx}-${Date.now()}`,
      label: cleanLabel || line
    };
  });
}

/**
 * Matches form questions/fields against user's stored vault entries.
 * @param {Array<{ id: string, label: string }|string>} fields 
 * @param {Array<Object>} entries 
 * @returns {{ matches: Array<Object>, missing: Array<Object>, totalCount: number, matchedCount: number }}
 */
export function matchFormFields(fields, entries = []) {
  if (!fields || fields.length === 0) {
    return { matches: [], missing: [], totalCount: 0, matchedCount: 0 };
  }

  const normalizedFields = fields.map((f, idx) => {
    if (typeof f === 'string') {
      return { id: `field-${idx}`, label: f.trim() };
    }
    return f;
  });

  const matches = [];
  const missing = [];

  normalizedFields.forEach((field) => {
    const fieldText = field.label.trim();
    let bestEntry = null;
    let confidence = 'low';

    // 1. Exact or word-boundary intent match
    let matchedIntent = FIELD_INTENTS.find(intent => 
      intent.keywords.some(kw => matchesKeyword(fieldText, kw))
    );

    if (matchedIntent) {
      // Find entry matching specific intent type
      bestEntry = entries.find(e => 
        e.entry_type && matchedIntent.typeMatch.includes(e.entry_type.toLowerCase())
      );

      if (!bestEntry) {
        bestEntry = entries.find(e => 
          e.label && matchesKeyword(e.label, matchedIntent.category)
        );
      }

      if (bestEntry) {
        confidence = 'high';
      }
    }

    // 2. Exact word match on entry label
    if (!bestEntry) {
      bestEntry = entries.find(e => {
        const entryLabel = (e.label || '').toLowerCase();
        const words = fieldText.toLowerCase().split(/\s+/);
        return words.some(w => w.length >= 3 && matchesKeyword(entryLabel, w));
      });

      if (bestEntry) {
        confidence = 'medium';
      }
    }

    // 3. Strict Fallback matching
    if (!bestEntry) {
      const lower = fieldText.toLowerCase();
      if (matchesKeyword(lower, 'email') || matchesKeyword(lower, 'mail')) {
        bestEntry = entries.find(e => e.entry_type === 'email');
      } else if (matchesKeyword(lower, 'phone') || matchesKeyword(lower, 'mobile')) {
        bestEntry = entries.find(e => e.entry_type === 'phone');
      } else if (matchesKeyword(lower, 'github') || matchesKeyword(lower, 'git')) {
        bestEntry = entries.find(e => e.entry_type === 'github');
      } else if (matchesKeyword(lower, 'linkedin')) {
        bestEntry = entries.find(e => e.entry_type === 'linkedin');
      } else if (matchesKeyword(lower, 'portfolio') || matchesKeyword(lower, 'website')) {
        bestEntry = entries.find(e => e.entry_type === 'link');
      }

      if (bestEntry) {
        confidence = 'medium';
      }
    }

    if (bestEntry) {
      matches.push({
        fieldId: field.id,
        fieldLabel: field.label,
        matchedEntryId: bestEntry.id,
        entryLabel: bestEntry.label,
        entryValue: bestEntry.value,
        entryType: bestEntry.entry_type || 'text',
        confidence
      });
    } else {
      missing.push({
        fieldId: field.id,
        fieldLabel: field.label,
        suggestedCategory: matchedIntent ? matchedIntent.category : 'text'
      });
    }
  });

  return {
    matches,
    missing,
    totalCount: normalizedFields.length,
    matchedCount: matches.length
  };
}

/**
 * Standard form templates for quick 1-click matching
 */
export const FORM_TEMPLATES = [
  {
    id: 'job_application',
    title: '💼 Job Application',
    description: 'Standard developer / job application form fields',
    questions: [
      'Full Name',
      'Email Address',
      'Phone Number',
      'GitHub Profile URL',
      'LinkedIn Profile URL',
      'Portfolio / Personal Website',
      'Short Bio / Summary'
    ]
  },
  {
    id: 'college_grant',
    title: '🎓 College / Grant Application',
    description: 'Student profile, portfolio, and contact details',
    questions: [
      'Full Name',
      'Email Address',
      'Phone Number',
      'Portfolio URL',
      'GitHub Profile',
      'Location / Address'
    ]
  },
  {
    id: 'social_profile',
    title: '🌐 Social & Bio Contact Card',
    description: 'Handles, email, phone, and main social links',
    questions: [
      'Full Name',
      'Work Email',
      'GitHub',
      'LinkedIn',
      'Personal Link'
    ]
  }
];
