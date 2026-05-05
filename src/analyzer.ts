// Per-control Claude analysis. Triggered ONLY after Stripe payment — see
// index.ts → handleStripeWebhook + handlePostPurchaseAnalysis.
// Free-tier scoring is rule-based (see scoring.ts / scoreControlHeuristic).

import type { ControlAnalysis, EvidenceItem, Env, Finding } from './types';
import { CONTROLS, getControl, evidenceForControl, ControlDef } from './controls';

const CLAUDE_MODEL = 'claude-sonnet-4-6';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ============================================================
// Prompt builders (final spec)
// ============================================================

function buildPrompt(def: ControlDef, evidence: EvidenceItem[]): { system: string; user: string } {
  // Sort evidence: CRITICAL → HIGH → MEDIUM → LOW → INFO/undef
  const rank = (s?: string) => ({ CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 } as const)[s as 'CRITICAL'] || 0;
  const sorted = [...evidence].sort((a, b) => rank(b.severity) - rank(a.severity));

  const evidenceBlock = sorted
    .map(
      (ev, idx) =>
        `--- Evidence #${idx + 1} | id=${ev.id} | ${ev.service}/${ev.region}/${ev.api} | ${ev.rawBytes}B${ev.truncated ? ' (TRUNCATED, severity-sorted)' : ''}${ev.severity ? ' | sev=' + ev.severity : ''} ---\n${ev.raw}`
    )
    .join('\n\n');

  const system =
    `You are a SOC 2 Type I audit expert analyzing AWS infrastructure evidence.\n` +
    `Control: ${def.id} — ${def.name}\n` +
    `AICPA Criteria: ${def.description}\n\n` +
    (def.partiallyAssessable
      ? `IMPORTANT: This control is only partially assessable through AWS APIs. The technical layer can be evaluated; organizational/process controls (approval workflows, tabletop exercises, governance, registration policy, recovery testing, etc.) are OUT OF SCOPE for this analysis. You MUST surface a prominent disclaimer in the summary that organizational/process controls are outside AWS API assessment scope.\n\n`
      : '') +
    `You receive evidence sorted CRITICAL → HIGH → MEDIUM → LOW. Base your assessment ONLY on what the evidence demonstrates. Never invent findings, configurations, resource names, or AWS commands. Never assume process controls exist unless evidence supports them.\n\n` +
    `Output rules:\n` +
    `- Return ONLY valid JSON. No markdown fences. No preamble. No trailing commentary.\n` +
    `- gap_score: 0–100 (lower = larger gap, 100 = audit-ready).\n` +
    `- freshness_score: 0–100 based on whether evidence reflects current state (recent timestamps, no stale config recorders, etc.).\n` +
    `- audit_risk: LOW | MEDIUM | HIGH | CRITICAL — risk of audit failure if not addressed.\n` +
    `- status: PASS | PARTIAL | FAIL.\n` +
    `- summary: 2–3 sentence assessment, audit-grade language. ${def.partiallyAssessable ? 'MUST start with the process-control disclaimer.' : ''}\n` +
    `- critical_findings: array of {id, severity (CRITICAL|HIGH|MEDIUM|LOW), title, description, evidence_id, remediation_cli (a real, copy-pasteable AWS CLI command — use only documented APIs, never invent)}.\n` +
    `- recommended_remediations: array of strings — ordered by impact, each describing a concrete AWS-level action.\n` +
    `- auditor_questions: array of strings — top 3–5 questions a SOC 2 auditor would ask the engineering team about this control. Phrase as the auditor.`;

  const user =
    `Control: ${def.id} — ${def.name}\n\n` +
    `Evidence collected (${sorted.length} item${sorted.length === 1 ? '' : 's'}, severity-sorted):\n\n` +
    (evidenceBlock || '(no evidence collected — surface this in the summary and set status to FAIL with audit_risk=HIGH)') +
    `\n\nAnalyze this evidence and return ONLY valid JSON (no markdown, no preamble):\n` +
    `{\n` +
    `  "control_id": "${def.id}",\n` +
    `  "control_name": "${def.name}",\n` +
    `  "status": "PASS|PARTIAL|FAIL",\n` +
    `  "gap_score": 0-100,\n` +
    `  "freshness_score": 0-100,\n` +
    `  "audit_risk": "LOW|MEDIUM|HIGH|CRITICAL",\n` +
    `  "summary": "2-3 sentence assessment",\n` +
    `  "critical_findings": [{"id": "...", "severity": "...", "title": "...", "description": "...", "evidence_id": "...", "remediation_cli": "aws ..."}],\n` +
    `  "recommended_remediations": ["..."],\n` +
    `  "auditor_questions": ["..."]\n` +
    `}`;

  return { system, user };
}

// ============================================================
// Claude API call
// ============================================================

