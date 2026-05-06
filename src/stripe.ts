// Minimal Stripe helpers for Checkout Sessions + webhook signature verification.
// We avoid the SDK to keep the Worker bundle small.

import type { Env } from './types';

const STRIPE_API = 'https://api.stripe.com/v1';

// Pre-created Stripe Price ID for the $29.99 SOC 2 Readiness Report.
// Lets us update price in Stripe dashboard without redeploying the Worker.
export const DEFAULT_PRICE_ID = 'price_1TTeWHR14CvvPvmFLM3yF9ed';

export async function createCheckoutSession(env: Env, opts: {
  scanId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  orgName?: string;
  priceId?: string;
}): Promise<{ id: string; url: string }> {
  const priceId = opts.priceId || env.STRIPE_PRICE_ID || DEFAULT_PRICE_ID;
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('payment_method_types[0]', 'card');
  params.append('success_url', opts.successUrl);
  params.append('cancel_url', opts.cancelUrl);
  params.append('client_reference_id', opts.scanId);
  params.append('metadata[scan_id]', opts.scanId);
  if (opts.orgName) params.append('metadata[org_name]', opts.orgName);
  if (opts.customerEmail) params.append('customer_email', opts.customerEmail);
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  params.append('payment_intent_data[metadata][scan_id]', opts.scanId);

  const resp = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!resp.ok) {
    throw new Error(`Stripe createCheckoutSession ${resp.status}: ${await resp.text()}`);
  }
  const data: any = await resp.json();
  return { id: data.id, url: data.url };
}

// ---------- Webhook signature verification ----------

const enc = new TextEncoder();

export async function verifyStripeSignature(payload: string, sigHeader: string, secret: string, toleranceSec = 300): Promise<{ valid: boolean; reason?: string }> {
  if (!sigHeader) return { valid: false, reason: 'missing signature' };
  const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return { valid: false, reason: 'malformed signature' };
  const ts = parseInt(t, 10);
  if (!ts || Math.abs(Math.floor(Date.now() / 1000) - ts) > toleranceSec) {
    return { valid: false, reason: 'timestamp outside tolerance' };
  }
  const signed = `${t}.${payload}`;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const macBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signed));
  const mac = Array.from(new Uint8Array(macBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  // constant-time compare
  if (mac.length !== v1.length) return { valid: false, reason: 'sig length mismatch' };
  let mismatch = 0;
  for (let i = 0; i < mac.length; i++) mismatch |= mac.charCodeAt(i) ^ v1.charCodeAt(i);
  return mismatch === 0 ? { valid: true } : { valid: false, reason: 'sig mismatch' };
}
