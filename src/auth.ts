// download_token validation for paid endpoints.
// Tokens are minted in the Stripe webhook handler and stored in
// report_purchases.download_token. They are scan-scoped and single-use-ish
// (download_count incremented per use, but no hard ceiling — we just track).

import type { Env } from './types';

export interface PurchaseRow {
  id: string;
  scan_id: string;
  status: string;
  download_token: string | null;
  download_count: number;
  paid_at: number | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  amount_cents: number;
}

export async function getPurchaseByScan(env: Env, scanId: string): Promise<PurchaseRow | null> {
  return await env.DB.prepare(
    'SELECT * FROM report_purchases WHERE scan_id = ? AND status = "paid" ORDER BY paid_at DESC LIMIT 1'
  ).bind(scanId).first<PurchaseRow>();
}

export async function getPurchaseBySession(env: Env, sessionId: string): Promise<PurchaseRow | null> {
  return await env.DB.prepare('SELECT * FROM report_purchases WHERE stripe_session_id = ? LIMIT 1')
    .bind(sessionId).first<PurchaseRow>();
}

export async function checkToken(env: Env, scanId: string, token: string | null): Promise<boolean> {
  if (!token) return false;
  const row = await env.DB.prepare(
    'SELECT scan_id, status FROM report_purchases WHERE download_token = ? AND scan_id = ? LIMIT 1'
  ).bind(token, scanId).first<{ scan_id: string; status: string }>();
  return !!row && row.status === 'paid';
}

export async function bumpDownloadCount(env: Env, token: string): Promise<void> {
  await env.DB.prepare('UPDATE report_purchases SET download_count = download_count + 1 WHERE download_token = ?')
    .bind(token).run();
}

export function newDownloadToken(): string {
  // crypto.randomUUID is available in Workers runtime
  return crypto.randomUUID().replace(/-/g, '');
}
