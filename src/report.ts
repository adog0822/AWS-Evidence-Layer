// Standalone, self-contained HTML report. Inlined CSS, no external deps,
// print-optimized (@media print). Includes scan delta, SHA-256 footer,
// human edits, redactions.

import type { ControlAnalysis, EvidenceItem, ScanResults, Env } from './types';

export interface ScanDelta {
  previous_scan_id: string;
  previous_completed_at: number;
  previous_overall_gap_score: number;
  current_overall_gap_score: number;
  trend: 'improved' | 'regressed' | 'unchanged';
  fixed_findings: string[];           // titles that flipped FAIL → PASS at the control level
  new_failing_findings: string[];     // titles for newly FAIL controls
}

export interface ReportContext {
  scanId: string;
  orgName: string;
  scanCompletedAt: number;
  results: ScanResults;
  delta?: ScanDelta;  // plain delta (no history map) — history is only needed during annotateControlsWithDelta
  edits?: ScanEdit[];
}

export interface ScanEdit {
  id: string;
  edit_type: 'severity_override' | 'note' | 'redaction';
  target_path: string;
  original_value: string | null;
  new_value: string | null;
  note: string | null;
  created_at: number;
}

// ============================================================
// Delta computation
// ============================================================

export interface DeltaWithHistory {
  delta: ScanDelta;
  prevById: Map<string, ControlAnalysis>;
}

export async function computeDelta(env: Env, scanId: string, externalId: string, currentGap: number): Promise<DeltaWithHistory | undefined> {
  const prev = await env.DB.prepare(
    `SELECT id, completed_at FROM scans
     WHERE external_id = ? AND status = 'complete' AND id != ?
     ORDER BY completed_at DESC LIMIT 1`
  ).bind(externalId, scanId).first<{ id: string; completed_at: number }>();
  if (!prev) return undefined;

  const prevResults = await env.DB.prepare('SELECT controls_json, overall_gap_score FROM scan_results WHERE scan_id = ?')
    .bind(prev.id)
    .first<{ controls_json: string; overall_gap_score: number | null }>();
  if (!prevResults) return undefined;

  const prevControls: ControlAnalysis[] = JSON.parse(prevResults.controls_json);
  const prevGap = prevResults.overall_gap_score ?? 0;
  const trend: ScanDelta['trend'] = currentGap > prevGap + 2 ? 'improved' : currentGap < prevGap - 2 ? 'regressed' : 'unchanged';

  return {
    delta: {
      previous_scan_id: prev.id,
      previous_completed_at: prev.completed_at,
      previous_overall_gap_score: prevGap,
      current_overall_gap_score: currentGap,
      trend,
      fixed_findings: [],
      new_failing_findings: [],
    },
    prevById: new Map(prevControls.map((c) => [c.control_id, c])),
  };
}

export function annotateControlsWithDelta(
  controls: ControlAnalysis[],
  deltaWithHistory?: DeltaWithHistory,
): ControlAnalysis[] {
  if (!deltaWithHistory) return controls;
  const { delta, prevById } = deltaWithHistory;
  return controls.map((c) => {
    const p = prevById.get(c.control_id);
    if (!p) return c;
    const trend: 'improved' | 'regressed' | 'unchanged' =
      c.gap_score > p.gap_score + 2 ? 'improved' : c.gap_score < p.gap_score - 2 ? 'regressed' : 'unchanged';
    if (p.status === 'fail' && c.status === 'pass') delta.fixed_findings.push(`${c.control_id} — ${c.name}`);
    if (p.status !== 'fail' && c.status === 'fail') delta.new_failing_findings.push(`${c.control_id} — ${c.name}`);
    return { ...c, delta: { previous_gap_score: p.gap_score, previous_status: p.status, trend } };
  });
}

// ============================================================
// Apply edits / redactions to a working copy of the results
// ============================================================

