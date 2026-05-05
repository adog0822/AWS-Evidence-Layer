// Free-tier rule-based control scoring. NO Claude calls. Lightweight pattern
// matching against the raw evidence to compute a gap_score and a coarse
// PASS/PARTIAL/FAIL signal so the buyer can see "shape of the report" before
// paying. The paid Claude analysis (analyzer.ts) overwrites these results.

import type { ControlAnalysis, EvidenceItem } from './types';
import { CONTROLS, evidenceForControl, ControlDef } from './controls';

interface Rule {
  // returns delta to gap score (positive = better, negative = worse)
  // and an optional finding for the paywall teaser (no remediation/details)
  (ev: EvidenceItem[]): { delta: number; teasers: { severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; title: string }[] };
}

const RULES: Record<string, Rule> = {
  'CC5.2': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'config')) delta += 12; else { delta -= 18; teasers.push({ severity: 'HIGH', title: 'AWS Config not detected' }); }
    if (hasService(ev, 'securityhub')) delta += 12; else { delta -= 8; teasers.push({ severity: 'MEDIUM', title: 'SecurityHub not enabled' }); }
    if (hasService(ev, 'guardduty')) delta += 6;
    return { delta, teasers };
  },
  'CC6.1': (ev) => {
    let delta = 0; const teasers: any[] = [];
    const summary = pick(ev, 'iam', 'GetAccountSummary');
    if (summary && /<AccountMFAEnabled>1<\/AccountMFAEnabled>/.test(summary.raw)) delta += 14;
    if (summary && /<AccountMFAEnabled>0<\/AccountMFAEnabled>/.test(summary.raw)) { delta -= 22; teasers.push({ severity: 'HIGH', title: 'Root account MFA not enabled' }); }
    if (pick(ev, 'iam', 'GetAccountPasswordPolicy')) delta += 6;
    // public bucket detection (S3 PublicAccessBlock missing)
    const s3pab = ev.filter((e) => e.service === 's3' && /PublicAccessBlock/.test(e.api));
    if (s3pab.length === 0) { delta -= 4; teasers.push({ severity: 'MEDIUM', title: 'No PublicAccessBlock evidence on any S3 bucket' }); }
    if (hasService(ev, 'sso')) delta += 8;
    return { delta, teasers };
  },
  'CC6.2': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'iam')) delta += 6;
    if (hasService(ev, 'sso')) delta += 10; else teasers.push({ severity: 'LOW', title: 'AWS SSO/Identity Center not in use — federated provisioning unverified' });
    return { delta, teasers };
  },
  'CC6.3': (ev) => {
    let delta = 0; const teasers: any[] = [];
    const roles = pick(ev, 'iam', 'ListRoles');
    if (roles && /<Roles>/.test(roles.raw)) delta += 10;
    const policies = pick(ev, 'iam', 'ListPolicies');
    if (policies) delta += 6;
    if (hasService(ev, 'sso')) delta += 8;
    return { delta, teasers };
  },
  'CC6.6': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (anyMatch(ev, /flowLog/i) || pick(ev, 'ec2', 'DescribeFlowLogs')) delta += 6; else teasers.push({ severity: 'MEDIUM', title: 'No VPC flow logs evidence' });
    if (hasService(ev, 'waf')) delta += 8;
    // Wide-open SG rule heuristic
    const sg = pick(ev, 'ec2', 'DescribeSecurityGroups');
    if (sg && /<CidrIp>0\.0\.0\.0\/0<\/CidrIp>/.test(sg.raw)) { delta -= 14; teasers.push({ severity: 'HIGH', title: 'Security group allows 0.0.0.0/0 ingress' }); }
    if (hasService(ev, 'secretsmanager')) delta += 4;
    return { delta, teasers };
  },
  'CC6.7': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'kms')) delta += 12;
    const rds = pick(ev, 'rds', 'DescribeDBInstances');
    if (rds) {
      if (/<StorageEncrypted>true<\/StorageEncrypted>/.test(rds.raw)) delta += 8;
      if (/<StorageEncrypted>false<\/StorageEncrypted>/.test(rds.raw)) { delta -= 18; teasers.push({ severity: 'HIGH', title: 'RDS instance not encrypted at rest' }); }
    }
    return { delta, teasers };
  },
  'CC7.1': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'config')) delta += 12;
    if (hasService(ev, 'securityhub')) delta += 10;
    return { delta, teasers };
  },
  'CC7.2': (ev) => {
    let delta = 0; const teasers: any[] = [];
    const trails = pick(ev, 'cloudtrail', 'DescribeTrails');
    if (trails) {
      if (/"IsMultiRegionTrail":\s*true/.test(trails.raw) || /<IsMultiRegionTrail>true<\/IsMultiRegionTrail>/.test(trails.raw)) delta += 14;
      else { delta -= 8; teasers.push({ severity: 'MEDIUM', title: 'CloudTrail multi-region trail not detected' }); }
    } else { delta -= 16; teasers.push({ severity: 'HIGH', title: 'CloudTrail evidence missing' }); }
    if (hasService(ev, 'cloudwatch')) delta += 6;
    return { delta, teasers };
  },
  'CC7.3': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'cloudwatch')) delta += 8;
    if (hasService(ev, 'guardduty')) delta += 10; else teasers.push({ severity: 'MEDIUM', title: 'GuardDuty not enabled' });
    if (hasService(ev, 'sns')) delta += 4;
    return { delta, teasers };
  },
  'CC7.4': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'guardduty')) {
      delta += 12;
      const stats = ev.find((e) => e.service === 'guardduty' && /FindingsStatistics/.test(e.api));
      if (stats && /"HIGH":\s*[1-9]/.test(stats.raw)) { delta -= 8; teasers.push({ severity: 'HIGH', title: 'Open HIGH-severity GuardDuty findings' }); }
    } else { delta -= 16; teasers.push({ severity: 'HIGH', title: 'No GuardDuty detector found' }); }
    if (hasService(ev, 'securityhub')) delta += 6;
    return { delta, teasers };
  },
  'CC8.1': (ev) => {
    let delta = 0; const teasers: any[] = [];
    if (hasService(ev, 'cloudtrail')) delta += 10;
    if (hasService(ev, 'config')) delta += 8;
    return { delta, teasers };
  },
  'CC9.2': (ev) => {
    let delta = 0; const teasers: any[] = [];
    const rds = pick(ev, 'rds', 'DescribeDBInstances');
    if (rds) {
      if (/<BackupRetentionPeriod>0<\/BackupRetentionPeriod>/.test(rds.raw)) { delta -= 24; teasers.push({ severity: 'CRITICAL', title: 'RDS instance with 0-day backup retention' }); }
      if (/<MultiAZ>false<\/MultiAZ>/.test(rds.raw)) teasers.push({ severity: 'MEDIUM', title: 'RDS instance not Multi-AZ' });
      if (/<MultiAZ>true<\/MultiAZ>/.test(rds.raw)) delta += 8;
    } else { delta -= 6; }
    if (anyMatch(ev, /VersioningConfiguration[\s\S]*Enabled/)) delta += 4;
    return { delta, teasers };
  },
};

