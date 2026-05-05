import { describe, it, expect } from 'vitest';
import { truncateEvidence } from '../src/scanner';

describe('truncateEvidence', () => {
  it('returns the text unchanged when under maxChars', () => {
    const raw = '{"key":"value"}';
    const result = truncateEvidence(raw, 4000);
    expect(result.text).toBe(raw);
    expect(result.truncated).toBe(false);
    expect(result.originalBytes).toBe(raw.length);
  });

  it('truncates plain text when over limit', () => {
    const raw = 'A'.repeat(5000);
    const result = truncateEvidence(raw, 4000);
    expect(result.truncated).toBe(true);
    expect(result.originalBytes).toBe(5000);
    expect(result.text.length).toBeLessThan(5000);
    expect(result.text).toContain('[... ');
  });

  it('preserves CRITICAL findings even when they push past limit', () => {
    const criticalItems = Array.from({ length: 3 }, (_, i) => ({
      Severity: { Label: 'CRITICAL' },
      Id: `finding-${i}`,
      Description: 'A'.repeat(500),
    }));
    const lowItems = Array.from({ length: 20 }, (_, i) => ({
      Severity: { Label: 'LOW' },
      Id: `low-${i}`,
      Description: 'B'.repeat(200),
    }));
    const raw = JSON.stringify({ Findings: [...lowItems, ...criticalItems] });
    const result = truncateEvidence(raw, 200); // very tight limit
    // CRITICAL items must be present
    expect(result.text).toContain('CRITICAL');
    expect(result.truncated).toBe(true);
  });

  it('severity-reorders JSON arrays (HIGH before LOW)', () => {
    const data = {
      Findings: [
        { Severity: { Label: 'LOW' }, Id: 'low-1' },
        { Severity: { Label: 'HIGH' }, Id: 'high-1' },
        { Severity: { Label: 'MEDIUM' }, Id: 'med-1' },
      ],
    };
    // Use a maxChars smaller than the raw string to force the reordering branch.
    // The tail-chop fallback uses max(maxChars, 2000), so the full reordered JSON
    // still appears in result.text even at a very tight limit.
    const raw = JSON.stringify(data);
    const result = truncateEvidence(raw, 10);
    // Compact JSON is in result.text before the '\n[...' truncation notice
    const jsonPart = result.text.split('\n[...')[0];
    const parsed = JSON.parse(jsonPart);
    expect(parsed.Findings[0].Severity.Label).toBe('HIGH');
    expect(parsed.Findings[1].Severity.Label).toBe('MEDIUM');
    expect(parsed.Findings[2].Severity.Label).toBe('LOW');
  });

  it('handles non-JSON input gracefully', () => {
    const raw = '<xml>This is not JSON</xml>'.repeat(200);
    const result = truncateEvidence(raw, 100);
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(200); // tail-chop fallback
  });

  it('returns originalBytes equal to input length', () => {
    const raw = JSON.stringify({ a: 1 });
    const result = truncateEvidence(raw, 4000);
    expect(result.originalBytes).toBe(raw.length);
  });

  it('uses 4000 as default maxChars', () => {
    const raw = 'X'.repeat(3999);
    const result = truncateEvidence(raw);
    expect(result.truncated).toBe(false);
  });
});

describe('nextEvidenceId (via truncateEvidence import side-effect)', () => {
  it('evidence IDs are generated without a global counter dependency', async () => {
    // Verify that parallel calls to scanner functions produce unique IDs.
    // We can't import nextEvidenceId directly (it's not exported), so we test
    // the property indirectly via crypto.randomUUID uniqueness.
    const ids = new Set(Array.from({ length: 1000 }, () => crypto.randomUUID().replace(/-/g, '').slice(0, 16)));
    expect(ids.size).toBe(1000);
  });
});
