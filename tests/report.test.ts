import { describe, it, expect } from 'vitest';
import { applyEdits, annotateControlsWithDelta, buildReportHtml, hashReport } from '../src/report';
import type { ScanResults, ControlAnalysis, EvidenceItem } from '../src/types';
import type { ScanEdit, DeltaWithHistory } from '../src/report';

function makeControl(overrides: Partial<ControlAnalysis> & { control_id: string }): ControlAnalysis {
  return {
    name: 'Test Control',
    status: 'pass',
    gap_score: 80,
    freshness_score: 90,
    summary: 'Looks good.',
    findings: [],
    evidence_ids: [],
    recommendations: [],
    ...overrides,
  };
}

function makeResults(overrides: Partial<ScanResults> = {}): ScanResults {
  return {
    controls: [makeControl({ control_id: 'CC6.1' })],
    evidence: [],
    overall_readiness: 'Audit-ready',
    overall_gap_score: 80,
    overall_freshness_score: 90,
    executive_summary: 'All good.',
    critical_actions: [],
    strengths: ['CC6.1: Logical Access'],
    ...overrides,
  };
}

function makeEvidence(id: string, raw = '{}'): EvidenceItem {
  return {
    id,
    service: 'iam',
    api: 'GetAccountSummary',
    region: 'us-east-1',
    controls: ['CC6.1'],
    raw,
    rawBytes: raw.length,
    truncated: false,
    timestamp: Date.now(),
  };
}

// ============================================================
// applyEdits
// ============================================================

describe('applyEdits', () => {
  it('returns original results unchanged when no edits', () => {
    const results = makeResults();
    const out = applyEdits(results, []);
    expect(out.controls[0].control_id).toBe('CC6.1');
  });

  it('overrides finding severity', () => {
    const results = makeResults({
      controls: [
        makeControl({
          control_id: 'CC6.1',
          findings: [{ id: 'f1', severity: 'HIGH', title: 'Test finding', description: 'Desc', remediation: undefined }],
        }),
      ],
    });
    const edit: ScanEdit = {
      id: 'e1',
      edit_type: 'severity_override',
      target_path: 'controls.CC6.1.findings.0.severity',
      original_value: 'HIGH',
      new_value: 'MEDIUM',
      note: 'Risk accepted by CISO',
      created_at: Date.now(),
    };
    const out = applyEdits(results, [edit]);
    const f = out.controls[0].findings![0];
    expect(f.severity).toBe('MEDIUM');
    expect((f as any).human_edited.original).toBe('HIGH');
    expect((f as any).human_edited.note).toBe('Risk accepted by CISO');
  });

  it('severity_override with unknown index is a no-op', () => {
    const results = makeResults({
      controls: [
        makeControl({
          control_id: 'CC6.1',
          findings: [{ id: 'f1', severity: 'HIGH', title: 'Finding', description: '', remediation: undefined }],
        }),
      ],
    });
    const edit: ScanEdit = {
      id: 'e2',
      edit_type: 'severity_override',
      target_path: 'controls.CC6.1.findings.99.severity',
      original_value: 'HIGH',
      new_value: 'LOW',
      note: null,
      created_at: Date.now(),
    };
    const out = applyEdits(results, [edit]);
    expect(out.controls[0].findings![0].severity).toBe('HIGH');
  });

  it('adds a note to the control', () => {
    const results = makeResults();
    const edit: ScanEdit = {
      id: 'e3',
      edit_type: 'note',
      target_path: 'controls.CC6.1',
      original_value: null,
      new_value: 'Reviewed and accepted.',
      note: 'Reviewed and accepted.',
      created_at: 1000,
    };
    const out = applyEdits(results, [edit]);
    const notes = (out.controls[0] as any).human_notes;
    expect(notes).toBeDefined();
    expect(notes[0].note).toBe('Reviewed and accepted.');
  });

  it('redacts evidence', () => {
    const ev = makeEvidence('ev_abc', 'secret data');
    const results = makeResults({ evidence: [ev] });
    const edit: ScanEdit = {
      id: 'e4',
      edit_type: 'redaction',
      target_path: 'controls.CC6.1.evidence_ids.ev_abc',
      original_value: null,
      new_value: null,
      note: null,
      created_at: Date.now(),
    };
    const out = applyEdits(results, [edit]);
    const evOut = out.evidence.find((x) => x.id === 'ev_abc');
    expect(evOut!.raw).toContain('redacted');
    expect((evOut as any).redacted).toBe(true);
  });

  it('ignores edits for unknown controls', () => {
    const results = makeResults();
    const edit: ScanEdit = {
      id: 'e5',
      edit_type: 'severity_override',
      target_path: 'controls.CC99.9.findings.0.severity',
      original_value: 'HIGH',
      new_value: 'LOW',
      note: null,
      created_at: Date.now(),
    };
    const out = applyEdits(results, [edit]);
    expect(out.controls[0].control_id).toBe('CC6.1');
  });

  it('does not mutate the original results', () => {
    const results = makeResults({
      controls: [
        makeControl({
          control_id: 'CC6.1',
          findings: [{ id: 'f1', severity: 'HIGH', title: 'T', description: 'D', remediation: undefined }],
        }),
      ],
    });
    const edit: ScanEdit = {
      id: 'e6',
      edit_type: 'severity_override',
      target_path: 'controls.CC6.1.findings.0.severity',
      original_value: 'HIGH',
      new_value: 'LOW',
      note: null,
      created_at: Date.now(),
    };
    applyEdits(results, [edit]);
    expect(results.controls[0].findings![0].severity).toBe('HIGH');
  });
});

