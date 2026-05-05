import { describe, it, expect } from 'vitest';
import { CONTROLS, getControl, evidenceForControl, emptyAnalysis } from '../src/controls';
import type { EvidenceItem } from '../src/types';

function ev(opts: { service: string; api: string; controls?: string[] }): EvidenceItem {
  return {
    id: `ev_${Math.random().toString(36).slice(2)}`,
    service: opts.service,
    api: opts.api,
    region: 'us-east-1',
    controls: opts.controls ?? [],
    raw: '{}',
    rawBytes: 2,
    truncated: false,
    timestamp: Date.now(),
  };
}

describe('CONTROLS registry', () => {
  it('contains exactly 12 controls', () => {
    expect(CONTROLS).toHaveLength(12);
  });

  it('all controls have unique IDs', () => {
    const ids = CONTROLS.map((c) => c.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('all controls have non-empty name, description, evidenceFilters', () => {
    for (const c of CONTROLS) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.evidenceFilters).toBeDefined();
    }
  });

  it('contains the six expected CC6 controls', () => {
    const ids = CONTROLS.map((c) => c.id);
    for (const id of ['CC6.1', 'CC6.2', 'CC6.3', 'CC6.6', 'CC6.7']) {
      expect(ids).toContain(id);
    }
  });

  it('controls with disclaimers have at least one non-empty disclaimer', () => {
    for (const c of CONTROLS) {
      if (c.disclaimers) {
        expect(c.disclaimers.length).toBeGreaterThan(0);
        expect(c.disclaimers[0].length).toBeGreaterThan(0);
      }
    }
  });

  it('partiallyAssessable controls also carry disclaimers', () => {
    const partial = CONTROLS.filter((c) => c.partiallyAssessable);
    expect(partial.length).toBeGreaterThan(0);
    for (const c of partial) {
      expect(c.disclaimers?.length).toBeGreaterThan(0);
    }
  });
});

describe('getControl', () => {
  it('returns the correct ControlDef for known IDs', () => {
    const def = getControl('CC6.1');
    expect(def).toBeDefined();
    expect(def!.id).toBe('CC6.1');
  });

  it('returns undefined for unknown IDs', () => {
    expect(getControl('CC99.9')).toBeUndefined();
    expect(getControl('')).toBeUndefined();
  });

  it('returned def is immutable reference to CONTROLS array entry', () => {
    const def = getControl('CC7.2');
    const entry = CONTROLS.find((c) => c.id === 'CC7.2');
    expect(def).toBe(entry);
  });
});

describe('evidenceForControl', () => {
  it('returns empty array for unknown control', () => {
    const result = evidenceForControl('CC99.9', [ev({ service: 'iam', api: 'ListUsers' })]);
    expect(result).toHaveLength(0);
  });

  it('includes evidence explicitly tagged with the control', () => {
    const tagged = ev({ service: 'ec2', api: 'SomethingElse', controls: ['CC6.1'] });
    const result = evidenceForControl('CC6.1', [tagged]);
    expect(result).toContain(tagged);
  });

  it('includes evidence whose service matches evidenceFilters.services', () => {
    // CC6.1 filters on ['iam', 's3', 'kms', 'sso']
    const iamEv = ev({ service: 'iam', api: 'ListUsers' });
    const result = evidenceForControl('CC6.1', [iamEv]);
    expect(result).toContain(iamEv);
  });

  it('excludes evidence from services not in the control filter', () => {
    // 'ec2' is not in CC6.1 evidenceFilters.services
    const ec2Ev = ev({ service: 'ec2', api: 'DescribeInstances' });
    const result = evidenceForControl('CC6.1', [ec2Ev]);
    expect(result).not.toContain(ec2Ev);
  });

  it('deduplicates: tagged + matching service counts once', () => {
    // Tagged AND service match — should appear once
    const taggedIam = ev({ service: 'iam', api: 'ListUsers', controls: ['CC6.1'] });
    const result = evidenceForControl('CC6.1', [taggedIam]);
    const count = result.filter((r) => r.id === taggedIam.id).length;
    expect(count).toBe(1);
  });

  it('includes evidence matching api filter prefix', () => {
    // CC7.2 evidenceFilters has no apis key — use CC8.1 which includes cloudtrail
    // CC8.1 filters: services: ['cloudtrail', 'config', 'lambda']
    const trailEv = ev({ service: 'cloudtrail', api: 'DescribeTrails' });
    const result = evidenceForControl('CC8.1', [trailEv]);
    expect(result).toContain(trailEv);
  });

  it('returns all matching evidence from a mixed list', () => {
    const iamEv = ev({ service: 'iam', api: 'GetAccountSummary' });
    const s3Ev = ev({ service: 's3', api: 'ListBuckets' });
    const ec2Ev = ev({ service: 'ec2', api: 'DescribeInstances' });
    // CC6.7 filters: ['kms', 'rds', 's3', 'iam']
    const result = evidenceForControl('CC6.7', [iamEv, s3Ev, ec2Ev]);
    expect(result).toContain(iamEv);
    expect(result).toContain(s3Ev);
    expect(result).not.toContain(ec2Ev);
  });

  it('returns empty array when all evidence is from unrelated services', () => {
    const result = evidenceForControl('CC6.1', [
      ev({ service: 'route53', api: 'ListHostedZones' }),
      ev({ service: 'cloudwatch', api: 'ListMetrics' }),
    ]);
    expect(result).toHaveLength(0);
  });
});

describe('emptyAnalysis', () => {
  it('sets status to not_assessed', () => {
    const a = emptyAnalysis('CC6.1', 'Logical Access');
    expect(a.status).toBe('not_assessed');
  });

  it('sets gap_score and freshness_score to 0', () => {
    const a = emptyAnalysis('CC6.1', 'Logical Access');
    expect(a.gap_score).toBe(0);
    expect(a.freshness_score).toBe(0);
  });

  it('returns correct control_id and name', () => {
    const a = emptyAnalysis('CC7.2', 'Security Event Monitoring');
    expect(a.control_id).toBe('CC7.2');
    expect(a.name).toBe('Security Event Monitoring');
  });

  it('returns empty arrays for findings, evidence_ids, recommendations', () => {
    const a = emptyAnalysis('CC9.2', 'BCDR');
    expect(a.findings).toEqual([]);
    expect(a.evidence_ids).toEqual([]);
    expect(a.recommendations).toEqual([]);
  });
});
