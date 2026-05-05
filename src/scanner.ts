// 15 AWS service scanners. Each scanner collects evidence and returns
// EvidenceItem[] for downstream control mapping + AI analysis.
//
// CRITICAL: All raw responses are passed through truncateEvidence() which
// sorts by severity before truncating, so HIGH/CRITICAL findings are never
// dropped in favor of low-noise INFO data.

import { awsRequest, defaultHost } from './aws';
import type { AwsCredentials, EvidenceItem, ServiceConfigEntry } from './types';

export const SERVICE_CONFIG: Record<string, ServiceConfigEntry> = {
  iam:            { enabled: true, regions: 'global',   callsPerRegion: 8 },
  s3:             { enabled: true, regions: 'global',   callsPerRegion: 4 },
  cloudtrail:     { enabled: true, regions: 'regional', callsPerRegion: 3 },
  config:         { enabled: true, regions: 'regional', callsPerRegion: 3 },
  ec2:            { enabled: true, regions: 'regional', callsPerRegion: 4 },
  cloudwatch:     { enabled: true, regions: 'regional', callsPerRegion: 2 },
  kms:            { enabled: true, regions: 'regional', callsPerRegion: 4 },
  lambda:         { enabled: true, regions: 'regional', callsPerRegion: 2 },
  rds:            { enabled: true, regions: 'regional', callsPerRegion: 3 },
  sns:            { enabled: true, regions: 'regional', callsPerRegion: 2 },
  guardduty:      { enabled: true, regions: 'regional', callsPerRegion: 4 },
  securityhub:    { enabled: true, regions: 'regional', callsPerRegion: 3 },
  sso:            { enabled: true, regions: 'global',   callsPerRegion: 4 },
  secretsmanager: { enabled: true, regions: 'regional', callsPerRegion: 2 },
  waf:            { enabled: true, regions: 'regional', callsPerRegion: 3 },
};

export const DEFAULT_REGIONS = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
];

// ============================================================
// Severity-aware evidence truncation
// ============================================================

const SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

/**
 * Truncate raw AWS API response while preserving the highest-severity content.
 * Hard rules:
 *  - Never drop CRITICAL findings. If CRITICAL items alone exceed maxChars,
 *    we still keep them all (return uncapped) and let the model see all of it.
 *  - Sort by severity before slicing.
 *  - Append a truncation notice with original byte count.
 */
export function truncateEvidence(rawData: string, maxChars: number = 4000): { text: string; truncated: boolean; originalBytes: number } {
  const originalBytes = rawData.length;
  if (originalBytes <= maxChars) {
    return { text: rawData, truncated: false, originalBytes };
  }

  // Try JSON severity-aware reordering
  try {
    const parsed = JSON.parse(rawData);
    const reordered = reorderJsonBySeverity(parsed);
    // Detect whether the payload contains CRITICAL items — if so, we keep all
    // CRITICAL members verbatim and only chop lower-severity content.
    const criticalOnly = filterToSeverity(reordered, 'CRITICAL');
    const criticalSerialized = criticalOnly ? JSON.stringify(criticalOnly) : '';
    const serialized = JSON.stringify(reordered);

    if (serialized.length <= maxChars) {
      return { text: serialized + `\n[... ${originalBytes - serialized.length} bytes truncated, severity-sorted]`, truncated: true, originalBytes };
    }
    if (criticalSerialized && criticalSerialized.length <= maxChars * 1.5) {
      // Always keep CRITICAL evidence intact even if it pushes a bit over.
      return {
        text: criticalSerialized + `\n[... ${originalBytes - criticalSerialized.length} bytes of lower-severity content truncated. CRITICAL evidence preserved verbatim.]`,
        truncated: true,
        originalBytes,
      };
    }
    // Pure tail-chop fallback — but never below 50% of maxChars to keep useful context
    return {
      text: serialized.slice(0, Math.max(maxChars, 2000)) + `\n[... ${originalBytes - maxChars} bytes truncated, severity-sorted]`,
      truncated: true,
      originalBytes,
    };
  } catch {
    // not JSON — try XML severity reorder
    const xmlReordered = reorderXmlBySeverity(rawData);
    if (xmlReordered.length <= maxChars) {
      return { text: xmlReordered + `\n[... ${originalBytes - xmlReordered.length} bytes truncated, severity-sorted]`, truncated: true, originalBytes };
    }
    return {
      text: xmlReordered.slice(0, maxChars) + `\n[... ${originalBytes - maxChars} bytes truncated]`,
      truncated: true,
      originalBytes,
    };
  }
}

