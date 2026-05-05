import { describe, it, expect } from 'vitest';
import { gideonContextSuggestions } from '../src/gideon';
import type { ScanResults } from '../src/types';

function makeResults(overrides: Partial<ScanResults> = {}): ScanResults {
  return {
    controls: [
      {
        control_id: 'CC6.1',
        name: 'Logical Access — Restricted Access',
        status: 'fail',
        gap_score: 40,
        freshness_score: 95,
        summary: 'Root MFA not enabled.',
        findings: [
          { id: 'f1', severity: 'CRITICAL', title: 'Root MFA disabled', description: 'Root account has no MFA device.', remediation: 'aws iam enable-mfa-device ...' },
          { id: 'f2', severity: 'HIGH', title: '3 IAM users without MFA', description: 'Users alice, bob, carol lack MFA.', remediation: 'aws iam enable-mfa-device ...' },
          { id: 'f3', severity: 'MEDIUM', title: 'Weak password policy', description: 'Min length is 8.', remediation: undefined },
        ],
        evidence_ids: ['ev1'],
        recommendations: ['Enforce org-level MFA SCP.'],
        auditor_questions: ['Can you show MFA is enforced for all human principals?'],
      },
    ],
    evidence: [],
    ...overrides,
  };
}

describe('gideonContextSuggestions', () => {
  it('returns context mode', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC6.1');
    expect(res.mode).toBe('context');
  });

  it('surfaces the highest-severity finding first', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC6.1');
    const top = res.suggestions![0];
    expect(top.label).toContain('CC6.1');
    expect(top.body).toContain('Root MFA disabled');
  });

  it('includes an effort estimate suggestion', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC6.1');
    const effort = res.suggestions!.find(s => s.label === 'How long will this take?');
    expect(effort).toBeDefined();
    // 1 CRITICAL + 1 HIGH → "half a day" bucket
    expect(effort!.body).toContain('half a day');
  });

  it('includes the auditor question', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC6.1');
    const aq = res.suggestions!.find(s => s.label === 'What will an auditor ask?');
    expect(aq).toBeDefined();
    expect(aq!.body).toContain('MFA is enforced');
  });

  it('provides a free-form CTA suggestion', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC6.1');
    const cta = res.suggestions!.find(s => s.cta?.kind === 'ask');
    expect(cta).toBeDefined();
    expect(cta!.cta!.question).toContain('Root MFA disabled');
  });

  it('returns a fallback for unknown control_id', () => {
    const res = gideonContextSuggestions(makeResults(), 'CC99.99');
    expect(res.mode).toBe('context');
    expect(res.suggestions![0].label).toBe('No analysis for this control');
  });

  it('handles a control with no findings but recommendations', () => {
    const results = makeResults();
    results.controls[0].findings = [];
    results.controls[0].recommendations = ['Enable GuardDuty.'];
    const res = gideonContextSuggestions(results, 'CC6.1');
    const top = res.suggestions![0];
    expect(top.body).toContain('Enable GuardDuty');
  });

  it('effort estimate reflects 0 critical/high findings', () => {
    const results = makeResults();
    results.controls[0].findings = [
      { id: 'f1', severity: 'LOW', title: 'Minor issue', description: 'Ok.', remediation: undefined },
    ];
    const res = gideonContextSuggestions(results, 'CC6.1');
    const effort = res.suggestions!.find(s => s.label === 'How long will this take?');
    expect(effort!.body).toContain('Less than 1 hour');
  });

  it('effort estimate for 3–5 critical+high findings', () => {
    const results = makeResults();
    results.controls[0].findings = Array.from({ length: 6 }, (_, i) => ({
      id: `f${i}`, severity: 'HIGH' as const, title: `Finding ${i}`, description: '', remediation: undefined,
    }));
    const res = gideonContextSuggestions(results, 'CC6.1');
    const effort = res.suggestions!.find(s => s.label === 'How long will this take?');
    expect(effort!.body).toContain('3–5 days');
  });
});
