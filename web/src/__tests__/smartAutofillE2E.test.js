import { describe, it, expect } from 'vitest';
import { matchFormFields, parseFormQuestions } from '../lib/smartAutofill';
import { supabase } from '../lib/supabaseClient';

describe('E2E End-to-End Simulation: Smart Form Autofill Assistant', () => {
  it('simulates account creation, entry creation, and 100% form autofill mapping', async () => {
    // 1. Simulate account creation / sign in (using local auth helper for deterministic offline testing)
    const authRes = await supabase.auth._localSignUp(
      'applicant@example.com',
      'SecurePassword123!'
    );
    expect(authRes.data).toBeDefined();

    const userId = authRes.data?.user?.id || 'local-user';
    expect(userId).toBeDefined();

    // 2. Create sample application vault entries
    const entriesToSave = [
      { label: 'Full Name', value: 'Alex Morgan', entryType: 'text' },
      { label: 'GitHub Profile', value: 'https://github.com/alexmorgan', entryType: 'github' },
      { label: 'LinkedIn Profile', value: 'https://linkedin.com/in/alexmorgan', entryType: 'linkedin' },
      { label: 'Work Email', value: 'alex.morgan@work.com', entryType: 'email' },
      { label: 'Mobile Phone', value: '+1-555-0199', entryType: 'phone' },
      { label: 'Portfolio Website', value: 'https://alexmorgan.dev', entryType: 'link' },
    ];

    const createdEntries = [];
    for (const item of entriesToSave) {
      const created = await supabase.entries.createEntry({
        userId,
        setId: 'set-personal',
        label: item.label,
        value: item.value,
        entryType: item.entryType,
        isPrivate: false
      });
      createdEntries.push(created);
    }

    expect(createdEntries).toHaveLength(6);

    // 3. Simulate a job application form question prompt
    const jobAppFormQuestions = `
      1. Candidate Full Name
      2. Work Email Address
      3. Contact Phone Number
      4. GitHub Profile Link
      5. LinkedIn Profile URL
      6. Personal Portfolio / Website
    `;

    const parsedQuestions = parseFormQuestions(jobAppFormQuestions);
    expect(parsedQuestions).toHaveLength(6);

    // 4. Run Smart Form Autofill Matching Engine
    const autofillResult = matchFormFields(parsedQuestions, createdEntries);

    expect(autofillResult.matchedCount).toEqual(6);
    expect(autofillResult.missing).toHaveLength(0);

    // 5. Verify individual field mappings
    const nameMatch = autofillResult.matches.find(m => m.fieldLabel.includes('Full Name'));
    expect(nameMatch.entryValue).toBe('Alex Morgan');

    const githubMatch = autofillResult.matches.find(m => m.fieldLabel.includes('GitHub'));
    expect(githubMatch.entryValue).toBe('https://github.com/alexmorgan');

    const linkedinMatch = autofillResult.matches.find(m => m.fieldLabel.includes('LinkedIn'));
    expect(linkedinMatch.entryValue).toBe('https://linkedin.com/in/alexmorgan');

    const emailMatch = autofillResult.matches.find(m => m.fieldLabel.includes('Email'));
    expect(emailMatch.entryValue).toBe('alex.morgan@work.com');

    const phoneMatch = autofillResult.matches.find(m => m.fieldLabel.includes('Phone'));
    expect(phoneMatch.entryValue).toBe('+1-555-0199');

    const portfolioMatch = autofillResult.matches.find(m => m.fieldLabel.includes('Portfolio'));
    expect(portfolioMatch.entryValue).toBe('https://alexmorgan.dev');
  });
});