// ---------- helpers ----------
function hasService(ev: EvidenceItem[], svc: string): boolean {
  return ev.some((e) => e.service === svc && !/^ERROR:/.test(e.raw));
}
function pick(ev: EvidenceItem[], svc: string, apiPrefix: string): EvidenceItem | undefined {
  return ev.find((e) => e.service === svc && e.api.startsWith(apiPrefix) && !/^ERROR:/.test(e.raw));
}
function anyMatch(ev: EvidenceItem[], rx: RegExp): boolean {
  return ev.some((e) => rx.test(e.raw));
}

// ---------- top-level ----------

const BASE_GAP = 60; // optimistic baseline; rules adjust up/down

export function scoreControlsHeuristic(allEvidence: EvidenceItem[]): ControlAnalysis[] {
  return CONTROLS.map((def: ControlDef): ControlAnalysis => {
    const relevant = evidenceForControl(def.id, allEvidence);
    if (relevant.length === 0) {
      return {
        control_id: def.id,
        name: def.name,
        status: 'inconclusive',
        gap_score: 30,
        freshness_score: 0,
        summary: `No AWS evidence collected for ${def.id}. Either the relevant services aren't in use or the scanner role lacks read permission.`,
        findings: [],
        evidence_ids: [],
        recommendations: [],
        disclaimers: def.disclaimers,
        partially_assessable: def.partiallyAssessable,
        heuristic: true,
        analyzed_at: Date.now(),
      };
    }
    const rule = RULES[def.id];
    const { delta, teasers } = rule ? rule(relevant) : { delta: 0, teasers: [] };
    const gap = Math.max(5, Math.min(100, BASE_GAP + delta));
    const freshness = relevant.length ? 95 : 0; // we just ran the scan
    const status: ControlAnalysis['status'] =
      gap >= 80 ? 'pass' : gap >= 55 ? 'partial' : 'fail';

    return {
      control_id: def.id,
      name: def.name,
      status,
      gap_score: gap,
      freshness_score: freshness,
      summary:
        (def.partiallyAssessable
          ? 'Process/organizational controls are outside AWS API scope — assessment below covers the technical layer only. '
          : '') +
        `${relevant.length} evidence item${relevant.length === 1 ? '' : 's'} reviewed via heuristic rules. Full AI assessment unlocks with the paid report.`,
      findings: teasers.map((t, i) => ({
        id: `h${i + 1}`,
        severity: t.severity,
        title: t.title,
        description: '🔒 Unlock the full report for the detailed finding, evidence trace, and remediation steps.',
      })),
      evidence_ids: relevant.map((e) => e.id),
      recommendations: [],
      disclaimers: def.disclaimers,
      partially_assessable: def.partiallyAssessable,
      heuristic: true,
      analyzed_at: Date.now(),
    };
  });
}

export function rollupHeuristic(controls: ControlAnalysis[]): {
  overall_gap_score: number;
  overall_freshness_score: number;
  overall_readiness: string;
  executive_summary: string;
} {
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const gap = avg(controls.map((c) => c.gap_score));
  const fresh = avg(controls.map((c) => c.freshness_score));
  const fails = controls.filter((c) => c.status === 'fail').length;
  const partials = controls.filter((c) => c.status === 'partial').length;
  let readiness: string;
  if (fails === 0 && partials <= 1) readiness = 'Audit-ready';
  else if (fails <= 1 && partials <= 4) readiness = 'Near-ready';
  else if (fails <= 3) readiness = 'Significant gaps';
  else readiness = 'Not ready';
  return {
    overall_gap_score: gap,
    overall_freshness_score: fresh,
    overall_readiness: readiness,
    executive_summary:
      `Free-tier heuristic assessment across ${controls.length} controls — average gap ${gap}/100. ` +
      `Unlock the AI-driven analysis for finding-level detail, remediation CLI commands, evidence traces, and auditor questions.`,
  };
}
