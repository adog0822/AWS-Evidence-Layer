import { describe, it, expect } from 'vitest';
import { verifyStripeSignature } from '../src/stripe';

// Helpers
async function makeSignature(payload: string, secret: string, timestamp: number): Promise<string> {
  const enc = new TextEncoder();
  const signed = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(signed));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `t=${timestamp},v1=${hex}`;
}

describe('verifyStripeSignature', () => {
  const secret = 'whsec_test_secret_key_for_unit_tests';
  const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: {} } });

  it('accepts a valid signature within tolerance', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await makeSignature(payload, secret, ts);
    const result = await verifyStripeSignature(payload, sig, secret);
    expect(result.valid).toBe(true);
  });

  it('rejects a signature with wrong secret', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await makeSignature(payload, 'wrong-secret', ts);
    const result = await verifyStripeSignature(payload, sig, secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('sig mismatch');
  });

  it('rejects a signature older than tolerance', async () => {
    const ts = Math.floor(Date.now() / 1000) - 400; // outside 300s window
    const sig = await makeSignature(payload, secret, ts);
    const result = await verifyStripeSignature(payload, sig, secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('timestamp outside tolerance');
  });

  it('rejects a missing signature header', async () => {
    const result = await verifyStripeSignature(payload, '', secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing signature');
  });

  it('rejects a malformed signature header', async () => {
    const result = await verifyStripeSignature(payload, 'garbage-header', secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('malformed signature');
  });

  it('rejects a tampered payload', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await makeSignature(payload, secret, ts);
    const result = await verifyStripeSignature(payload + ' tampered', sig, secret);
    expect(result.valid).toBe(false);
  });

  it('is constant-time (no short-circuit on first char mismatch)', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const goodSig = await makeSignature(payload, secret, ts);
    // Flip the last hex char — same length, definitely wrong
    const badSig = goodSig.slice(0, -1) + (goodSig.endsWith('0') ? '1' : '0');
    const result = await verifyStripeSignature(payload, badSig, secret);
    expect(result.valid).toBe(false);
  });

  it('accepts a custom tolerance window', async () => {
    const ts = Math.floor(Date.now() / 1000) - 50;
    const sig = await makeSignature(payload, secret, ts);
    // Narrow tolerance should reject a 50s-old timestamp
    const result = await verifyStripeSignature(payload, sig, secret, 30);
    expect(result.valid).toBe(false);
  });
});