export function applyEdits(results: ScanResults, edits: ScanEdit[]): ScanResults {
  if (!edits || edits.length === 0) return results;
  // Deep-ish clone
  const out: ScanResults = JSON.parse(JSON.stringify(results));
  for (const e of edits) {
    // Control IDs contain dots (e.g. "CC6.1"), so we can't naively split the
    // full path by ".". Use a regex to extract the control ID and the remainder.
    // Path format: "controls.<control_id>[.<rest>]"
    const m = e.target_path.match(/^controls\.(CC\d+\.\d+)(?:\.(.*))?$/);
    if (!m) continue;
    const controlId = m[1];
    const rest = m[2] || '';
    const ctrl = out.controls.find((c) => c.control_id === controlId);
    if (!ctrl) continue;
    const restParts = rest ? rest.split('.') : [];
    if (e.edit_type === 'severity_override' && restParts[0] === 'findings') {
      const idx = parseInt(restParts[1] || '-1', 10);
      const f = ctrl.findings?.[idx];
      if (f) {
        const original = f.severity;
        f.severity = (e.new_value as any) || f.severity;
        (f as any).human_edited = { original, note: e.note || '' };
      }
    } else if (e.edit_type === 'note') {
      (ctrl as any).human_notes = ((ctrl as any).human_notes || []).concat([{ note: e.note || e.new_value || '', at: e.created_at }]);
    } else if (e.edit_type === 'redaction' && restParts[0] === 'evidence_ids') {
      const evId = restParts[1];
      const ev = out.evidence.find((x) => x.id === evId);
      if (ev) {
        ev.raw = '████████ [Evidence redacted by reviewer]';
        (ev as any).redacted = true;
      }
    }
  }
  return out;
}

// ============================================================
// SHA-256 of the rendered report
// ============================================================

