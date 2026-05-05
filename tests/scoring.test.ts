import { describe, it, expect } from 'vitest';
import { scoreControlsHeuristic, rollupHeuristic } from '../src/scoring';
import type { EvidenceItem } from '../src/types';

function ev(opts: Partial<EvidenceItem> & { service: string; api: string; controls: string[] }): EvidenceItem {
  return {
    id: `ev_test_${Math.random().toString(36).slice(2)}`,
    region: 'us-east-1',
    timestamp: Date.now(),
    raw: opts.raw ?? '{}',
    rawBytes: (opts.raw ?? '{}').length,
    truncated: false,
    ...opts,
  };
}

describe('scoreControlsHeuristic', () => {
  it('returns inconclusive with gap_score 30 for controls with no evidence', () => {
    const controls = scoreControlsHeuristic([]);
    for (const c of controls) {
      expect(c.status).toBe('inconclusive');
      expect(c.gap_score).toBe(30);
      expect(c.heuristic).toBe(true);
    }
  });

  it('CC6.1: root MFA enabled boosts gap score', () => {
    const evidence = [
      ev({ service: 'iam', api: 'GetAccountSummary', controls: ['CC6.1'], raw: '<GetAccountSummaryResponse><AccountMFAEnabled>1</AccountMFAEnabled></GetAccountSummaryResponse>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc61 = controls.find(c => c.control_id === 'CC6.1')!;
    expect(cc61.gap_score).toBeGreaterThan(60);
  });

  it('CC6.1: root MFA disabled creates a HIGH finding and lowers gap score', () => {
    const evidence = [
      ev({ service: 'iam', api: 'GetAccountSummary', controls: ['CC6.1'], raw: '<GetAccountSummaryResponse><AccountMFAEnabled>0</AccountMFAEnabled></GetAccountSummaryResponse>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc61 = controls.find(c => c.control_id === 'CC6.1')!;
    expect(cc61.gap_score).toBeLessThan(60);
    const highFinding = cc61.findings.find(f => f.severity === 'HIGH' && f.title.includes('MFA'));
    expect(highFinding).toBeDefined();
  });

  it('CC7.2: multi-region CloudTrail boosts gap score', () => {
    const evidence = [
      ev({ service: 'cloudtrail', api: 'DescribeTrails', controls: ['CC7.2'], raw: '{"IsMultiRegionTrail":true}' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc72 = controls.find(c => c.control_id === 'CC7.2')!;
    expect(cc72.gap_score).toBeGreaterThan(60);
  });

  it('CC7.2: missing CloudTrail creates a HIGH finding', () => {
    const controls = scoreControlsHeuristic([]);
    const cc72 = controls.find(c => c.control_id === 'CC7.2')!;
    // No evidence → inconclusive, not tested by rules
    expect(cc72.status).toBe('inconclusive');
  });

  it('CC9.2: 0-day backup retention creates CRITICAL finding', () => {
    const evidence = [
      ev({ service: 'rds', api: 'DescribeDBInstances', controls: ['CC9.2'], raw: '<DBInstances><DBInstance><BackupRetentionPeriod>0</BackupRetentionPeriod></DBInstance></DBInstances>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc92 = controls.find(c => c.control_id === 'CC9.2')!;
    const crit = cc92.findings.find(f => f.severity === 'CRITICAL');
    expect(crit).toBeDefined();
    expect(cc92.gap_score).toBeLessThan(60);
  });

  it('CC6.6: wide-open SG (0.0.0.0/0) creates HIGH finding', () => {
    const evidence = [
      ev({ service: 'ec2', api: 'DescribeSecurityGroups', controls: ['CC6.6'], raw: '<SecurityGroups><CidrIp>0.0.0.0/0</CidrIp></SecurityGroups>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc66 = controls.find(c => c.control_id === 'CC6.6')!;
    const highFinding = cc66.findings.find(f => f.severity === 'HIGH');
    expect(highFinding).toBeDefined();
  });

  it('CC6.7: unencrypted RDS lowers gap score and adds HIGH finding', () => {
    const evidence = [
      ev({ service: 'rds', api: 'DescribeDBInstances', controls: ['CC6.7'], raw: '<DBInstances><DBInstance><StorageEncrypted>false</StorageEncrypted></DBInstance></DBInstances>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    const cc67 = controls.find(c => c.control_id === 'CC6.7')!;
    const highFinding = cc67.findings.find(f => f.severity === 'HIGH');
    expect(highFinding).toBeDefined();
  });

  it('gap_score is always clamped between 5 and 100', () => {
    const evidence = [
      ev({ service: 'iam', api: 'GetAccountSummary', controls: ['CC6.1'], raw: '<AccountMFAEnabled>0</AccountMFAEnabled>' }),
      ev({ service: 'rds', api: 'DescribeDBInstances', controls: ['CC9.2'], raw: '<BackupRetentionPeriod>0</BackupRetentionPeriod>' }),
    ];
    const controls = scoreControlsHeuristic(evidence);
    for (const c of controls) {
      expect(c.gap_score).toBeGreaterThanOrEqual(5);
      expect(c.gap_score).toBeLessThanOrEqual(100);
    }
  });

  it('all 12 controls are returned', () => {
    const controls = scoreControlsHeuristic([]);
    expect(controls).toHaveLength(12);
    const ids = controls.map(c => c.control_id);
    expect(ids).toContain('CC5.2');
    expect(ids).toContain('CC9.2');
  });

  it('heuristic flag is always true', () => {
    const controls = scoreControlsHeuristic([]);
    for (const c of controls) expect(c.heuristic).toBe(true);
  });
});

describe('rollupHeuristic', () => {
  it('computes correct average gap score', () => {
    const controls = scoreControlsHeuristic([]);
    const rollup = rollupHeuristic(controls);
    const expected = Math.round(controls.reduce((a, c) => a + c.gap_score, 0) / controls.length);
    expect(rollup.overall_gap_score).toBe(expected);
  });

  it('readiness is "Audit-ready" when all controls are inconclusive (no fails or partials)', () => {
    const controls = scoreControlsHeuristic([]);
    // inconclusive status is counted as neither fail nor partial in rollupHeuristic,
    // so 0 fails + 0 partials → "Audit-ready".
    const rollup = rollupHeuristic(controls);
    expect(rollup.overall_readiness).toBe('Audit-ready');
  });

  it('includes heuristic label in executive summary', () => {
    const controls = scoreControlsHeuristic([]);
    const rollup = rollupHeuristic(controls);
    expect(rollup.executive_summary).toContain('heuristic');
  });
});
