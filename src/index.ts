// LoxeAI Pilot v2 — single-Worker entry point.
//
// Flow:
//   1. POST /api/scan → kicks AWS evidence collection in waitUntil(); free-tier
//      heuristic scoring runs as soon as evidence is in. Status flips to
//      'complete' (free tier is "complete" without Claude).
//   2. Frontend polls GET /api/scan/:id/status. When status === 'complete',
//      it shows blurred paywall over real heuristic scores.
//   3. POST /api/scan/:id/purchase → creates Stripe Checkout session.
//   4. Stripe webhook (checkout.session.completed):
//        - generate download_token
//        - kick off Claude analysis (12 controls) in waitUntil()
//        - pre-generate HTML + JSON report and write to R2 (after Claude finishes)
//   5. GET /api/scan/:id/report?token=  → serves R2 pre-generated artifact
//   6. POST /api/scan/:id/gideon?token= → context or free-form copilot
//   7. POST /api/scan/:id/edit?token=   → save human-edit override

import type { Env, AwsCredentials, ScanResults, ControlAnalysis, QueueMessage } from './types';
import { FRONTEND_HTML } from './html';
import { CFN_TEMPLATE } from './cfn';
import { demoScan } from './demo';
import { runScan, SERVICE_CONFIG, DEFAULT_REGIONS } from './scanner';
import { CONTROLS, getControl } from './controls';
import { analyzeControl, rollupExecutive } from './analyzer';
import { scoreControlsHeuristic, rollupHeuristic } from './scoring';
import { assumeRoleWith } from './aws';
import { createCheckoutSession, verifyStripeSignature } from './stripe';
import { checkToken, newDownloadToken, getPurchaseByScan, getPurchaseBySession, bumpDownloadCount } from './auth';
import { buildReportHtml, computeDelta, annotateControlsWithDelta, type ScanEdit } from './report';
import { gideonContextSuggestions, gideonFreeform } from './gideon';

// ---------------- helpers ----------------

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization',
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS_HEADERS, ...(init.headers || {}) },
  });

const html = (s: string, init: ResponseInit = {}) =>
  new Response(s, { ...init, headers: { 'content-type': 'text/html; charset=utf-8', ...(init.headers || {}) } });

const err = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  json({ error, ...extra }, { status });

