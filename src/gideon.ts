// Gideon — LoxeAI's compliance copilot. Paid feature, requires download_token.
//
// Two modes:
//   - context: when the user opens a control, frontend POSTs {control_id} only;
//     we return pre-baked smart suggestions (top remediation, effort, auditor Q).
//   - free-form: when user types a question, frontend POSTs {question, control_id?, context?};
//     we call Claude Sonnet with a Gideon system prompt and the scan summary as context.

import type { Env, ScanResults, ControlAnalysis } from './types';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

const GIDEON_SYSTEM = `You are Gideon, LoxeAI's compliance copilot for SOC 2 audits. You are concise, technical, and help engineering teams fix AWS security gaps. You have access to this organization's scan results. Focus on: specific AWS CLI commands to fix issues, timeline estimates, and how to explain findings to auditors. Keep responses under 150 words unless asked for detail. Never make up AWS commands — only use documented APIs.`;

export interface GideonRequest {
  question?: string;
  control_id?: string;
  context?: string;
}

export interface GideonResponse {
  mode: 'context' | 'freeform';
  answer?: string;
  suggestions?: GideonSuggestion[];
}

export interface GideonSuggestion {
  label: string;       // e.g. "Here's what to fix first for CC6.1:"
  body: string;        // human-readable text
  cta?: { kind: 'ask'; question: string }; // optional button to ask Gideon a follow-up
}

// ============================================================
// Context mode — pre-baked from existing analysis
// ============================================================

export function gideonContextSuggestions(results: ScanResults, controlId: string): GideonResponse {
  const c = results.controls.find((x) => x.control_id === controlId);
  if (!c) return { mode: 'context', suggestions: [{ label: 'No analysis for this control', body: 'Run a scan first, or unlock the paid report for AI analysis.' }] };
  const suggestions: GideonSuggestion[] = [];

  // Top fix
  const topFinding = (c.findings || []).slice().sort((a, b) => sevRank(b.severity) - sevRank(a.severity))[0];
  if (topFinding) {
    suggestions.push({
      label: `Here's what to fix first for ${c.control_id}:`,
      body: `${topFinding.title}. ${topFinding.remediation || c.recommendations?.[0] || 'See remediation roadmap in the report.'}`,
    });
  } else if (c.recommendations?.length) {
    suggestions.push({
      label: `Recommended next step for ${c.control_id}:`,
      body: c.recommendations[0],
    });
  }

  // Effort estimate (heuristic from severity counts)
  suggestions.push({ label: 'How long will this take?', body: estimateEffort(c) });

  // Auditor question
  const aq = c.auditor_questions?.[0];
  if (aq) suggestions.push({ label: 'What will an auditor ask?', body: aq });

  // Free-form CTA
  if (topFinding) {
    suggestions.push({
      label: 'Ask Gideon',
      body: `Want help with the "${truncate(topFinding.title, 60)}" finding?`,
      cta: { kind: 'ask', question: `What should I do about the ${truncate(topFinding.title, 80)} finding under ${c.control_id}?` },
    });
  }

  return { mode: 'context', suggestions };
}

function estimateEffort(c: ControlAnalysis): string {
  const findings = c.findings || [];
  const criticals = findings.filter((f) => f.severity === 'CRITICAL').length;
  const highs = findings.filter((f) => f.severity === 'HIGH').length;
  if (criticals + highs === 0) return 'Less than 1 hour — minor cleanup.';
  if (criticals + highs <= 2) return 'About half a day — 1–2 changes plus verification.';
  if (criticals + highs <= 5) return '1–2 days for an engineer — multiple AWS-level changes.';
  return '3–5 days — meaningful change management plus org-level guardrails.';
}

function sevRank(s?: string): number {
  return ({ CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 } as const)[s as 'CRITICAL'] || 0;
}

function truncate(s: string, n: number): string { return s.length <= n ? s : s.slice(0, n - 1) + '…'; }

// ============================================================
// Free-form mode — Claude Sonnet with conversation history
// ============================================================

export async function gideonFreeform(env: Env, results: ScanResults, scanOrgName: string, q: string, controlId?: string, scanId?: string): Promise<GideonResponse> {
  const ctx = buildScanContext(results, scanOrgName, controlId);

  // Load last 20 messages for this scan to maintain conversation context
  const history: { role: 'user' | 'assistant'; content: string }[] = [];
  if (scanId) {
    const rows = await env.DB.prepare(
      'SELECT role, content FROM gideon_messages WHERE scan_id = ? ORDER BY created_at ASC LIMIT 20'
    ).bind(scanId).all<{ role: string; content: string }>();
    for (const r of rows.results || []) {
      if (r.role === 'user' || r.role === 'assistant') {
        history.push({ role: r.role, content: r.content });
      }
    }
  }

  // Build messages array: history + new user question (context injected into first user turn)
  const userContent = history.length === 0
    ? `Scan context:\n${ctx}\n\nQuestion: ${q}`
    : q;

  const messages = [
    ...history,
    { role: 'user' as const, content: userContent },
  ];

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
        max_tokens: 400,
        system: GIDEON_SYSTEM + (history.length > 0 ? `\n\nScan context:\n${ctx}` : ''),
        messages,
      }),
    });
    if (!resp.ok) throw new Error(`Claude API ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
    const data: any = await resp.json();
    const answer = (data.content?.[0]?.text || '').toString().trim();

    // Persist both turns to gideon_messages
    if (scanId) {
      const now = Date.now();
      const msgId1 = crypto.randomUUID().replace(/-/g, '');
      const msgId2 = crypto.randomUUID().replace(/-/g, '');
      await env.DB.prepare('INSERT INTO gideon_messages (id, scan_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(msgId1, scanId, 'user', userContent, now).run();
      await env.DB.prepare('INSERT INTO gideon_messages (id, scan_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(msgId2, scanId, 'assistant', answer, now + 1).run();
    }

    return { mode: 'freeform', answer };
  } catch (e: any) {
    return { mode: 'freeform', answer: `(Gideon is temporarily unavailable: ${e?.message || e})` };
  }
}

function buildScanContext(results: ScanResults, orgName: string, controlId?: string): string {
  const lines: string[] = [];
  lines.push(`Organization: ${orgName}`);
  lines.push(`Overall readiness: ${results.overall_readiness || '—'}`);
  lines.push(`Overall gap score: ${results.overall_gap_score ?? '—'}/100`);
  if (controlId) {
    const c = results.controls.find((x) => x.control_id === controlId);
    if (c) {
      lines.push(`\nFOCUSED CONTROL: ${c.control_id} — ${c.name} | status=${c.status} | gap=${c.gap_score}`);
      lines.push(`Summary: ${c.summary}`);
      if ((c.findings || []).length) {
        lines.push(`Findings:`);
        for (const f of c.findings.slice(0, 5)) {
          lines.push(`  - [${f.severity}] ${f.title}: ${f.description}${f.remediation ? ' | fix: ' + f.remediation : ''}`);
        }
      }
    }
  } else {
    const failing = results.controls.filter((c) => c.status === 'fail');
    if (failing.length) {
      lines.push(`Failing controls: ${failing.map((c) => c.control_id).join(', ')}`);
    }
    if (results.critical_actions?.length) {
      lines.push(`Top critical actions:`);
      for (const a of results.critical_actions.slice(0, 5)) lines.push(`  - ${a}`);
    }
  }
  return lines.join('\n');
}
