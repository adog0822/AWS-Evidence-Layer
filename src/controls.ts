// SOC 2 Trust Services Criteria — 12 controls assessed by LoxeAI Pilot v2.
// Prompt structure for Claude analysis is intentionally a stub here — the
// final per-control prompts will be filled in after the spec review.

import type { ControlAnalysis, EvidenceItem } from './types';

export interface ControlDef {
  id: string;
  name: string;
  category: 'CC5' | 'CC6' | 'CC7' | 'CC8' | 'CC9';
  description: string;
  // Which evidence services/APIs are most relevant
  evidenceFilters: { services?: string[]; apis?: string[] };
  // Disclaimers attached to all analyses for this control
  disclaimers?: string[];
  // True if AWS APIs alone can't fully assess the control
  partiallyAssessable?: boolean;
}

export const CONTROLS: ControlDef[] = [
  {
    id: 'CC5.2',
    name: 'Technology Controls (Selection & Development)',
    category: 'CC5',
    description: 'Entity selects and develops control activities, including technology controls, that contribute to the mitigation of risks to acceptable levels.',
    evidenceFilters: { services: ['config', 'securityhub', 'guardduty'] },
    partiallyAssessable: true,
    disclaimers: [
      'Only the technical-control layer is assessed via AWS APIs (Config rules, SecurityHub standards, GuardDuty enablement). Process-level control selection, change management governance, and human-in-the-loop control development are out of technical scope and require auditor review.',
    ],
  },
  {
    id: 'CC6.1',
    name: 'Logical Access — Restricted Access',
    category: 'CC6',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
    evidenceFilters: { services: ['iam', 's3', 'kms', 'sso'] },
  },
  {
    id: 'CC6.2',
    name: 'System Access Provisioning',
    category: 'CC6',
    description: 'Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users whose access is administered by the entity.',
    evidenceFilters: { services: ['iam', 'sso'] },
    partiallyAssessable: true,
    disclaimers: [
      'AWS APIs surface IAM/SSO user creation timestamps, key lifecycle, and assignment metadata. The provisioning approval workflow, identity verification, and registration policy are process-level and outside the technical scope of this scan.',
    ],
  },
  {
    id: 'CC6.3',
    name: 'Role-Based Access & Segregation of Duties',
    category: 'CC6',
    description: 'The entity authorizes, modifies, or removes access based on roles, responsibilities, or system design and the principle of least privilege.',
    evidenceFilters: { services: ['iam', 'sso'] },
  },
  {
    id: 'CC6.6',
    name: 'External Threat Boundary',
    category: 'CC6',
    description: 'The entity implements logical access security measures to protect against threats from sources outside its system boundaries.',
    evidenceFilters: { services: ['s3', 'ec2', 'waf', 'lambda', 'secretsmanager'] },
  },
  {
    id: 'CC6.7',
    name: 'Restricted Data Movement & Encryption',
    category: 'CC6',
    description: 'The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes, and protects it during transmission, movement, or removal.',
    evidenceFilters: { services: ['kms', 'rds', 's3', 'iam'] },
  },
  {
    id: 'CC7.1',
    name: 'Configuration & Vulnerability Management',
    category: 'CC7',
    description: 'To meet its objectives, the entity uses detection and monitoring procedures to identify (1) changes to configurations that result in the introduction of new vulnerabilities, and (2) susceptibilities to newly discovered vulnerabilities.',
    evidenceFilters: { services: ['config', 'securityhub'] },
  },
  {
    id: 'CC7.2',
    name: 'Security Event Monitoring',
    category: 'CC7',
    description: 'The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors affecting the entity\'s ability to meet its objectives.',
    evidenceFilters: { services: ['cloudtrail', 'cloudwatch', 'ec2', 'waf'] },
  },
  {
    id: 'CC7.3',
    name: 'Anomaly Detection',
    category: 'CC7',
    description: 'The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives (security incidents) and, if so, takes actions to prevent or address such failures.',
    evidenceFilters: { services: ['cloudwatch', 'guardduty', 'sns'] },
    disclaimers: [
      'Anomaly detection coverage is inferred from CloudWatch alarms and GuardDuty findings — the human triage and incident classification process is out of technical scope.',
    ],
  },
  {
    id: 'CC7.4',
    name: 'Incident Response',
    category: 'CC7',
    description: 'The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents, as appropriate.',
    evidenceFilters: { services: ['guardduty', 'securityhub', 'sns'] },
  },
  {
    id: 'CC8.1',
    name: 'Change Management',
    category: 'CC8',
    description: 'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives.',
    evidenceFilters: { services: ['cloudtrail', 'config', 'lambda'] },
  },
  {
    id: 'CC9.2',
    name: 'Business Continuity & Recovery — AWS Layer Only',
    category: 'CC9',
    description: 'The entity assesses and manages risks associated with vendors and business partners; for SOC 2 BCDR purposes we evaluate AWS-layer recovery posture only.',
    evidenceFilters: { services: ['rds', 's3'] },
    partiallyAssessable: true,
    disclaimers: [
      'This scan evaluates only the AWS technical recovery posture: RDS automated backup retention, snapshot configurations, multi-AZ deployments, and S3 versioning.',
      'Recovery procedures, RTO/RPO testing, runbook validation, tabletop exercises, and BCDR governance are outside the technical scope of this assessment and must be evaluated separately by your auditor.',
    ],
  },
];

export function getControl(id: string): ControlDef | undefined {
  return CONTROLS.find((c) => c.id === id);
}

export function evidenceForControl(controlId: string, all: EvidenceItem[]): EvidenceItem[] {
  const def = getControl(controlId);
  if (!def) return [];
  return all.filter((ev) => {
    if (ev.controls.includes(controlId)) return true;
    if (def.evidenceFilters.services?.includes(ev.service)) return true;
    if (def.evidenceFilters.apis?.some((api) => ev.api.startsWith(api))) return true;
    return false;
  });
}

// Empty stub control analysis — returned when a control has no evidence yet.
export function emptyAnalysis(id: string, name: string): ControlAnalysis {
  return {
    control_id: id,
    name,
    status: 'not_assessed',
    gap_score: 0,
    freshness_score: 0,
    summary: 'Not yet analyzed.',
    findings: [],
    evidence_ids: [],
    recommendations: [],
  };
}