function newId(prefix: string): string {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return prefix + '_' + Array.from(a).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function dayKey(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// ---------------- rate limit / meter ----------------

async function checkAndBumpMeter(env: Env, externalId: string): Promise<{ ok: boolean; daily: number; limit: number; total: number; reason?: string }> {
  const limit = parseInt(env.DAILY_SCAN_LIMIT || '3', 10);
  const todayMs = dayKey();
  const row = await env.DB.prepare('SELECT scan_count, daily_count, daily_reset_at FROM scan_meter WHERE external_id = ?')
    .bind(externalId)
    .first<{ scan_count: number; daily_count: number; daily_reset_at: number }>();
  let daily = row?.daily_count ?? 0;
  let total = row?.scan_count ?? 0;
  const resetAt = row?.daily_reset_at ?? 0;
  if (resetAt < todayMs) daily = 0;
  if (daily >= limit) {
    return { ok: false, daily, limit, total, reason: 'Daily scan limit reached. Scans reset at midnight UTC.' };
  }
  const active = await env.DB.prepare("SELECT id FROM scans WHERE external_id = ? AND status IN ('pending','scanning','analyzing') LIMIT 1")
    .bind(externalId)
    .first<{ id: string }>();
  if (active) {
    return { ok: false, daily, limit, total, reason: 'A scan is already in progress for this ExternalId.' };
  }
  daily += 1; total += 1;
  await env.DB.prepare(
    `INSERT INTO scan_meter (external_id, scan_count, daily_count, daily_reset_at, last_scan_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(external_id) DO UPDATE SET
       scan_count = scan_count + 1,
       daily_count = ?,
       daily_reset_at = ?,
       last_scan_at = ?`
  ).bind(externalId, total, daily, todayMs, Date.now(), daily, todayMs, Date.now()).run();
  return { ok: true, daily, limit, total };
}

async function getMeter(env: Env, externalId: string): Promise<{ daily_count: number; daily_limit: number; total: number }> {
  const limit = parseInt(env.DAILY_SCAN_LIMIT || '3', 10);
  const row = await env.DB.prepare('SELECT scan_count, daily_count, daily_reset_at FROM scan_meter WHERE external_id = ?')
    .bind(externalId)
    .first<{ scan_count: number; daily_count: number; daily_reset_at: number }>();
  let daily = row?.daily_count ?? 0;
  if ((row?.daily_reset_at ?? 0) < dayKey()) daily = 0;
  return { daily_count: daily, daily_limit: limit, total: row?.scan_count ?? 0 };
}

// ---------------- scan rows ----------------

interface ScanRow {
  id: string; org_name: string; aws_account_id: string | null; role_arn: string; external_id: string;
  status: string; created_at: number; completed_at: number | null; evidence_count: number;
  services_scanned: string | null; regions_scanned: string | null; error_message: string | null;
}

async function getScan(env: Env, id: string): Promise<ScanRow | null> {
  return await env.DB.prepare('SELECT * FROM scans WHERE id = ?').bind(id).first<ScanRow>();
}

async function getResults(env: Env, scanId: string): Promise<ScanResults | null> {
  const row = await env.DB.prepare('SELECT * FROM scan_results WHERE scan_id = ?').bind(scanId).first<{
    controls_json: string; evidence_json: string; executive_summary: string | null;
    overall_readiness: string | null; overall_gap_score: number | null; overall_freshness_score: number | null;
    critical_actions_json: string | null; strengths_json: string | null;
  }>();
  if (!row) return null;
  return {
    controls: JSON.parse(row.controls_json),
    evidence: JSON.parse(row.evidence_json),
    executive_summary: row.executive_summary || undefined,
    overall_readiness: row.overall_readiness || undefined,
    overall_gap_score: row.overall_gap_score || undefined,
    overall_freshness_score: row.overall_freshness_score || undefined,
    critical_actions: row.critical_actions_json ? JSON.parse(row.critical_actions_json) : undefined,
    strengths: row.strengths_json ? JSON.parse(row.strengths_json) : undefined,
  };
}

async function saveResults(env: Env, scanId: string, results: ScanResults): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO scan_results (scan_id, controls_json, evidence_json, executive_summary, overall_readiness, overall_gap_score, overall_freshness_score, critical_actions_json, strengths_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(scan_id) DO UPDATE SET
       controls_json = excluded.controls_json,
       evidence_json = excluded.evidence_json,
       executive_summary = excluded.executive_summary,
       overall_readiness = excluded.overall_readiness,
       overall_gap_score = excluded.overall_gap_score,
       overall_freshness_score = excluded.overall_freshness_score,
       critical_actions_json = excluded.critical_actions_json,
       strengths_json = excluded.strengths_json`
  ).bind(
    scanId,
    JSON.stringify(results.controls),
    JSON.stringify(results.evidence),
    results.executive_summary || null,
    results.overall_readiness || null,
    results.overall_gap_score ?? null,
    results.overall_freshness_score ?? null,
    results.critical_actions ? JSON.stringify(results.critical_actions) : null,
    results.strengths ? JSON.stringify(results.strengths) : null,
  ).run();
}

// Strip paid content for unpaid responses (keep heuristic gap scores + control titles)
function stripPaidContent(results: ScanResults): ScanResults {
  return {
    ...results,
    evidence: [], // hide raw evidence from free tier
    controls: results.controls.map((c) => ({
      ...c,
      // Keep finding titles/severities for the blurred preview, hide the bodies + remediations
      findings: (c.findings || []).map((f) => ({ ...f, description: '🔒 Unlock report to view', remediation: undefined })),
      recommendations: [],
      auditor_questions: [],
    })),
    critical_actions: undefined,
    strengths: results.strengths?.slice(0, 3),
  };
}

// ---------------- caller credentials ----------------

function getCallerCreds(env: Env): { accessKeyId: string; secretAccessKey: string; sessionToken?: string } | null {
  const { LOXEAI_AWS_ACCESS_KEY_ID: accessKeyId, LOXEAI_AWS_SECRET_ACCESS_KEY: secretAccessKey, LOXEAI_AWS_SESSION_TOKEN: sessionToken } = env;
  if (!accessKeyId || !secretAccessKey) return null;
  return { accessKeyId, secretAccessKey, sessionToken };
}

// ---------------- main fetch ----------------

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const url = new URL(req.url);
      const p = url.pathname;
      const m = req.method;

      // Handle CORS preflight
      if (m === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
      }

      if (m === 'GET' && (p === '/' || p === '/index.html')) return html(FRONTEND_HTML);
      if (m === 'GET' && p === '/api/cloudformation') {
        return new Response(CFN_TEMPLATE, { headers: { 'content-type': 'text/yaml; charset=utf-8' } });
      }
      if (m === 'GET' && p === '/api/demo') return json(demoScan());
      if (m === 'GET' && p === '/api/meter') {
        const ext = url.searchParams.get('external_id') || '';
        return json(await getMeter(env, ext));
      }
      if (m === 'GET' && p === '/api/health') return json({ ok: true, time: Date.now() });

      if (m === 'POST' && p === '/api/scan') return await handleStartScan(req, env, ctx);
      if (m === 'POST' && p === '/api/stripe/webhook') return await handleStripeWebhook(req, env, ctx);

      // Token resolution helper for the success page round-trip
      if (m === 'GET' && p === '/api/scan/token') {
        const sessionId = url.searchParams.get('session_id') || '';
        if (!sessionId) return err(400, 'session_id required');
        const purchase = await getPurchaseBySession(env, sessionId);
        if (!purchase || purchase.status !== 'paid') return err(404, 'no paid purchase for that session');
        return json({ scan_id: purchase.scan_id, token: purchase.download_token });
      }

      // Gideon conversation reset (nested path — must match before scanIdMatch)
      const gideonResetMatch = p.match(/^\/api\/scan\/([a-zA-Z0-9_]+)\/gideon\/reset$/);
      if (gideonResetMatch && m === 'POST') {
        const scan = await getScan(env, gideonResetMatch[1]);
        if (!scan) return err(404, 'scan not found');
        return await handleGideonReset(env, scan, url);
      }

      const scanIdMatch = p.match(/^\/api\/scan\/([a-zA-Z0-9_]+)\/(status|results|purchase|report|gideon|edit|edits|analyze|regenerate)$/);
      if (scanIdMatch) {
        const id = scanIdMatch[1];
        const action = scanIdMatch[2];
        const scan = await getScan(env, id);
        if (!scan) return err(404, 'scan not found');

        if (m === 'GET' && action === 'status') return await handleStatus(env, scan);
        if (m === 'GET' && action === 'results') return await handleResults(env, scan, url);
        if (m === 'POST' && action === 'purchase') return await handlePurchase(req, env, scan);
        if (m === 'GET' && action === 'report') return await handleReport(env, scan, url);
        if (m === 'POST' && action === 'gideon') return await handleGideon(req, env, scan, url);
        if (m === 'POST' && action === 'edit') return await handleEdit(req, env, scan, url);
        if (m === 'GET' && action === 'edits') return await handleEdits(env, scan, url);
        if (m === 'DELETE' && action === 'edit') return await handleDeleteEdits(env, scan, url);
        // /analyze is now internal (post-purchase) only — return 410 Gone
        if (m === 'POST' && action === 'analyze') return err(410, 'AI analysis is triggered automatically after purchase.');
        if (m === 'POST' && action === 'regenerate') return await handleRegenerate(req, env, scan, url);
      }

      return err(404, 'not found', { path: p });
    } catch (e: any) {
      console.error('worker error', e?.stack || e);
      return err(500, 'internal error', { message: e?.message || String(e) });
    }
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      const msg = message.body;
      try {
        if (msg.kind === 'analyze_control') {
          await handleAnalyzeControlMessage(env, msg);
        } else if (msg.kind === 'assemble_report') {
          await handleAssembleReportMessage(env, msg);
        }
        message.ack();
      } catch (e: any) {
        console.error('[queue] message failed, will retry', { kind: msg.kind, error: e?.message, stack: e?.stack });
        message.retry();
      }
    }
  },
};

// ============================================================
// /api/scan — start scan + run heuristic scoring
// ============================================================

async function handleStartScan(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  type StartBody = { role_arn?: string; org_name?: string; external_id?: string; services?: string[]; regions?: string[] };
  const body = await req.json<StartBody>().catch((): StartBody => ({}));
  const role_arn = (body.role_arn || '').trim();
  const org_name = (body.org_name || 'Untitled Org').trim().slice(0, 200);
  const external_id = (body.external_id || '').trim();
  if (!role_arn.startsWith('arn:aws:iam::') || !role_arn.includes(':role/')) return err(400, 'invalid role_arn');
  if (role_arn.length > 2048) return err(400, 'role_arn too long');
  if (!external_id || external_id.length < 8) return err(400, 'invalid external_id: must be at least 8 characters');
  if (external_id.length > 1224) return err(400, 'external_id too long');

  const rl = await checkAndBumpMeter(env, external_id);
  if (!rl.ok) return err(429, rl.reason || 'rate limited', { daily: rl.daily, limit: rl.limit });

  const accountId = role_arn.split('::')[1]?.split(':')[0] || null;
  const id = newId('scan');
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO scans (id, org_name, aws_account_id, role_arn, external_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, org_name, accountId, role_arn, external_id, 'scanning', now).run();

  ctx.waitUntil(runEvidenceCollection(env, id, role_arn, external_id, body.services, body.regions));

  return json({ scan_id: id, status: 'scanning', daily_count: rl.daily, daily_limit: rl.limit });
}

async function runEvidenceCollection(env: Env, scanId: string, roleArn: string, externalId: string, services?: string[], regions?: string[]): Promise<void> {
  try {
    const caller = getCallerCreds(env);
    if (!caller) {
      await markError(env, scanId, 'Server not configured: missing LOXEAI_AWS_ACCESS_KEY_ID secret. Contact support@loxeai.com.');
      return;
    }
    const creds: AwsCredentials = await assumeRoleWith(caller, roleArn, externalId);
    const evidence = await runScan({ credentials: creds, services, regions });

    // Free-tier: rule-based heuristic scoring (no Claude)
    const heuristicControls = scoreControlsHeuristic(evidence);
    const heuristicRollup = rollupHeuristic(heuristicControls);

    await saveResults(env, scanId, {
      controls: heuristicControls,
      evidence,
      ...heuristicRollup,
    });
    await env.DB.prepare(
      'UPDATE scans SET status = ?, evidence_count = ?, services_scanned = ?, regions_scanned = ?, completed_at = ? WHERE id = ?'
    ).bind(
      'complete', evidence.length,
      JSON.stringify(services || Object.keys(SERVICE_CONFIG)),
      JSON.stringify(regions || DEFAULT_REGIONS),
      Date.now(), scanId
    ).run();
  } catch (e: any) {
    await markError(env, scanId, e?.message || String(e));
  }
}

async function markError(env: Env, scanId: string, msg: string): Promise<void> {
  await env.DB.prepare('UPDATE scans SET status = ?, error_message = ?, completed_at = ? WHERE id = ?')
    .bind('error', msg.slice(0, 1000), Date.now(), scanId).run();
}

// ============================================================
// /api/scan/:id/status
// ============================================================

async function handleStatus(env: Env, scan: ScanRow): Promise<Response> {
  const meter = await getMeter(env, scan.external_id);
  const purchase = await getPurchaseByScan(env, scan.id);
  const reportReady = purchase ? !!(await env.BUCKET.head(`reports/${scan.id}/report.html`)) : false;
  return json({
    scan_id: scan.id,
    status: scan.status,
    org_name: scan.org_name,
    evidence_count: scan.evidence_count,
    error_message: scan.error_message,
    started_at: scan.created_at,
    completed_at: scan.completed_at,
    meter,
    purchase: purchase ? {
      status: purchase.status,
      paid_at: purchase.paid_at,
      report_ready: reportReady,
    } : null,
  });
}

// ============================================================
// /api/scan/:id/results
// ============================================================

async function handleResults(env: Env, scan: ScanRow, url: URL): Promise<Response> {
  const results = await getResults(env, scan.id);
  if (!results) return err(404, 'no results');
  const token = url.searchParams.get('token');
  const isPaid = await checkToken(env, scan.id, token);
  const out = isPaid ? results : stripPaidContent(results);
  return json({ ...out, org_name: scan.org_name, status: scan.status, scan_id: scan.id });
}

// ============================================================
// /api/scan/:id/purchase  → Stripe Checkout
// ============================================================

async function handlePurchase(req: Request, env: Env, scan: ScanRow): Promise<Response> {
  if (scan.status !== 'complete') return err(409, 'scan not complete');
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;
  const session = await createCheckoutSession(env, {
    scanId: scan.id,
    successUrl: `${origin}/?scan_id=${encodeURIComponent(scan.id)}&purchased=true&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/?scan_id=${encodeURIComponent(scan.id)}`,
    orgName: scan.org_name,
  });
  const priceCents = parseInt(env.PRICE_CENTS || '2999', 10);
  await env.DB.prepare(
    'INSERT INTO report_purchases (id, scan_id, stripe_session_id, amount_cents, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(newId('pur'), scan.id, session.id, priceCents, 'pending', Date.now()).run();
  return json({ id: session.id, url: session.url });
}

// ============================================================
// /api/stripe/webhook → mark paid, kick Claude analysis, pre-gen R2 artifacts
// ============================================================

async function handleStripeWebhook(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const sig = req.headers.get('stripe-signature') || '';
  const body = await req.text();
  const v = await verifyStripeSignature(body, sig, env.STRIPE_WEBHOOK_SECRET);
  if (!v.valid) return err(400, 'invalid signature', { reason: v.reason });
  const evt: any = JSON.parse(body);
  if (evt.type === 'checkout.session.completed') {
    const session = evt.data.object;
    const scanId = session.client_reference_id || session.metadata?.scan_id;
    const sessionId = session.id;
    const paymentIntent = session.payment_intent;
    console.log('[webhook] checkout.session.completed', { scanId, sessionId });
    if (scanId && sessionId) {
      const existing = await env.DB.prepare(
        'SELECT status, download_token FROM report_purchases WHERE stripe_session_id = ? LIMIT 1'
      ).bind(sessionId).first<{ status: string; download_token: string | null }>();

      // Smarter idempotency: only short-circuit if paid AND report already exists in R2
      if (existing?.status === 'paid') {
        const reportExists = await env.BUCKET.head(`reports/${scanId}/report.html`);
        if (reportExists) {
          console.log('[webhook] already paid + report exists, skipping', { scanId });
          return json({ received: true, duplicate: true, report_ready: true });
        }
        console.log('[webhook] paid but no report in R2, retrying analysis', { scanId });
        ctx.waitUntil(runPostPurchaseAnalysis(env, scanId, existing.download_token || newDownloadToken()));
        return json({ received: true, retrying: true });
      }

      // First-time payment
      const downloadToken = newDownloadToken();
      await env.DB.prepare(
        `UPDATE report_purchases SET status = ?, paid_at = ?, stripe_payment_intent = ?, download_token = ?
         WHERE stripe_session_id = ?`
      ).bind('paid', Date.now(), paymentIntent || null, downloadToken, sessionId).run();
      console.log('[webhook] marked paid, kicking analysis', { scanId });
      ctx.waitUntil(runPostPurchaseAnalysis(env, scanId, downloadToken));
    }
  }
  return json({ received: true });
}

async function runPostPurchaseAnalysis(env: Env, scanId: string, downloadToken: string): Promise<void> {
  console.log('[post-purchase] enqueuing queue-based analysis', { scanId });
  const heuristic = await getResults(env, scanId);
  if (!heuristic) { console.error('[post-purchase] no heuristic results to enqueue', { scanId }); return; }

  const totalControls = CONTROLS.length;

  // Reset/init progress row (clean slate for retries)
  await env.DB.prepare(
    `INSERT INTO scan_ai_progress (scan_id, total_controls, completed_controls, download_token)
     VALUES (?, ?, 0, ?)
     ON CONFLICT(scan_id) DO UPDATE SET
       total_controls = excluded.total_controls,
       completed_controls = 0,
       download_token = excluded.download_token,
       completed_at = NULL`
  ).bind(scanId, totalControls, downloadToken).run();

  // Clear any previous partial control results to allow clean retry
  await env.DB.prepare('DELETE FROM scan_ai_controls WHERE scan_id = ?').bind(scanId).run();

  // Enqueue one message per control — each will be processed by the queue consumer
  await env.ANALYSIS_QUEUE.sendBatch(
    CONTROLS.map((c) => ({
      body: { kind: 'analyze_control' as const, scanId, controlId: c.id, downloadToken, totalControls },
    }))
  );
  console.log('[post-purchase] enqueued', { scanId, totalControls });
}

// ============================================================
// POST /api/scan/:id/regenerate — manual trigger for stuck scans
// ============================================================

async function handleRegenerate(_req: Request, env: Env, scan: ScanRow, url: URL): Promise<Response> {
  const token = url.searchParams.get('token');
  if (!(await checkToken(env, scan.id, token))) return err(403, 'invalid or missing token');
  const purchase = await getPurchaseByScan(env, scan.id);
  if (!purchase || purchase.status !== 'paid') return err(409, 'scan not paid');
  console.log('[regenerate] manually triggered', { scanId: scan.id });
  await runPostPurchaseAnalysis(env, scan.id, purchase.download_token || '');
  return json({ ok: true, message: 'Analysis re-queued. Report ready in ~3-5 minutes.', scan_id: scan.id });
}

// ============================================================
// /api/scan/:id/report?token=...&format=html|json
// ============================================================

async function handleReport(env: Env, scan: ScanRow, url: URL): Promise<Response> {
  const token = url.searchParams.get('token');
  if (!(await checkToken(env, scan.id, token))) return err(403, 'invalid or missing token');
  const format = url.searchParams.get('format') || 'html';

  // Increment download counter
  if (token) await bumpDownloadCount(env, token);

  const key = format === 'json' ? `reports/${scan.id}/package.json` : `reports/${scan.id}/report.html`;
  const obj = await env.BUCKET.get(key);
  if (!obj) {
    // Pre-gen may still be in flight — render on the fly
    const results = await getResults(env, scan.id);
    if (!results) return err(404, 'no results');
    const editsRows = await env.DB.prepare('SELECT * FROM scan_edits WHERE scan_id = ?').bind(scan.id).all();
    const edits: ScanEdit[] = ((editsRows.results || []) as unknown) as ScanEdit[];
    const { html: out, sha256 } = await buildReportHtml({
      scanId: scan.id,
      orgName: scan.org_name,
      scanCompletedAt: scan.completed_at || Date.now(),
      results,
      edits,
    });
    if (format === 'json') {
      return json({ scan_id: scan.id, org_name: scan.org_name, sha256, generated_at: Date.now(), results });
    }
    return html(out, { headers: { 'content-disposition': `inline; filename="loxeai-report-${scan.id}.html"` } });
  }
  const ct = format === 'json' ? 'application/json' : 'text/html; charset=utf-8';
  return new Response(obj.body, {
    headers: {
      'content-type': ct,
      'content-disposition': `inline; filename="loxeai-report-${scan.id}.${format === 'json' ? 'json' : 'html'}"`,
      'cache-control': 'private, no-store',
    },
  });
}

// ============================================================
// /api/scan/:id/gideon
// ============================================================

async function handleGideon(req: Request, env: Env, scan: ScanRow, url: URL): Promise<Response> {
  if (!(await checkToken(env, scan.id, url.searchParams.get('token')))) return err(403, 'invalid token');
  type GideonBody = { question?: string; control_id?: string; context?: string };
  const body = await req.json<GideonBody>().catch((): GideonBody => ({}));
  const results = await getResults(env, scan.id);
  if (!results) return err(404, 'no results');

  // Context mode: only control_id, no question → return pre-baked suggestions
  if (body.control_id && !body.question) {
    return json(gideonContextSuggestions(results, body.control_id));
  }
  if (!body.question) return err(400, 'question or control_id required');
  const resp = await gideonFreeform(env, results, scan.org_name, body.question.slice(0, 800), body.control_id, scan.id);
  return json(resp);
}

// ============================================================
// /api/scan/:id/edit and /edits
// ============================================================

async function handleEdit(req: Request, env: Env, scan: ScanRow, url: URL): Promise<Response> {
  if (!(await checkToken(env, scan.id, url.searchParams.get('token')))) return err(403, 'invalid token');
  type EditBody = { edit_type?: string; target_path?: string; original_value?: string; new_value?: string; note?: string };
  const body = await req.json<EditBody>().catch((): EditBody => ({}));
  if (!body.edit_type || !body.target_path) return err(400, 'edit_type and target_path required');
  const id = newId('edt');
  await env.DB.prepare(
    'INSERT INTO scan_edits (id, scan_id, edit_type, target_path, original_value, new_value, note, created_at) VALUES (?,?,?,?,?,?,?,?)'
  ).bind(id, scan.id, body.edit_type, body.target_path, body.original_value || null, body.new_value || null, body.note || null, Date.now()).run();

  // Invalidate the pre-generated R2 artifact so the next download regenerates with edits
  try { await env.BUCKET.delete(`reports/${scan.id}/report.html`); } catch {}
  try { await env.BUCKET.delete(`reports/${scan.id}/package.json`); } catch {}
  return json({ id });
}

async function handleEdits(env: Env, scan: ScanRow, url: URL): Promise<Response> {
  if (!(await checkToken(env, scan.id, url.searchParams.get('token')))) return err(403, 'invalid token');
  const rows = await env.DB.prepare('SELECT * FROM scan_edits WHERE scan_id = ? ORDER BY created_at DESC').bind(scan.id).all();
  return json({ edits: rows.results });
}

async function handleDeleteEdits(env: Env, scan: ScanRow, url: URL): Promise<Response> {
  if (!(await checkToken(env, scan.id, url.searchParams.get('token')))) return err(403, 'invalid token');
  await env.DB.prepare('DELETE FROM scan_edits WHERE scan_id = ?').bind(scan.id).run();
  try { await env.BUCKET.delete(`reports/${scan.id}/report.html`); } catch {}
  try { await env.BUCKET.delete(`reports/${scan.id}/package.json`); } catch {}
  return json({ ok: true });
}

// ============================================================
// POST /api/scan/:id/gideon/reset — clear conversation history
// ============================================================

async function handleGideonReset(env: Env, scan: ScanRow, url: URL): Promise<Response> {
  if (!(await checkToken(env, scan.id, url.searchParams.get('token')))) return err(403, 'invalid token');
  await env.DB.prepare('DELETE FROM gideon_messages WHERE scan_id = ?').bind(scan.id).run();
  console.log('[gideon:reset] cleared conversation', { scanId: scan.id });
  return json({ ok: true, scan_id: scan.id });
}

// ============================================================
// Queue consumer — analyze one control per invocation
// ============================================================

async function handleAnalyzeControlMessage(env: Env, msg: Extract<QueueMessage, { kind: 'analyze_control' }>): Promise<void> {
  const { scanId, controlId, downloadToken, totalControls } = msg;
  const t0 = Date.now();
  console.log('[queue:analyze_control] start', { scanId, controlId });

  // Idempotency: skip Claude call if result already stored
  const existing = await env.DB.prepare('SELECT control_id FROM scan_ai_controls WHERE scan_id = ? AND control_id = ?')
    .bind(scanId, controlId).first<{ control_id: string }>();
  if (existing) {
    console.log('[queue:analyze_control] already done, skipping', { scanId, controlId });
    await maybeEnqueueAssemble(env, scanId, totalControls, downloadToken);
    return;
  }

  const heuristic = await getResults(env, scanId);
  if (!heuristic) {
    console.error('[queue:analyze_control] no heuristic results', { scanId, controlId });
    throw new Error('no heuristic results — will retry');
  }

  const result = await analyzeControl(env, controlId, heuristic.evidence);
  console.log('[queue:analyze_control] Claude done', { scanId, controlId, status: result.status, ms: Date.now() - t0 });

  await env.DB.prepare('INSERT OR REPLACE INTO scan_ai_controls (scan_id, control_id, result_json, analyzed_at) VALUES (?, ?, ?, ?)')
    .bind(scanId, controlId, JSON.stringify(result), Date.now()).run();

  await maybeEnqueueAssemble(env, scanId, totalControls, downloadToken);
}

async function maybeEnqueueAssemble(env: Env, scanId: string, totalControls: number, downloadToken: string): Promise<void> {
  const row = await env.DB.prepare('SELECT COUNT(*) as cnt FROM scan_ai_controls WHERE scan_id = ?')
    .bind(scanId).first<{ cnt: number }>();
  const done = row?.cnt ?? 0;
  console.log('[queue:analyze_control] progress', { scanId, done, totalControls });
  if (done >= totalControls) {
    console.log('[queue:analyze_control] all controls done, enqueueing assemble', { scanId });
    await env.ANALYSIS_QUEUE.send({ kind: 'assemble_report', scanId, downloadToken });
  }
}

// ============================================================
// Queue consumer — assemble final report once all controls done
// ============================================================

async function handleAssembleReportMessage(env: Env, msg: Extract<QueueMessage, { kind: 'assemble_report' }>): Promise<void> {
  const { scanId, downloadToken } = msg;
  const t0 = Date.now();
  console.log('[queue:assemble_report] start', { scanId });

  const rows = await env.DB.prepare('SELECT control_id, result_json FROM scan_ai_controls WHERE scan_id = ?')
    .bind(scanId).all<{ control_id: string; result_json: string }>();
  if (!rows.results || rows.results.length === 0) {
    console.error('[queue:assemble_report] no control results found', { scanId });
    throw new Error('no control results — will retry');
  }

  const aiControls: ControlAnalysis[] = rows.results.map((r) => JSON.parse(r.result_json));
  console.log('[queue:assemble_report] loaded controls', { scanId, count: aiControls.length });

  const scan = await getScan(env, scanId);
  if (!scan) { console.error('[queue:assemble_report] scan not found', { scanId }); throw new Error('scan not found'); }
  const heuristic = await getResults(env, scanId);
  if (!heuristic) { console.error('[queue:assemble_report] heuristic not found', { scanId }); throw new Error('heuristic not found'); }

  const rollup = rollupExecutive(aiControls);
  const deltaWithHistory = await computeDelta(env, scanId, scan.external_id, rollup.overall_gap_score);
  const annotated = annotateControlsWithDelta(aiControls, deltaWithHistory);

  const finalResults: ScanResults = { controls: annotated, evidence: heuristic.evidence, ...rollup };
  await saveResults(env, scanId, finalResults);
  console.log('[queue:assemble_report] saved AI results to D1', { scanId });

  const editsRows = await env.DB.prepare('SELECT * FROM scan_edits WHERE scan_id = ?').bind(scanId).all();
  const edits: ScanEdit[] = ((editsRows.results || []) as unknown) as ScanEdit[];

  const { html: reportHtml, sha256 } = await buildReportHtml({
    scanId,
    orgName: scan.org_name,
    scanCompletedAt: scan.completed_at || Date.now(),
    results: finalResults,
    delta: deltaWithHistory?.delta,
    edits,
  });
  await env.BUCKET.put(`reports/${scanId}/report.html`, reportHtml, {
    httpMetadata: { contentType: 'text/html; charset=utf-8' },
    customMetadata: { sha256, downloadToken },
  });
  await env.BUCKET.put(
    `reports/${scanId}/package.json`,
    JSON.stringify({ scan_id: scanId, org_name: scan.org_name, sha256, generated_at: Date.now(), results: finalResults, delta: deltaWithHistory?.delta }, null, 2),
    { httpMetadata: { contentType: 'application/json' } }
  );
  await env.DB.prepare('UPDATE scan_ai_progress SET completed_at = ?, completed_controls = total_controls WHERE scan_id = ?')
    .bind(Date.now(), scanId).run();
  console.log('[queue:assemble_report] DONE — wrote report.html + package.json to R2', { scanId, totalMs: Date.now() - t0 });
}

// Touch import to keep getControl in scope for any future inline uses
void getControl;