export async function analyzeControl(
  env: Env,
  controlId: string,
  evidence: EvidenceItem[]
): Promise<ControlAnalysis> {
  const def = getControl(controlId);
  if (!def) {
    return {
      control_id: controlId,
      name: controlId,
      status: 'inconclusive',
      gap_score: 0,
      freshness_score: 0,
      summary: 'Unknown control.',
      findings: [],
      evidence_ids: [],
      recommendations: [],
      analyzed_at: Date.now(),
    };
  }

  const relevant = evidenceForControl(controlId, evidence);
  const { system, user } = buildPrompt(def, relevant);

  let parsed: any = null;
  let rawText = '';
  try {
    const resp = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Claude API ${resp.status}: ${text.slice(0, 400)}`);
    }
    const data: any = await resp.json();
    rawText = data.content?.[0]?.text || '';
    parsed = extractJson(rawText);
  } catch (e: any) {
    return {
      control_id: def.id,
      name: def.name,
      status: 'inconclusive',
      gap_score: 0,
      freshness_score: 0,
      summary: `Claude analysis failed: ${e?.message || e}. Free-tier heuristic score retained.`,
      findings: [],
      evidence_ids: relevant.map((ev) => ev.id),
      recommendations: [],
      disclaimers: def.disclaimers,
      partially_assessable: def.partiallyAssessable,
      analyzed_at: Date.now(),
    };
  }

  // Map Claude response → our internal ControlAnalysis shape (lowercase status,
  // findings array). We preserve audit_risk + auditor_questions on the object
  // for downstream report rendering.
  const statusUpper = String(parsed?.status || '').toUpperCase();
  const status: ControlAnalysis['status'] =
    statusUpper === 'PASS' ? 'pass' : statusUpper === 'FAIL' ? 'fail' : statusUpper === 'PARTIAL' ? 'partial' : 'inconclusive';

  const findings: Finding[] = Array.isArray(parsed?.critical_findings)
    ? parsed.critical_findings.map((f: any, i: number) => ({
        id: String(f.id || `f${i + 1}`),
        severity: (String(f.severity || 'MEDIUM').toUpperCase() as Finding['severity']),
        title: String(f.title || 'Finding'),
        description: String(f.description || ''),
        evidence_id: f.evidence_id ? String(f.evidence_id) : undefined,
        remediation: f.remediation_cli ? String(f.remediation_cli) : (f.remediation ? String(f.remediation) : undefined),
      }))
    : [];

  return {
    control_id: def.id,
    name: def.name,
    status,
    gap_score: clamp(toInt(parsed?.gap_score, 50), 0, 100),
    freshness_score: clamp(toInt(parsed?.freshness_score, 80), 0, 100),
    summary: String(parsed?.summary || rawText.slice(0, 500)),
    findings,
    evidence_ids: relevant.map((ev) => ev.id),
    recommendations: Array.isArray(parsed?.recommended_remediations) ? parsed.recommended_remediations.map(String) : [],
    disclaimers: def.disclaimers,
    partially_assessable: def.partiallyAssessable,
    analyzed_at: Date.now(),
    audit_risk: String(parsed?.audit_risk || '').toUpperCase() || undefined,
    auditor_questions: Array.isArray(parsed?.auditor_questions) ? parsed.auditor_questions.map(String) : [],
  } as ControlAnalysis;
}

function extractJson(text: string): any {
  // Sonnet returns plain JSON per system prompt, but tolerate fences/preamble
  const fenced = text.match(/```json\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch {}
  }
  return null;
}

function toInt(v: any, fallback: number): number {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

// ============================================================
// Run all 12 controls (post-purchase)
// ============================================================

export async function analyzeAllControls(env: Env, evidence: EvidenceItem[]): Promise<ControlAnalysis[]> {
  // Sequential with mild concurrency (3 at a time) to avoid Anthropic rate limits
  const out: ControlAnalysis[] = [];
  const concurrency = 3;
  for (let i = 0; i < CONTROLS.length; i += concurrency) {
    const batch = CONTROLS.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((c) => analyzeControl(env, c.id, evidence)));
    out.push(...results);
  }
  return out;
}

// ============================================================
// Executive rollup (re-used for paid report)
// ============================================================

export function rollupExecutive(controls: ControlAnalysis[]): {
  executive_summary: string;
  overall_readiness: string;
  overall_gap_score: number;
  overall_freshness_score: number;
  critical_actions: string[];
  strengths: string[];
} {
  const scored = controls.filter((c) => c.status !== 'not_assessed');
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const gap = avg(scored.map((c) => c.gap_score || 0));
  const fresh = avg(scored.map((c) => c.freshness_score || 0));
  const passes = scored.filter((c) => c.status === 'pass').length;
  const fails = scored.filter((c) => c.status === 'fail').length;
  const partials = scored.filter((c) => c.status === 'partial').length;

  let readiness: string;
  if (fails === 0 && partials <= 1) readiness = 'Audit-ready';
  else if (fails <= 1 && partials <= 4) readiness = 'Near-ready';
  else if (fails <= 3) readiness = 'Significant gaps';
  else readiness = 'Not ready';

  const criticalActions: string[] = [];
  for (const c of scored) {
    for (const f of c.findings || []) {
      if (f.severity === 'CRITICAL' || f.severity === 'HIGH') {
        criticalActions.push(`[${c.control_id}] ${f.title}${f.remediation ? ' — ' + f.remediation : ''}`);
      }
    }
  }
  const strengths = scored.filter((c) => c.status === 'pass').map((c) => `${c.control_id}: ${c.name}`);

  const summary =
    `LoxeAI scanned ${controls.length} SOC 2 controls. ${passes} pass, ${partials} partial, ${fails} fail. ` +
    `Overall readiness: ${readiness}. Average gap score ${gap}/100, freshness ${fresh}/100.`;

  return {
    executive_summary: summary,
    overall_readiness: readiness,
    overall_gap_score: gap,
    overall_freshness_score: fresh,
    critical_actions: criticalActions.slice(0, 12),
    strengths: strengths.slice(0, 12),
  };
}