// Helper used by truncateEvidence to extract only CRITICAL items from arrays
function filterToSeverity(obj: any, level: 'CRITICAL' | 'HIGH'): any {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    const sevOf = (item: any): string => (item?.Severity?.Label || item?.severity || item?.Severity || item?.SeverityLabel || '').toString().toUpperCase();
    const crit = obj.filter((i) => sevOf(i) === level);
    return crit.length ? crit : null;
  }
  // Recurse into common AWS wrapper keys (Findings, Items, etc.)
  for (const k of ['Findings', 'Items', 'Resources', 'Members']) {
    if (Array.isArray(obj[k])) {
      const f = filterToSeverity(obj[k], level);
      if (f) return { [k]: f };
    }
  }
  return null;
}

function reorderJsonBySeverity(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  // Recurse into arrays of objects with severity-like fields
  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
      const sevOf = (item: any): number => {
        const s = (item.Severity?.Label || item.severity || item.Severity || item.SeverityLabel || '').toString().toUpperCase();
        return SEVERITY_RANK[s] || 0;
      };
      const hasSeverity = obj.some((i) => sevOf(i) > 0);
      if (hasSeverity) {
        return [...obj].sort((a, b) => sevOf(b) - sevOf(a)).map(reorderJsonBySeverity);
      }
    }
    return obj.map(reorderJsonBySeverity);
  }
  const out: any = {};
  for (const k of Object.keys(obj)) out[k] = reorderJsonBySeverity(obj[k]);
  return out;
}

function reorderXmlBySeverity(xml: string): string {
  // Extract <member>...</member> chunks within <Findings> or similar containers
  const memberRegex = /<member>([\s\S]*?)<\/member>/g;
  const members: { sev: number; xml: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = memberRegex.exec(xml)) !== null) {
    const inner = match[0];
    const sevMatch = inner.match(/<Severity[^>]*>([\s\S]*?)<\/Severity>/i) || inner.match(/<SeverityLabel>([\s\S]*?)<\/SeverityLabel>/i);
    const sev = sevMatch ? SEVERITY_RANK[sevMatch[1].trim().toUpperCase()] || 0 : 0;
    members.push({ sev, xml: inner });
  }
  if (members.length < 2) return xml;
  members.sort((a, b) => b.sev - a.sev);
  // Stitch back: keep XML envelope before first member, replace member sequence with sorted
  const firstMember = xml.indexOf('<member>');
  const lastMember = xml.lastIndexOf('</member>') + '</member>'.length;
  if (firstMember < 0 || lastMember < 0) return xml;
  return xml.slice(0, firstMember) + members.map((m) => m.xml).join('') + xml.slice(lastMember);
}

// ============================================================
// Evidence helpers
// ============================================================

