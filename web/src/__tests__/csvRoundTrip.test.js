import { describe, it, expect } from 'vitest';
import { supabase, parseCsvDocument, sanitizeCsvValue, unsanitizeCsvValue } from '../lib/supabaseClient';

describe('CSV Round-Trip Integrity & RFC 4180 Parser', () => {
  it('correctly handles formula unsanitizing for phone numbers and formula triggers', () => {
    expect(sanitizeCsvValue('+91 9876543210')).toBe("'+91 9876543210");
    expect(unsanitizeCsvValue("'+91 9876543210")).toBe('+91 9876543210');
    expect(sanitizeCsvValue('=SUM(1,2)')).toBe("'=SUM(1,2)");
    expect(unsanitizeCsvValue("'=SUM(1,2)")).toBe('=SUM(1,2)');
    expect(unsanitizeCsvValue('Normal Text')).toBe('Normal Text');
  });

  it('correctly parses multiline cells, commas, quotes, and phone numbers in CSV document', () => {
    const rawCsv = `ProfileSet,Label,Value,Type,Note,IsPrivate,CopyCount,CreatedAt
"Personal","Phone Number","'+91 9876543210","phone","Primary mobile line",true,0,"2026-10-06T10:00:00.000Z"
"Work","Multiline & Quote","Line 1
Line 2 with ""quotes"" and , comma","text","Secret note",false,5,"2026-10-06T10:00:00.000Z"`;

    const rows = parseCsvDocument(rawCsv);
    expect(rows).toHaveLength(3); // Header + 2 data rows

    // Row 1
    expect(rows[1][0]).toBe('Personal');
    expect(rows[1][1]).toBe('Phone Number');
    expect(unsanitizeCsvValue(rows[1][2])).toBe('+91 9876543210');

    // Row 2 (Multiline + Quote + Comma)
    expect(rows[2][0]).toBe('Work');
    expect(rows[2][1]).toBe('Multiline & Quote');
    expect(rows[2][2]).toBe(`Line 1\nLine 2 with "quotes" and , comma`);
  });

  it('performs full export and import round-trip without data corruption', async () => {
    const testUserId = 'test-user-csv';

    // 1. Setup sample entries containing comma, quote, newline, and +91 phone
    const setObj = await supabase.sets.createSet(testUserId, 'Test Profile');
    await supabase.entries.createEntry({
      userId: testUserId,
      setId: setObj.id,
      label: 'Contact Info, Primary',
      value: '+91 9988776655',
      note: 'Hello "World"\nNew line note with , comma',
      entryType: 'phone',
      isPrivate: false
    });

    // 2. Export to CSV
    const exportedCsv = await supabase.backup.exportVaultToCsv(testUserId);
    expect(exportedCsv).toContain('+91 9988776655');

    // 3. Import back from CSV
    const importResult = await supabase.backup.importVaultFromCsv(testUserId, exportedCsv);
    expect(importResult.importedCount).toBeGreaterThanOrEqual(1);

    // 4. Verify fetched entries match original values
    const entries = await supabase.entries.fetchEntries(setObj.id, testUserId);
    const matched = entries.find(e => e.label === 'Contact Info, Primary');
    expect(matched).toBeDefined();
    expect(matched.value).toBe('+91 9988776655');
    expect(matched.note).toBe('Hello "World"\nNew line note with , comma');
  });
});
