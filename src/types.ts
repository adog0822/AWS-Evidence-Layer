// Shared types for LoxeAI Pilot v2

export type QueueMessage =
  | { kind: 'analyze_control'; scanId: string; controlId: string; downloadToken: string; totalControls: number }
  | { kind: 'assemble_report'; scanId: string; downloadToken: string };

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ANALYSIS_QUEUE: Queue<QueueMessage>;
  ANTHROPIC_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID?: string;
  ENVIRONMENT: string;
  PRICE_CENTS: string;
  DAILY_SCAN_LIMIT: string;
  ADMIN_TOKEN?: string;
  // LoxeAI scanner principal credentials (set via `wrangler secret put`)
  LOXEAI_AWS_ACCESS_KEY_ID: string;
  LOXEAI_AWS_SECRET_ACCESS_KEY: string;
  LOXEAI_AWS_SESSION_TOKEN?: string;
}

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration?: string;
}

export interface EvidenceItem {
  id: string;
  service: string;
  region: string;
  api: string;
  timestamp: number;
  raw: string;          // truncated raw response
  rawBytes: number;     // original byte size
  truncated: boolean;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  controls: string[];   // SOC2 controls this evidence maps to
  summary?: string;     // short human-readable summary
}

export interface ControlAnalysis {
  control_id: string;          // e.g. "CC6.1"
  name: string;
  status: 'pass' | 'partial' | 'fail' | 'inconclusive' | 'not_assessed';
  gap_score: number;            // 0-100, higher = closer to audit-ready
  freshness_score: number;      // 0-100
  summary: string;
  findings: Finding[];
  evidence_ids: string[];
  recommendations: string[];
  disclaimers?: string[];
  partially_assessable?: boolean;
  analyzed_at?: number;
  audit_risk?: string;          // LOW | MEDIUM | HIGH | CRITICAL  (paid)
  auditor_questions?: string[]; // (paid)
  // Heuristic-only flag for free tier
  heuristic?: boolean;
  // Scan-delta annotation (filled by report.ts when prior scan exists)
  delta?: { previous_gap_score: number; previous_status: string; trend: 'improved' | 'regressed' | 'unchanged' };
}

export interface Finding {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  evidence_id?: string;
  remediation?: string;
}

export interface ScanResults {
  controls: ControlAnalysis[];
  evidence: EvidenceItem[];
  executive_summary?: string;
  overall_readiness?: string;
  overall_gap_score?: number;
  overall_freshness_score?: number;
  critical_actions?: string[];
  strengths?: string[];
}

export interface ServiceConfigEntry {
  enabled: boolean;
  regions: 'global' | 'regional';
  callsPerRegion: number;
}