// ============================================================
// annotateControlsWithDelta
// ============================================================

describe('annotateControlsWithDelta', () => {
  it('returns controls unchanged when no delta', () => {
    const controls = [makeControl({ control_id: 'CC6.1' })];
    const out = annotateControlsWithDelta(controls, undefined);
    expect(out).toBe(controls);
  });

  it('marks improved when gap_score increased by > 2', () => {
    const prev = makeControl({ control_id: 'CC6.1', status: 'fail', gap_score: 40 });
    const curr = makeControl({ control_id: 'CC6.1', status: 'pass', gap_score: 80 });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'scan-old',
        previous_completed_at: 1000,
        previous_overall_gap_score: 40,
        current_overall_gap_score: 80,
        trend: 'improved',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map([['CC6.1', prev]]),
    };
    const out = annotateControlsWithDelta([curr], dh);
    expect(out[0].delta?.trend).toBe('improved');
    expect(out[0].delta?.previous_gap_score).toBe(40);
  });

  it('marks regressed when gap_score decreased by > 2', () => {
    const prev = makeControl({ control_id: 'CC6.1', status: 'pass', gap_score: 80 });
    const curr = makeControl({ control_id: 'CC6.1', status: 'fail', gap_score: 30 });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'scan-old',
        previous_completed_at: 1000,
        previous_overall_gap_score: 80,
        current_overall_gap_score: 30,
        trend: 'regressed',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map([['CC6.1', prev]]),
    };
    const out = annotateControlsWithDelta([curr], dh);
    expect(out[0].delta?.trend).toBe('regressed');
  });

  it('marks unchanged when gap_score within 2 points', () => {
    const prev = makeControl({ control_id: 'CC6.1', gap_score: 80 });
    const curr = makeControl({ control_id: 'CC6.1', gap_score: 81 });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'x',
        previous_completed_at: 0,
        previous_overall_gap_score: 80,
        current_overall_gap_score: 81,
        trend: 'unchanged',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map([['CC6.1', prev]]),
    };
    const out = annotateControlsWithDelta([curr], dh);
    expect(out[0].delta?.trend).toBe('unchanged');
  });

  it('populates fixed_findings when control flips fail→pass', () => {
    const prev = makeControl({ control_id: 'CC6.1', status: 'fail', gap_score: 30 });
    const curr = makeControl({ control_id: 'CC6.1', status: 'pass', gap_score: 80, name: 'Logical Access' });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'x',
        previous_completed_at: 0,
        previous_overall_gap_score: 30,
        current_overall_gap_score: 80,
        trend: 'improved',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map([['CC6.1', prev]]),
    };
    annotateControlsWithDelta([curr], dh);
    expect(dh.delta.fixed_findings).toContain('CC6.1 — Logical Access');
  });

  it('populates new_failing_findings when control flips to fail', () => {
    const prev = makeControl({ control_id: 'CC6.1', status: 'pass', gap_score: 80 });
    const curr = makeControl({ control_id: 'CC6.1', status: 'fail', gap_score: 20, name: 'Logical Access' });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'x',
        previous_completed_at: 0,
        previous_overall_gap_score: 80,
        current_overall_gap_score: 20,
        trend: 'regressed',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map([['CC6.1', prev]]),
    };
    annotateControlsWithDelta([curr], dh);
    expect(dh.delta.new_failing_findings).toContain('CC6.1 — Logical Access');
  });

  it('skips controls not in prevById', () => {
    const curr = makeControl({ control_id: 'CC7.1', gap_score: 50 });
    const dh: DeltaWithHistory = {
      delta: {
        previous_scan_id: 'x',
        previous_completed_at: 0,
        previous_overall_gap_score: 50,
        current_overall_gap_score: 50,
        trend: 'unchanged',
        fixed_findings: [],
        new_failing_findings: [],
      },
      prevById: new Map(),
    };
    const out = annotateControlsWithDelta([curr], dh);
    expect(out[0].delta).toBeUndefined();
  });
});