export async function hashReport(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// HTML render
// ============================================================

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function buildReportHtml(ctx: ReportContext): Promise<{ html: string; sha256: string }> {
  const { scanId, orgName, scanCompletedAt, results, delta, edits } = ctx;
  const dt = new Date(scanCompletedAt).toUTCString();
  const r = applyEdits(results, edits || []);

  const deltaSection = delta
    ? `<section class="delta">
        <h2>Since your last scan</h2>
        <p><strong>Previous scan:</strong> ${esc(new Date(delta.previous_completed_at).toUTCString())} · gap ${delta.previous_overall_gap_score}/100</p>
        <p><strong>Current:</strong> gap ${delta.current_overall_gap_score}/100 — ${trendBadge(delta.trend)}</p>
        ${delta.fixed_findings.length ? `<p><strong>Fixed since last scan:</strong></p><ul>${delta.fixed_findings.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        ${delta.new_failing_findings.length ? `<p><strong>New gaps since last scan:</strong></p><ul>${delta.new_failing_findings.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      </section>`
    : '';

  const evidenceById = new Map(r.evidence.map((e) => [e.id, e]));

  const controlsHtml = r.controls
    .slice()
    .sort((a, b) => a.control_id.localeCompare(b.control_id))
    .map((c) => renderControl(c, evidenceById))
    .join('\n');

  const evidenceListHtml = r.evidence
    .map((ev) => renderEvidenceTrace(ev))
    .join('\n');

  const draftHtml = wrap({
    orgName,
    scanId,
    dt,
    overallReadiness: r.overall_readiness || '—',
    gap: r.overall_gap_score ?? 0,
    fresh: r.overall_freshness_score ?? 0,
    execSummary: r.executive_summary || '',
    deltaSection,
    criticalActions: r.critical_actions || [],
    strengths: r.strengths || [],
    controlsHtml,
    evidenceListHtml,
    sha256: 'PENDING_HASH',
  });

  const sha256 = await hashReport(draftHtml.replace('PENDING_HASH', ''));
  const html = draftHtml.replace('PENDING_HASH', sha256);
  return { html, sha256 };
}

function trendBadge(trend: 'improved' | 'regressed' | 'unchanged'): string {
  if (trend === 'improved') return '<span class="trend up">↑ improved</span>';
  if (trend === 'regressed') return '<span class="trend down">↓ regressed</span>';
  return '<span class="trend flat">— unchanged</span>';
}

function renderControl(c: ControlAnalysis, evMap: Map<string, EvidenceItem>): string {
  const findingsHtml = (c.findings || [])
    .slice()
    .sort((a, b) => sevRank(b.severity) - sevRank(a.severity))
    .map((f) => {
      const editedBadge = (f as any).human_edited
        ? `<span class="edited">[Reviewer annotation: original severity was ${esc((f as any).human_edited.original)}${(f as any).human_edited.note ? ' — ' + esc((f as any).human_edited.note) : ''}]</span>`
        : '';
      const evRef = f.evidence_id && evMap.has(f.evidence_id)
        ? `<p class="evref">Evidence: <a href="#ev-${esc(f.evidence_id)}">${esc(f.evidence_id)}</a></p>`
        : '';
      return `<div class="finding sev-${esc(f.severity)}">
        <div class="fhead"><span class="sev">${esc(f.severity)}</span> ${esc(f.title)} ${editedBadge}</div>
        <p>${esc(f.description)}</p>
        ${f.remediation ? `<pre class="cli">${esc(f.remediation)}</pre>` : ''}
        ${evRef}
      </div>`;
    })
    .join('');

  const recHtml = (c.recommendations || []).length
    ? `<h4>Remediation roadmap</h4><ol class="reco">${c.recommendations.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`
    : '';
  const aqHtml = (c.auditor_questions || []).length
    ? `<h4>What an auditor will ask</h4><ul class="aq">${c.auditor_questions!.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>`
    : '';
  const dis = (c.disclaimers || []).length
    ? `<p class="disclaimer">${c.disclaimers!.map(esc).join(' ')}</p>`
    : '';
  const notes = (c as any).human_notes
    ? `<div class="notes"><strong>Reviewer notes:</strong><ul>${(c as any).human_notes.map((n: any) => `<li>${esc(n.note)}</li>`).join('')}</ul></div>`
    : '';

  const deltaPill = c.delta
    ? `<span class="trend small ${c.delta.trend === 'improved' ? 'up' : c.delta.trend === 'regressed' ? 'down' : 'flat'}">Δ ${c.delta.previous_gap_score}→${c.gap_score}</span>`
    : '';

  return `<section class="ctrl" id="ctrl-${esc(c.control_id)}">
    <header>
      <h3>${esc(c.control_id)} — ${esc(c.name)}</h3>
      <div class="meta">
        <span class="pill ${esc(c.status)}">${esc(c.status.toUpperCase())}</span>
        ${c.audit_risk ? `<span class="pill risk-${esc(c.audit_risk)}">Risk: ${esc(c.audit_risk)}</span>` : ''}
        ${deltaPill}
      </div>
    </header>
    <div class="bar"><span style="width:${esc(String(c.gap_score))}%"></span></div>
    <p class="score">gap <strong>${esc(c.gap_score)}/100</strong> · freshness ${esc(c.freshness_score)}/100</p>
    <p>${esc(c.summary)}</p>
    ${dis}
    ${findingsHtml ? '<h4>Findings</h4>' + findingsHtml : ''}
    ${recHtml}
    ${aqHtml}
    ${notes}
  </section>`;
}

function renderEvidenceTrace(ev: EvidenceItem): string {
  const isRedacted = (ev as any).redacted;
  return `<details class="ev" id="ev-${esc(ev.id)}">
    <summary>${esc(ev.id)} · ${esc(ev.service)}/${esc(ev.region)}/${esc(ev.api)} ${ev.severity ? `· ${esc(ev.severity)}` : ''} ${ev.truncated ? '· truncated' : ''} ${isRedacted ? '· <strong>REDACTED</strong>' : ''}</summary>
    <pre>${esc(ev.raw)}</pre>
  </details>`;
}

function sevRank(s?: string): number {
  return ({ CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 } as const)[s as 'CRITICAL'] || 0;
}

// ============================================================
// HTML envelope
// ============================================================

function wrap(args: {
  orgName: string;
  scanId: string;
  dt: string;
  overallReadiness: string;
  gap: number;
  fresh: number;
  execSummary: string;
  deltaSection: string;
  criticalActions: string[];
  strengths: string[];
  controlsHtml: string;
  evidenceListHtml: string;
  sha256: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(args.orgName)} — SOC 2 Readiness Report</title>
<style>
:root { --bg:#0b0d10; --panel:#12161b; --panel2:#171c22; --border:#232a32; --text:#e6edf3; --muted:#8b96a3; --accent:#5eead4; --good:#22c55e; --warn:#eab308; --bad:#ef4444; }
@page { margin: 1in; }
* { box-sizing: border-box; }
body { font: 14px/1.55 -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif; color: #111; background: #fff; max-width: 880px; margin: 32px auto; padding: 0 24px; }
header.brand { display:flex; align-items:center; justify-content:space-between; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 22px; }
.logo { display:flex; align-items:center; gap:10px; font: 700 18px/1 "SF Pro Display","Inter",sans-serif; letter-spacing:-.01em; }
.dot { width:12px; height:12px; border-radius:2px; background: linear-gradient(135deg,#5eead4,#38bdf8); }
.tagline { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
h1 { font: 700 26px/1.2 "SF Pro Display","Inter",sans-serif; letter-spacing: -.02em; margin: 0 0 4px; }
h2 { font: 700 20px/1.2 "SF Pro Display","Inter",sans-serif; margin: 28px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
h3 { font: 700 16px/1.3 "Inter",sans-serif; margin: 18px 0 6px; }
h4 { font: 600 13px/1.3 "Inter",sans-serif; margin: 12px 0 4px; color: #374151; text-transform: uppercase; letter-spacing: .06em; }
.meta-row { display:flex; gap: 18px; flex-wrap: wrap; color:#6b7280; font-size:13px; margin-bottom: 18px; }
.scoregrid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0 20px; }
.scoregrid .box { border:1px solid #e5e7eb; border-radius:8px; padding: 14px; }
.scoregrid .label { color:#6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; }
.scoregrid .val { font: 700 22px/1.1 "Inter",sans-serif; margin-top: 4px; }
section.delta { background: #f8fafc; border: 1px solid #e5e7eb; border-radius:8px; padding: 12px 16px; margin-bottom: 18px; }
.trend { display:inline-block; padding: 2px 8px; border-radius:999px; font-size: 11px; font-weight:700; }
.trend.up { background:#dcfce7; color:#166534; }
.trend.down { background:#fee2e2; color:#991b1b; }
.trend.flat { background:#e5e7eb; color:#374151; }
.trend.small { font-size:10px; padding: 1px 6px; }
section.ctrl { border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 18px; margin: 14px 0; page-break-inside: avoid; }
section.ctrl header { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:700; text-transform: uppercase; letter-spacing: .04em; margin-left:6px; }
.pill.pass { background:#dcfce7; color:#166534; }
.pill.fail { background:#fee2e2; color:#991b1b; }
.pill.partial { background:#fef9c3; color:#854d0e; }
.pill.inconclusive { background:#e5e7eb; color:#374151; }
.pill.risk-LOW { background:#dcfce7; color:#166534; }
.pill.risk-MEDIUM { background:#fef9c3; color:#854d0e; }
.pill.risk-HIGH { background:#ffedd5; color:#9a3412; }
.pill.risk-CRITICAL { background:#fee2e2; color:#991b1b; }
.bar { height: 6px; background:#e5e7eb; border-radius:999px; overflow:hidden; margin: 6px 0 6px; }
.bar > span { display:block; height:100%; background: linear-gradient(90deg,#5eead4,#38bdf8); }
.score { color:#6b7280; font-size: 12px; margin: 0 0 8px; }
.finding { border-left: 3px solid #cbd5e1; padding: 8px 12px; margin: 6px 0; background:#f8fafc; border-radius: 0 6px 6px 0; }
.finding.sev-CRITICAL, .finding.sev-HIGH { border-left-color:#dc2626; background:#fef2f2; }
.finding.sev-MEDIUM { border-left-color:#d97706; background:#fffbeb; }
.finding .fhead { display:flex; align-items:center; gap: 8px; }
.finding .sev { font: 700 11px/1 "SF Mono",ui-monospace,Menlo,monospace; padding:2px 6px; border-radius: 4px; background:#111; color:#fff; }
.finding.sev-CRITICAL .sev, .finding.sev-HIGH .sev { background:#dc2626; }
.finding.sev-MEDIUM .sev { background:#d97706; }
pre.cli { background:#0b1020; color:#e2e8f0; padding: 10px 12px; border-radius:6px; overflow:auto; font: 12px/1.4 "SF Mono",ui-monospace,Menlo,monospace; }
ol.reco li, ul.aq li { margin: 4px 0; }
.disclaimer { color:#6b7280; font-size:12px; font-style: italic; background:#f9fafb; border-left: 3px solid #d1d5db; padding: 8px 12px; border-radius: 0 6px 6px 0; }
.evref { color:#6b7280; font-size: 12px; }
details.ev { border: 1px solid #e5e7eb; border-radius: 6px; margin: 6px 0; padding: 6px 10px; background:#f9fafb; page-break-inside: avoid; }
details.ev summary { font: 12px/1.3 "SF Mono",ui-monospace,Menlo,monospace; cursor: pointer; color:#374151; }
details.ev pre { font: 11px/1.4 "SF Mono",ui-monospace,Menlo,monospace; color:#111; background:#fff; padding: 8px; overflow:auto; max-height: 320px; }
.edited { display:inline-block; background:#fff7ed; color:#9a3412; border:1px solid #fed7aa; padding:1px 6px; font-size: 10px; border-radius: 4px; margin-left: 4px; font-weight:700; }
.notes { background:#fff7ed; border:1px solid #fed7aa; padding: 8px 12px; border-radius: 6px; margin-top: 8px; }
footer.foot { margin-top: 30px; padding-top: 14px; border-top: 1px solid #e5e7eb; color:#6b7280; font-size: 11px; font-family: "SF Mono",ui-monospace,Menlo,monospace; }
@media print {
  body { max-width: none; margin: 0; padding: 0; }
  details.ev[open] pre { max-height: none; }
  details.ev { background: #fff; }
  section.ctrl, details.ev { box-shadow: none; }
  a { color: #111; text-decoration: none; }
  .pill { border:1px solid #ccc; }
}
</style>
</head>
<body>
<header class="brand">
  <div class="logo"><span class="dot"></span> LoxeAI · Evidence Tracer Report v2</div>
  <div class="tagline">Audit-grade · ${esc(args.dt)}</div>
</header>
<h1>${esc(args.orgName)}</h1>
<div class="meta-row">
  <span>Scan ID: <code>${esc(args.scanId)}</code></span>
  <span>Generated: ${esc(args.dt)}</span>
</div>
<div class="scoregrid">
  <div class="box"><div class="label">Overall readiness</div><div class="val">${esc(args.overallReadiness)}</div></div>
  <div class="box"><div class="label">Avg gap score</div><div class="val">${esc(args.gap)}/100</div></div>
  <div class="box"><div class="label">Evidence freshness</div><div class="val">${esc(args.fresh)}/100</div></div>
</div>
<h2>Executive Summary</h2>
<p>${esc(args.execSummary)}</p>
${args.deltaSection}
${args.criticalActions.length ? `<h2>Critical Actions</h2><ol style="padding-left:20px;">${args.criticalActions.map((a) => {
  const parts = a.split(' — ');
  if (parts.length >= 2) {
    const label = parts[0];
    const cli = parts.slice(1).join(' — ');
    return `<li style="margin-bottom:14px"><strong>${esc(label)}</strong><pre class="cli" style="white-space:pre-wrap;word-break:break-all;margin-top:6px;">${esc(cli)}</pre></li>`;
  }
  return `<li style="margin-bottom:8px">${esc(a)}</li>`;
}).join('')}</ol>` : ''}
${args.strengths.length ? `<h2>Strengths</h2><ul>${args.strengths.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
<h2>Control-by-Control Analysis</h2>
${args.controlsHtml}
<h2>Evidence Catalog</h2>
${args.evidenceListHtml}
<footer class="foot">
Generated by LoxeAI Evidence Tracer · pilot.loxeai.com<br>
SHA-256: ${esc(args.sha256)} · ${esc(args.dt)}
</footer>
</body>
</html>`;
}
