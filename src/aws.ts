// AWS SigV4 signing + STS AssumeRole — pure Web Crypto, no SDK
// Used by all 15 service scanners to call AWS APIs directly via fetch().

import type { AwsCredentials } from './types';

const enc = new TextEncoder();

// ---------------- crypto helpers ----------------

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', k, enc.encode(data));
}

async function sha256Hex(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return toHex(new Uint8Array(buf));
}

function toHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------- SigV4 ----------------

export interface SignedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface SignParams {
  service: string;            // e.g. 'iam', 's3', 'sts', 'guardduty'
  region: string;             // e.g. 'us-east-1'
  method: string;             // GET / POST
  host: string;               // e.g. 'iam.amazonaws.com'
  path: string;               // e.g. '/'
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  credentials: AwsCredentials;
}

export async function signRequest(p: SignParams): Promise<SignedRequest> {
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[:\-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  const body = p.body || '';
  const payloadHash = await sha256Hex(body);

  const headers: Record<string, string> = {
    host: p.host,
    'x-amz-date': amzDate,
    ...(p.headers || {}),
  };
  if (p.credentials.sessionToken) {
    headers['x-amz-security-token'] = p.credentials.sessionToken;
  }
  // Most AWS APIs don't require x-amz-content-sha256 except S3, but it's safe to include.
  headers['x-amz-content-sha256'] = payloadHash;

  // Canonical query string
  const sortedQuery = p.query
    ? Object.keys(p.query)
        .sort()
        .map((k) => `${encodeRfc3986(k)}=${encodeRfc3986(p.query![k])}`)
        .join('&')
    : '';

  // Canonical headers
  const headerKeys = Object.keys(headers).map((k) => k.toLowerCase()).sort();
  const canonicalHeaders =
    headerKeys
      .map((k) => `${k}:${String(headers[Object.keys(headers).find((x) => x.toLowerCase() === k)!]).trim().replace(/\s+/g, ' ')}`)
      .join('\n') + '\n';
  const signedHeaders = headerKeys.join(';');

  const canonicalRequest = [
    p.method.toUpperCase(),
    p.path || '/',
    sortedQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${p.region}/${p.service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  // Derive signing key
  const kDate = await hmac(enc.encode('AWS4' + p.credentials.secretAccessKey), dateStamp);
  const kRegion = await hmac(kDate, p.region);
  const kService = await hmac(kRegion, p.service);
  const kSigning = await hmac(kService, 'aws4_request');
  const sigBuf = await hmac(kSigning, stringToSign);
  const signature = toHex(new Uint8Array(sigBuf));

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${p.credentials.accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  headers['Authorization'] = authHeader;

  const url = `https://${p.host}${p.path || '/'}${sortedQuery ? '?' + sortedQuery : ''}`;
  return { url, method: p.method.toUpperCase(), headers, body };
}

function encodeRfc3986(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

// ---------------- STS AssumeRole ----------------

export async function assumeRoleWith(
  callerCreds: { accessKeyId: string; secretAccessKey: string; sessionToken?: string },
  roleArn: string,
  externalId: string,
  sessionName: string = 'LoxeAIPilotScan'
): Promise<AwsCredentials> {
  const params = new URLSearchParams({
    Action: 'AssumeRole',
    Version: '2011-06-15',
    RoleArn: roleArn,
    RoleSessionName: sessionName,
    ExternalId: externalId,
    DurationSeconds: '3600',
  });
  const body = params.toString();

  const signed = await signRequest({
    service: 'sts',
    region: 'us-east-1',
    method: 'POST',
    host: 'sts.amazonaws.com',
    path: '/',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    credentials: {
      accessKeyId: callerCreds.accessKeyId,
      secretAccessKey: callerCreds.secretAccessKey,
      sessionToken: callerCreds.sessionToken || '',
    },
  });

  const resp = await fetch(signed.url, {
    method: signed.method,
    headers: signed.headers,
    body: signed.body,
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`AssumeRole failed (${resp.status}): ${text.slice(0, 500)}`);
  }

  // Quick & dirty XML parse — AWS XML is well-formed and predictable here.
  const get = (tag: string): string => {
    const m = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return m ? m[1].trim() : '';
  };
  const accessKeyId = get('AccessKeyId');
  const secretAccessKey = get('SecretAccessKey');
  const sessionToken = get('SessionToken');
  const expiration = get('Expiration');
  if (!accessKeyId || !secretAccessKey || !sessionToken) {
    throw new Error(`AssumeRole response missing fields: ${text.slice(0, 500)}`);
  }
  return { accessKeyId, secretAccessKey, sessionToken, expiration };
}

// ---------------- High-level signed request helper ----------------

export interface AwsRequestOpts {
  service: string;
  region: string;
  host?: string; // override
  method?: string;
  path?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  credentials: AwsCredentials;
  timeoutMs?: number;
}

export async function awsRequest(opts: AwsRequestOpts): Promise<{ status: number; body: string; headers: Headers }> {
  const host = opts.host || defaultHost(opts.service, opts.region);
  const signed = await signRequest({
    service: opts.service,
    region: opts.region,
    method: opts.method || 'GET',
    host,
    path: opts.path || '/',
    query: opts.query,
    headers: opts.headers,
    body: opts.body,
    credentials: opts.credentials,
  });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), opts.timeoutMs || 10000);
  try {
    const r = await fetch(signed.url, {
      method: signed.method,
      headers: signed.headers,
      body: signed.body,
      signal: ctrl.signal,
    });
    const body = await r.text();
    return { status: r.status, body, headers: r.headers };
  } finally {
    clearTimeout(timeout);
  }
}

export function defaultHost(service: string, region: string): string {
  // Service endpoint hostname rules for the services we scan
  switch (service) {
    case 'iam':            return 'iam.amazonaws.com'; // global
    case 'sts':            return 'sts.amazonaws.com'; // global (use regional for STS in prod)
    case 's3':             return 's3.amazonaws.com';  // we'll scan with us-east-1 region for SigV4
    case 'cloudtrail':     return `cloudtrail.${region}.amazonaws.com`;
    case 'config':         return `config.${region}.amazonaws.com`;
    case 'ec2':            return `ec2.${region}.amazonaws.com`;
    case 'monitoring':     // CloudWatch
    case 'cloudwatch':     return `monitoring.${region}.amazonaws.com`;
    case 'kms':            return `kms.${region}.amazonaws.com`;
    case 'lambda':         return `lambda.${region}.amazonaws.com`;
    case 'rds':            return `rds.${region}.amazonaws.com`;
    case 'sns':            return `sns.${region}.amazonaws.com`;
    case 'guardduty':      return `guardduty.${region}.amazonaws.com`;
    case 'securityhub':    return `securityhub.${region}.amazonaws.com`;
    case 'sso':            return `sso.${region}.amazonaws.com`;
    case 'sso-admin':      return `sso.${region}.amazonaws.com`;
    case 'identitystore':  return `identitystore.${region}.amazonaws.com`;
    case 'secretsmanager': return `secretsmanager.${region}.amazonaws.com`;
    case 'wafv2':          return `wafv2.${region}.amazonaws.com`;
    case 'waf':            return `wafv2.${region}.amazonaws.com`;
    default: return `${service}.${region}.amazonaws.com`;
  }
}
