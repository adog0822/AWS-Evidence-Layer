import { describe, it, expect } from 'vitest';
import { rollupExecutive } from '../src/analyzer';
import type { ControlAnalysis } from '../src/types';

// extractJson and buildPrompt are not exported — we test them indirectly via
// rollupExecutive (pure function) and through observable output behaviour.

function ctrl(overrides: Partial<ControlAnalysis> & { control_id: string }): ControlAnalysis {
  return {
    name: 'Control ' + overrides.control_id,
    status: 'pass',
    gap_score: 80,
    freshness_score: 90,
    summary: 'OK.',
    findings: [],
    evidence_ids: [],
    recommendations: [],
    ...overrides,
  };
}

describe('rollupExecutive', () => {
  it('computes correct average gap and freshness scores', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', gap_score: 60, freshness_score: 80 }),
      ctrl({ control_id: 'CC6.2', gap_score: 80, freshness_score: 100 }),
    ];
    const r = rollupExecutive(controls);
    expect(r.overall_gap_score).toBe(70);
    expect(r.overall_freshness_score).toBe(90);
  });

  it('readiness is "Audit-ready" when 0 fails and ≤1 partial', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'pass' }),
      ctrl({ control_id: 'CC6.2', status: 'pass' }),
      ctrl({ control_id: 'CC6.3', status: 'partial' }),
    ];
    const r = rollupExecutive(controls);
    expect(r.overall_readiness).toBe('Audit-ready');
  });

  it('readiness is "Near-ready" when ≤1 fail and ≤4 partials', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'fail' }),
      ctrl({ control_id: 'CC6.2', status: 'partial' }),
      ctrl({ control_id: 'CC6.3', status: 'partial' }),
      ctrl({ control_id: 'CC6.6', status: 'partial' }),
      ctrl({ control_id: 'CC6.7', status: 'pass' }),
    ];
    const r = rollupExecutive(controls);
    expect(r.overall_readiness).toBe('Near-ready');
  });

  it('readiness is "Significant gaps" when 2–3 fails', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'fail' }),
      ctrl({ control_id: 'CC6.2', status: 'fail' }),
      ctrl({ control_id: 'CC7.1', status: 'pass' }),
    ];
    const r = rollupExecutive(controls);
    expect(r.overall_readiness).toBe('Significant gaps');
  });

  it('readiness is "Not ready" when 4+ fails', () => {
    const controls = Array.from({ length: 6 }, (_, i) =>
      ctrl({ control_id: `CC${i}`, status: 'fail' })
    );
    const r = rollupExecutive(controls);
    expect(r.overall_readiness).toBe('Not ready');
  });

  it('collects CRITICAL and HIGH findings into critical_actions', () => {
    const controls = [
      ctrl({
        control_id: 'CC6.1',
        status: 'fail',
        findings: [
          { id: 'f1', severity: 'CRITICAL', title: 'Root MFA off', description: '', remediation: 'aws iam ...' },
          { id: 'f2', severity: 'LOW', title: 'Weak password', description: '', remediation: undefined },
        ],
      }),
    ];
    const r = rollupExecutive(controls);
    expect(r.critical_actions.some((a) => a.includes('Root MFA off'))).toBe(true);
    expect(r.critical_actions.some((a) => a.includes('Weak password'))).toBe(false);
  });

  it('caps critical_actions at 12', () => {
    const controls = Array.from({ length: 15 }, (_, i) =>
      ctrl({
        control_id: `CC${i}`,
        findings: [{ id: `f${i}`, severity: 'HIGH', title: `Finding ${i}`, description: '', remediation: undefined }],
      })
    );
    const r = rollupExecutive(controls);
    expect(r.critical_actions.length).toBeLessThanOrEqual(12);
  });

  it('lists passing controls in strengths', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'pass', name: 'Logical Access' }),
      ctrl({ control_id: 'CC7.2', status: 'fail' }),
    ];
    const r = rollupExecutive(controls);
    expect(r.strengths.some((s) => s.includes('CC6.1'))).toBe(true);
    expect(r.strengths.some((s) => s.includes('CC7.2'))).toBe(false);
  });

  it('executive_summary mentions pass/partial/fail counts', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'pass' }),
      ctrl({ control_id: 'CC6.2', status: 'partial' }),
      ctrl({ control_id: 'CC7.1', status: 'fail' }),
    ];
    const r = rollupExecutive(controls);
    expect(r.executive_summary).toContain('1 pass');
    expect(r.executive_summary).toContain('1 partial');
    expect(r.executive_summary).toContain('1 fail');
  });

  it('excludes not_assessed controls from scoring', () => {
    const controls = [
      ctrl({ control_id: 'CC6.1', status: 'pass', gap_score: 80 }),
      ctrl({ control_id: 'CC6.2', status: 'not_assessed', gap_score: 0 }),
    ];
    const r = rollupExecutive(controls);
    // not_assessed excluded → avg of [80] = 80, not avg of [80, 0] = 40
    expect(r.overall_gap_score).toBe(80);
  });

  it('returns gap 0 and freshness 0 for empty controls list', () => {
    const r = rollupExecutive([]);
    expect(r.overall_gap_score).toBe(0);
    expect(r.overall_freshness_score).toBe(0);
  });

  it('critical_actions include remediation when present', () => {
    const controls = [
      ctrl({
        control_id: 'CC6.1',
        findings: [{ id: 'f1', severity: 'HIGH', title: 'Open port', description: '', remediation: 'aws ec2 revoke-security-group-ingress ...' }],
      }),
    ];
    const r = rollupExecutive(controls);
    expect(r.critical_actions[0]).toContain('aws ec2 revoke-security-group-ingress');
  });
});