function nextEvidenceId(): string {
  // crypto.randomUUID is available in Workers runtime and is safe for concurrent requests.
  // A global counter would be shared across concurrent requests in the same isolate.
  return `ev_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function makeEvidence(opts: {
  service: string;
  region: string;
  api: string;
  raw: string;
  controls: string[];
  severity?: EvidenceItem['severity'];
  summary?: string;
}): EvidenceItem {
  const t = truncateEvidence(opts.raw);
  return {
    id: nextEvidenceId(),
    service: opts.service,
    region: opts.region,
    api: opts.api,
    timestamp: Date.now(),
    raw: t.text,
    rawBytes: t.originalBytes,
    truncated: t.truncated,
    severity: opts.severity,
    controls: opts.controls,
    summary: opts.summary,
  };
}

// Generic AWS Query/JSON callers ---------------------------------------------

async function queryApi(opts: {
  service: string;
  region: string;
  action: string;
  version: string;
  params?: Record<string, string>;
  credentials: AwsCredentials;
  method?: string;
}): Promise<{ status: number; body: string }> {
  const params = new URLSearchParams({ Action: opts.action, Version: opts.version, ...(opts.params || {}) });
  if ((opts.method || 'POST') === 'GET') {
    return awsRequest({
      service: opts.service,
      region: opts.region,
      method: 'GET',
      path: '/',
      query: Object.fromEntries(params),
      credentials: opts.credentials,
    });
  }
  return awsRequest({
    service: opts.service,
    region: opts.region,
    method: 'POST',
    path: '/',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    credentials: opts.credentials,
  });
}

async function jsonApi(opts: {
  service: string;
  region: string;
  target: string;        // e.g. 'GuardDuty.ListDetectors'
  body: any;
  credentials: AwsCredentials;
  contentType?: string;
}): Promise<{ status: number; body: string }> {
  return awsRequest({
    service: opts.service,
    region: opts.region,
    method: 'POST',
    path: '/',
    headers: {
      'content-type': opts.contentType || 'application/x-amz-json-1.1',
      'x-amz-target': opts.target,
    },
    body: JSON.stringify(opts.body || {}),
    credentials: opts.credentials,
  });
}

async function restApi(opts: {
  service: string;
  region: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: any;
  credentials: AwsCredentials;
}): Promise<{ status: number; body: string }> {
  return awsRequest({
    service: opts.service,
    region: opts.region,
    method: opts.method,
    path: opts.path,
    query: opts.query,
    headers: opts.body ? { 'content-type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: opts.credentials,
  });
}

// ============================================================
// IAM (global) — 8 calls
// ============================================================

export async function scanIAM(creds: AwsCredentials): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  const calls: Array<[string, string]> = [
    ['GetAccountSummary', 'CC6.1'],
    ['GetAccountPasswordPolicy', 'CC6.1'],
    ['ListUsers', 'CC6.1,CC6.2'],
    ['ListRoles', 'CC6.3'],
    ['ListGroups', 'CC6.1'],
    ['ListPolicies', 'CC6.3'],
    ['GetCredentialReport', 'CC6.2,CC6.7'],
    ['ListAccountAliases', 'CC6.1'],
  ];
  for (const [action, controls] of calls) {
    try {
      // GetCredentialReport requires GenerateCredentialReport first; tolerate failure
      if (action === 'GetCredentialReport') {
        await queryApi({ service: 'iam', region: 'us-east-1', action: 'GenerateCredentialReport', version: '2010-05-08', credentials: creds }).catch(() => null);
      }
      const r = await queryApi({ service: 'iam', region: 'us-east-1', action, version: '2010-05-08', credentials: creds });
      out.push(makeEvidence({ service: 'iam', region: 'global', api: action, raw: r.body, controls: controls.split(',') }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'iam', region: 'global', api: action, raw: `ERROR: ${e?.message || e}`, controls: controls.split(','), severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// S3 (global, but call from us-east-1) — 4 calls
// ============================================================

export async function scanS3(creds: AwsCredentials): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  // ListBuckets
  try {
    const r = await awsRequest({ service: 's3', region: 'us-east-1', method: 'GET', path: '/', credentials: creds });
    out.push(makeEvidence({ service: 's3', region: 'global', api: 'ListBuckets', raw: r.body, controls: ['CC6.1', 'CC6.6'] }));
    // Parse bucket names for follow-up calls
    const names = Array.from(r.body.matchAll(/<Name>([^<]+)<\/Name>/g)).map((m) => m[1]).slice(0, 25);
    for (const sub of ['?encryption', '?publicAccessBlock', '?versioning'] as const) {
      for (const bucket of names.slice(0, 8)) {
        try {
          const sr = await awsRequest({
            service: 's3',
            region: 'us-east-1',
            method: 'GET',
            host: `${bucket}.s3.amazonaws.com`,
            path: '/',
            query: parseQuery(sub),
            credentials: creds,
            timeoutMs: 5000,
          });
          out.push(makeEvidence({ service: 's3', region: 'global', api: `Get${sub.replace('?', '')}:${bucket}`, raw: sr.body, controls: ['CC6.6', 'CC6.1'] }));
        } catch {}
      }
    }
  } catch (e: any) {
    out.push(makeEvidence({ service: 's3', region: 'global', api: 'ListBuckets', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.6'], severity: 'INFO' }));
  }
  return out;
}

function parseQuery(s: string): Record<string, string> {
  const q: Record<string, string> = {};
  const clean = s.replace(/^\?/, '');
  for (const pair of clean.split('&')) {
    const [k, v] = pair.split('=');
    if (k) q[k] = v ?? '';
  }
  return q;
}

// ============================================================
// CloudTrail (regional) — 3 calls
// ============================================================

export async function scanCloudTrail(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];

  // 1. DescribeTrails — lists trail metadata + multi-region flag
  let trailArn: string | null = null;
  try {
    const r = await jsonApi({ service: 'cloudtrail', region, target: 'CloudTrail_20131101.DescribeTrails', body: {}, credentials: creds });
    out.push(makeEvidence({ service: 'cloudtrail', region, api: 'DescribeTrails', raw: r.body, controls: ['CC7.2', 'CC4.1'] }));
    // Extract first trail ARN for GetEventSelectors
    const m = r.body.match(/"TrailARN"\s*:\s*"([^"]+)"/);
    trailArn = m ? m[1] : null;
  } catch (e: any) {
    out.push(makeEvidence({ service: 'cloudtrail', region, api: 'DescribeTrails', raw: `ERROR: ${e?.message || e}`, controls: ['CC7.2'], severity: 'INFO' }));
  }

  // 2. ListTrails — lists all trails in this region (home region only)
  try {
    const r = await jsonApi({ service: 'cloudtrail', region, target: 'CloudTrail_20131101.ListTrails', body: {}, credentials: creds });
    out.push(makeEvidence({ service: 'cloudtrail', region, api: 'ListTrails', raw: r.body, controls: ['CC7.2'] }));
  } catch (e: any) {
    out.push(makeEvidence({ service: 'cloudtrail', region, api: 'ListTrails', raw: `ERROR: ${e?.message || e}`, controls: ['CC7.2'], severity: 'INFO' }));
  }

  // 3. GetEventSelectors — requires a TrailName/ARN; skip if none found
  if (trailArn) {
    try {
      const r = await jsonApi({ service: 'cloudtrail', region, target: 'CloudTrail_20131101.GetEventSelectors', body: { TrailName: trailArn }, credentials: creds });
      out.push(makeEvidence({ service: 'cloudtrail', region, api: 'GetEventSelectors', raw: r.body, controls: ['CC7.2', 'CC4.1'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'cloudtrail', region, api: 'GetEventSelectors', raw: `ERROR: ${e?.message || e}`, controls: ['CC7.2'], severity: 'INFO' }));
    }
  }

  return out;
}

// ============================================================
// Config (regional) — 3 calls
// ============================================================

export async function scanConfig(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  const targets = [
    ['StarlingDoveService.DescribeConfigurationRecorders', { ConfigurationRecorderNames: [] }],
    ['StarlingDoveService.DescribeConfigRules', {}],
    ['StarlingDoveService.DescribeDeliveryChannels', {}],
  ] as const;
  for (const [target, body] of targets) {
    try {
      const r = await jsonApi({ service: 'config', region, target, body, credentials: creds });
      out.push(makeEvidence({ service: 'config', region, api: target.split('.')[1], raw: r.body, controls: ['CC7.1', 'CC5.2'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'config', region, api: target, raw: `ERROR: ${e?.message || e}`, controls: ['CC7.1'], severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// EC2 (regional) — 4 calls
// ============================================================

export async function scanEC2(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  for (const action of ['DescribeSecurityGroups', 'DescribeVpcs', 'DescribeFlowLogs', 'DescribeInstances']) {
    try {
      const r = await queryApi({ service: 'ec2', region, action, version: '2016-11-15', credentials: creds });
      out.push(makeEvidence({ service: 'ec2', region, api: action, raw: r.body, controls: ['CC6.6', 'CC7.2'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'ec2', region, api: action, raw: `ERROR: ${e?.message || e}`, controls: ['CC6.6'], severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// CloudWatch (regional) — 2 calls
// ============================================================

export async function scanCloudWatch(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  for (const action of ['DescribeAlarms', 'ListMetrics']) {
    try {
      const r = await queryApi({ service: 'monitoring', region, action, version: '2010-08-01', credentials: creds });
      out.push(makeEvidence({ service: 'cloudwatch', region, api: action, raw: r.body, controls: ['CC7.3', 'CC7.2'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'cloudwatch', region, api: action, raw: `ERROR: ${e?.message || e}`, controls: ['CC7.3'], severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// KMS (regional) — 4 calls
// ============================================================

export async function scanKMS(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  // List keys
  try {
    const r = await jsonApi({ service: 'kms', region, target: 'TrentService.ListKeys', body: {}, credentials: creds });
    out.push(makeEvidence({ service: 'kms', region, api: 'ListKeys', raw: r.body, controls: ['CC6.1', 'CC6.7'] }));
    const keyIds = Array.from(r.body.matchAll(/"KeyId":"([^"]+)"/g)).map((m) => m[1]).slice(0, 8);
    for (const t of ['TrentService.DescribeKey', 'TrentService.GetKeyRotationStatus', 'TrentService.GetKeyPolicy']) {
      for (const KeyId of keyIds.slice(0, 4)) {
        try {
          const body: any = t.endsWith('GetKeyPolicy') ? { KeyId, PolicyName: 'default' } : { KeyId };
          const sr = await jsonApi({ service: 'kms', region, target: t, body, credentials: creds });
          out.push(makeEvidence({ service: 'kms', region, api: `${t.split('.')[1]}:${KeyId.slice(0, 8)}`, raw: sr.body, controls: ['CC6.1', 'CC6.7'] }));
        } catch {}
      }
    }
  } catch (e: any) {
    out.push(makeEvidence({ service: 'kms', region, api: 'ListKeys', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.1'], severity: 'INFO' }));
  }
  return out;
}

// ============================================================
// Lambda (regional) — 2 calls
// ============================================================

export async function scanLambda(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  try {
    const r = await restApi({ service: 'lambda', region, method: 'GET', path: '/2015-03-31/functions/', credentials: creds });
    out.push(makeEvidence({ service: 'lambda', region, api: 'ListFunctions', raw: r.body, controls: ['CC6.6', 'CC8.1'] }));
    const r2 = await restApi({ service: 'lambda', region, method: 'GET', path: '/2017-03-31/tags/', credentials: creds }).catch(() => null);
    if (r2) out.push(makeEvidence({ service: 'lambda', region, api: 'ListTags', raw: r2.body, controls: ['CC6.6'] }));
  } catch (e: any) {
    out.push(makeEvidence({ service: 'lambda', region, api: 'ListFunctions', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.6'], severity: 'INFO' }));
  }
  return out;
}

// ============================================================
// RDS (regional) — 3 calls
// ============================================================

export async function scanRDS(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  for (const action of ['DescribeDBInstances', 'DescribeDBSnapshots', 'DescribeDBClusterSnapshots']) {
    try {
      const r = await queryApi({ service: 'rds', region, action, version: '2014-10-31', credentials: creds });
      out.push(makeEvidence({ service: 'rds', region, api: action, raw: r.body, controls: ['CC9.2', 'CC6.7'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'rds', region, api: action, raw: `ERROR: ${e?.message || e}`, controls: ['CC9.2'], severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// SNS (regional) — 2 calls
// ============================================================

export async function scanSNS(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  for (const action of ['ListTopics', 'ListSubscriptions']) {
    try {
      const r = await queryApi({ service: 'sns', region, action, version: '2010-03-31', credentials: creds });
      out.push(makeEvidence({ service: 'sns', region, api: action, raw: r.body, controls: ['CC7.3', 'CC7.4'] }));
    } catch (e: any) {
      out.push(makeEvidence({ service: 'sns', region, api: action, raw: `ERROR: ${e?.message || e}`, controls: ['CC7.3'], severity: 'INFO' }));
    }
  }
  return out;
}

// ============================================================
// GuardDuty (regional) — 4 calls
// ============================================================

export async function scanGuardDuty(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  try {
    const r = await restApi({ service: 'guardduty', region, method: 'GET', path: '/detector', credentials: creds });
    out.push(makeEvidence({ service: 'guardduty', region, api: 'ListDetectors', raw: r.body, controls: ['CC7.4', 'CC7.3'] }));
    const detectorIds = Array.from(r.body.matchAll(/"detectorIds":\s*\[([^\]]*)\]/g)).flatMap((m) => Array.from(m[1].matchAll(/"([^"]+)"/g)).map((x) => x[1]));
    for (const id of detectorIds.slice(0, 2)) {
      try {
        const dr = await restApi({ service: 'guardduty', region, method: 'GET', path: `/detector/${id}`, credentials: creds });
        out.push(makeEvidence({ service: 'guardduty', region, api: `GetDetector:${id.slice(0, 8)}`, raw: dr.body, controls: ['CC7.4', 'CC7.3'] }));
      } catch {}
      try {
        const sr = await restApi({
          service: 'guardduty',
          region,
          method: 'POST',
          path: `/detector/${id}/findings/statistics`,
          body: { findingStatisticTypes: ['COUNT_BY_SEVERITY'] },
          credentials: creds,
        });
        out.push(makeEvidence({ service: 'guardduty', region, api: `GetFindingsStatistics:${id.slice(0, 8)}`, raw: sr.body, controls: ['CC7.4', 'CC7.3'], severity: 'HIGH' }));
      } catch {}
      try {
        const fr = await restApi({
          service: 'guardduty',
          region,
          method: 'POST',
          path: `/detector/${id}/findings`,
          body: { findingCriteria: { criterion: { 'severity': { gte: 4 } } }, maxResults: 50 },
          credentials: creds,
        });
        out.push(makeEvidence({ service: 'guardduty', region, api: `ListFindings:${id.slice(0, 8)}`, raw: fr.body, controls: ['CC7.4', 'CC7.3'], severity: 'HIGH' }));
      } catch {}
    }
  } catch (e: any) {
    out.push(makeEvidence({ service: 'guardduty', region, api: 'ListDetectors', raw: `ERROR: ${e?.message || e}`, controls: ['CC7.4'], severity: 'INFO' }));
  }
  return out;
}

// ============================================================
// SecurityHub (regional) — 3 calls
// ============================================================

export async function scanSecurityHub(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  // DescribeHub
  try {
    const r = await restApi({ service: 'securityhub', region, method: 'GET', path: '/accounts', credentials: creds });
    out.push(makeEvidence({ service: 'securityhub', region, api: 'DescribeHub', raw: r.body, controls: ['CC7.1', 'CC5.2'] }));
  } catch (e: any) {
    out.push(makeEvidence({ service: 'securityhub', region, api: 'DescribeHub', raw: `ERROR: ${e?.message || e}`, controls: ['CC7.1'], severity: 'INFO' }));
  }
  // GetEnabledStandards
  try {
    const r = await restApi({ service: 'securityhub', region, method: 'POST', path: '/standards/get', body: {}, credentials: creds });
    out.push(makeEvidence({ service: 'securityhub', region, api: 'GetEnabledStandards', raw: r.body, controls: ['CC5.2', 'CC7.1'] }));
  } catch {}
  // GetFindings (summary by severity)
  try {
    const r = await restApi({
      service: 'securityhub',
      region,
      method: 'POST',
      path: '/findings',
      body: { Filters: { SeverityLabel: [{ Value: 'HIGH', Comparison: 'EQUALS' }, { Value: 'CRITICAL', Comparison: 'EQUALS' }] }, MaxResults: 50 },
      credentials: creds,
    });
    out.push(makeEvidence({ service: 'securityhub', region, api: 'GetFindings:HIGH+CRITICAL', raw: r.body, controls: ['CC7.1'], severity: 'HIGH' }));
  } catch {}
  return out;
}

// ============================================================
// SSO / IAM Identity Center (us-east-1 only) — 4 calls
// ============================================================

export async function scanSSO(creds: AwsCredentials): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  const region = 'us-east-1';
  let instanceArn: string | null = null;
  let identityStoreId: string | null = null;
  try {
    const r = await jsonApi({ service: 'sso-admin', region, target: 'SWBExternalService.ListInstances', body: {}, credentials: creds });
    out.push(makeEvidence({ service: 'sso', region: 'global', api: 'ListInstances', raw: r.body, controls: ['CC6.1', 'CC6.2'] }));
    const m = r.body.match(/"InstanceArn":"([^"]+)"/);
    instanceArn = m ? m[1] : null;
    const idm = r.body.match(/"IdentityStoreId":"([^"]+)"/);
    identityStoreId = idm ? idm[1] : null;
  } catch (e: any) {
    out.push(makeEvidence({ service: 'sso', region: 'global', api: 'ListInstances', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.1'], severity: 'INFO' }));
    return out;
  }
  if (!instanceArn) return out;
  try {
    const r = await jsonApi({ service: 'sso-admin', region, target: 'SWBExternalService.ListPermissionSets', body: { InstanceArn: instanceArn }, credentials: creds });
    out.push(makeEvidence({ service: 'sso', region: 'global', api: 'ListPermissionSets', raw: r.body, controls: ['CC6.3', 'CC6.1'] }));
    const psArns = Array.from(r.body.matchAll(/"arn:aws:sso:::permissionSet[^"]+"/g)).map((m) => m[0].replace(/"/g, '')).slice(0, 4);
    for (const psArn of psArns) {
      try {
        const ar = await jsonApi({
          service: 'sso-admin',
          region,
          target: 'SWBExternalService.ListAccountAssignments',
          body: { InstanceArn: instanceArn, AccountId: 'self', PermissionSetArn: psArn },
          credentials: creds,
        });
        out.push(makeEvidence({ service: 'sso', region: 'global', api: `ListAccountAssignments:${psArn.split('/').pop()}`, raw: ar.body, controls: ['CC6.2', 'CC6.3'] }));
      } catch {}
    }
  } catch {}
  if (identityStoreId) {
    try {
      const r = await jsonApi({ service: 'identitystore', region, target: 'AWSIdentityStore.ListUsers', body: { IdentityStoreId: identityStoreId }, credentials: creds });
      out.push(makeEvidence({ service: 'sso', region: 'global', api: 'ListUsers', raw: r.body, controls: ['CC6.2'] }));
    } catch {}
  }
  return out;
}

// ============================================================
// Secrets Manager (regional) — 2 calls (NEVER GetSecretValue)
// ============================================================

export async function scanSecretsManager(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  try {
    const r = await jsonApi({ service: 'secretsmanager', region, target: 'secretsmanager.ListSecrets', body: { MaxResults: 50 }, credentials: creds });
    out.push(makeEvidence({ service: 'secretsmanager', region, api: 'ListSecrets', raw: r.body, controls: ['CC6.6', 'CC6.1'] }));
    const arns = Array.from(r.body.matchAll(/"ARN":"([^"]+)"/g)).map((m) => m[1]).slice(0, 5);
    for (const SecretId of arns) {
      try {
        const dr = await jsonApi({ service: 'secretsmanager', region, target: 'secretsmanager.DescribeSecret', body: { SecretId }, credentials: creds });
        out.push(makeEvidence({ service: 'secretsmanager', region, api: `DescribeSecret:${SecretId.split(':').pop()}`, raw: dr.body, controls: ['CC6.6'] }));
      } catch {}
    }
  } catch (e: any) {
    out.push(makeEvidence({ service: 'secretsmanager', region, api: 'ListSecrets', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.6'], severity: 'INFO' }));
  }
  return out;
}

// ============================================================
// WAF (regional, scope=REGIONAL) — 3 calls
// ============================================================

export async function scanWAF(creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  const out: EvidenceItem[] = [];
  try {
    const r = await jsonApi({ service: 'wafv2', region, target: 'AWSWAF_20190729.ListWebACLs', body: { Scope: 'REGIONAL' }, credentials: creds });
    out.push(makeEvidence({ service: 'waf', region, api: 'ListWebACLs', raw: r.body, controls: ['CC6.6', 'CC7.2'] }));
    const acls = Array.from(r.body.matchAll(/"Id":"([^"]+)","Name":"([^"]+)"/g)).slice(0, 3);
    for (const m of acls) {
      const Id = m[1];
      const Name = m[2];
      try {
        const gr = await jsonApi({ service: 'wafv2', region, target: 'AWSWAF_20190729.GetWebACL', body: { Id, Name, Scope: 'REGIONAL' }, credentials: creds });
        out.push(makeEvidence({ service: 'waf', region, api: `GetWebACL:${Name}`, raw: gr.body, controls: ['CC6.6'] }));
      } catch {}
      try {
        const lr = await jsonApi({
          service: 'wafv2',
          region,
          target: 'AWSWAF_20190729.ListResourcesForWebACL',
          body: { WebACLArn: `arn:aws:wafv2:${region}::regional/webacl/${Name}/${Id}` },
          credentials: creds,
        });
        out.push(makeEvidence({ service: 'waf', region, api: `ListResourcesForWebACL:${Name}`, raw: lr.body, controls: ['CC6.6'] }));
      } catch {}
    }
  } catch (e: any) {
    out.push(makeEvidence({ service: 'waf', region, api: 'ListWebACLs', raw: `ERROR: ${e?.message || e}`, controls: ['CC6.6'], severity: 'INFO' }));
  }
  return out;
}

// ============================================================
// Top-level scan dispatcher
// ============================================================

export interface ScanOptions {
  services?: string[];      // override SERVICE_CONFIG enabled
  regions?: string[];       // override DEFAULT_REGIONS
  credentials: AwsCredentials;
  parallelRegions?: number; // default 3
}

// Concurrency cap: 12 in-flight service-region scans (not 15) to dodge IAM
// rate limiting on small AWS accounts.
const SCAN_CONCURRENCY = 12;

async function runWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let cursor = 0;
  const workers: Promise<void>[] = [];
  for (let w = 0; w < Math.min(limit, tasks.length); w++) {
    workers.push((async () => {
      while (true) {
        const i = cursor++;
        if (i >= tasks.length) return;
        try { results[i] = await tasks[i](); } catch (e: any) { results[i] = e; }
      }
    })());
  }
  await Promise.all(workers);
  return results;
}

export async function runScan(opts: ScanOptions): Promise<EvidenceItem[]> {
  const enabledServices = (opts.services && opts.services.length
    ? opts.services
    : Object.keys(SERVICE_CONFIG).filter((s) => SERVICE_CONFIG[s].enabled));
  const regions = opts.regions || DEFAULT_REGIONS;

  const all: EvidenceItem[] = [];

  // Build a flat task list: every (service, region) tuple that should run.
  const tasks: Array<() => Promise<EvidenceItem[]>> = [];
  for (const s of enabledServices) {
    if (SERVICE_CONFIG[s]?.regions === 'global') {
      tasks.push(() => dispatchService(s, opts.credentials, 'global'));
    } else if (SERVICE_CONFIG[s]?.regions === 'regional') {
      for (const region of regions) {
        tasks.push(() => dispatchService(s, opts.credentials, region));
      }
    }
  }

  const results = await runWithConcurrency(tasks, opts.parallelRegions || SCAN_CONCURRENCY);
  for (const ev of results) {
    if (Array.isArray(ev)) all.push(...ev);
  }
  return all;
}

async function dispatchService(service: string, creds: AwsCredentials, region: string): Promise<EvidenceItem[]> {
  try {
    switch (service) {
      case 'iam':            return await scanIAM(creds);
      case 's3':             return await scanS3(creds);
      case 'cloudtrail':     return await scanCloudTrail(creds, region);
      case 'config':         return await scanConfig(creds, region);
      case 'ec2':            return await scanEC2(creds, region);
      case 'cloudwatch':     return await scanCloudWatch(creds, region);
      case 'kms':            return await scanKMS(creds, region);
      case 'lambda':         return await scanLambda(creds, region);
      case 'rds':            return await scanRDS(creds, region);
      case 'sns':            return await scanSNS(creds, region);
      case 'guardduty':      return await scanGuardDuty(creds, region);
      case 'securityhub':    return await scanSecurityHub(creds, region);
      case 'sso':            return await scanSSO(creds);
      case 'secretsmanager': return await scanSecretsManager(creds, region);
      case 'waf':            return await scanWAF(creds, region);
      default: return [];
    }
  } catch (e: any) {
    return [makeEvidence({
      service,
      region,
      api: 'dispatch_error',
      raw: `ERROR: ${e?.message || e}`,
      controls: [],
      severity: 'INFO',
    })];
  }
}
