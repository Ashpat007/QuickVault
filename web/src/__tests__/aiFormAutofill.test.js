import { describe, it, expect } from 'vitest';
import { parseFormQuestions, matchFormFields, FORM_TEMPLATES } from '../lib/aiFormAutofill';

describe('AI Form Autofill Engine (aiFormAutofill.js)', () => {
  const mockEntries = [
    { id: '1', label: 'GitHub Profile', value: 'https://github.com/alexdev', entry_type: 'github' },
    { id: '2', label: 'LinkedIn Profile', value: 'https://linkedin.com/in/alexdev', entry_type: 'linkedin' },
    { id: '3', label: 'Personal Email', value: 'alex@example.com', entry_type: 'email' },
    { id: '4', label: 'Phone', value: '+1-555-0199', entry_type: 'phone' },
    { id: '5', label: 'Portfolio', value: 'https://alexdev.io', entry_type: 'link' },
  ];

  it('should parse raw text input into structured form questions', () => {
    const raw = `Full Name\nGitHub URL\nLinkedIn Profile\nEmail Address`;
    const parsed = parseFormQuestions(raw);
    expect(parsed).toHaveLength(4);
    expect(parsed[0].label).toBe('Full Name');
    expect(parsed[1].label).toBe('GitHub URL');
  });

  it('should accurately match form questions against stored vault entries', () => {
    const questions = ['GitHub URL', 'LinkedIn Profile', 'Email Address', 'Phone Number'];
    const result = matchFormFields(questions, mockEntries);

    expect(result.matchedCount).toBe(4);
    expect(result.missing).toHaveLength(0);

    const githubMatch = result.matches.find(m => m.fieldLabel === 'GitHub URL');
    expect(githubMatch).toBeDefined();
    expect(githubMatch.entryValue).toBe('https://github.com/alexdev');
    expect(githubMatch.confidence).toBe('high');
  });

  it('should identify missing form fields when no entry is available', () => {
    const questions = ['GitHub URL', 'Home Zip Code', 'Favorite Color'];
    const result = matchFormFields(questions, mockEntries);

    expect(result.matchedCount).toBe(1); // Only GitHub matches
    expect(result.missing).toHaveLength(2);
    expect(result.missing[0].fieldLabel).toBe('Home Zip Code');
  });

  it('should support pre-defined form templates', () => {
    expect(FORM_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const jobApp = FORM_TEMPLATES.find(t => t.id === 'job_application');
    expect(jobApp).toBeDefined();
    expect(jobApp.questions).toContain('GitHub Profile URL');
  });
});