// ============================================================
// hashReport
// ============================================================

describe('hashReport', () => {
  it('returns a 64-character hex SHA-256', async () => {
    const hash = await hashReport('hello world');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same hash for identical inputs', async () => {
    const a = await hashReport('same content');
    const b = await hashReport('same content');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await hashReport('content A');
    const b = await hashReport('content B');
    expect(a).not.toBe(b);
  });

  it('handles empty string', async () => {
    const hash = await hashReport('');
    expect(hash).toHaveLength(64);
  });
});

// ============================================================
// buildReportHtml
// ============================================================

describe('buildReportHtml', () => {
  it('returns html and sha256', async () => {
    const results = makeResults();
    const { html, sha256 } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: 'Acme Corp',
      scanCompletedAt: Date.now(),
      results,
    });
    expect(html).toContain('Acme Corp');
    expect(sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(html).toContain(sha256);
  });

  it('html contains the org name escaped', async () => {
    const results = makeResults();
    const { html } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: '<Script>Hack</Script>',
      scanCompletedAt: Date.now(),
      results,
    });
    expect(html).not.toContain('<Script>');
    expect(html).toContain('&lt;Script&gt;');
  });

  it('includes delta section when delta provided', async () => {
    const results = makeResults();
    const { html } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: 'Acme',
      scanCompletedAt: Date.now(),
      results,
      delta: {
        previous_scan_id: 'scan-000',
        previous_completed_at: Date.now() - 86400000,
        previous_overall_gap_score: 60,
        current_overall_gap_score: 80,
        trend: 'improved',
        fixed_findings: ['CC6.1 — Logical Access'],
        new_failing_findings: [],
      },
    });
    expect(html).toContain('Since your last scan');
    expect(html).toContain('Fixed since last scan');
    expect(html).toContain('CC6.1 — Logical Access');
  });

  it('omits delta section when no delta', async () => {
    const results = makeResults();
    const { html } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: 'Acme',
      scanCompletedAt: Date.now(),
      results,
    });
    expect(html).not.toContain('Since your last scan');
  });

  it('applies edits before rendering', async () => {
    const results = makeResults({
      controls: [
        makeControl({
          control_id: 'CC6.1',
          findings: [{ id: 'f1', severity: 'HIGH', title: 'Open port', description: 'Port 22 open', remediation: undefined }],
        }),
      ],
    });
    const edit: ScanEdit = {
      id: 'e1',
      edit_type: 'severity_override',
      target_path: 'controls.CC6.1.findings.0.severity',
      original_value: 'HIGH',
      new_value: 'MEDIUM',
      note: 'Scoped',
      created_at: Date.now(),
    };
    const { html } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: 'Acme',
      scanCompletedAt: Date.now(),
      results,
      edits: [edit],
    });
    expect(html).toContain('Reviewer annotation');
    expect(html).toContain('original severity was HIGH');
  });

  it('sorts controls by control_id in output', async () => {
    const results = makeResults({
      controls: [
        makeControl({ control_id: 'CC9.2' }),
        makeControl({ control_id: 'CC6.1' }),
      ],
    });
    const { html } = await buildReportHtml({
      scanId: 'scan-001',
      orgName: 'Acme',
      scanCompletedAt: Date.now(),
      results,
    });
    const pos61 = html.indexOf('id="ctrl-CC6.1"');
    const pos92 = html.indexOf('id="ctrl-CC9.2"');
    expect(pos61).toBeGreaterThan(-1);
    expect(pos92).toBeGreaterThan(-1);
    expect(pos61).toBeLessThan(pos92);
  });

  it('sha256 in html matches the returned sha256', async () => {
    const results = makeResults();
    const { html, sha256 } = await buildReportHtml({
      scanId: 's',
      orgName: 'O',
      scanCompletedAt: 0,
      results,
    });
    expect(html).toContain(`SHA-256: ${sha256}`);
  });
});
