// Polyfill Workers runtime globals that Node doesn't have by default.
// crypto.subtle and crypto.randomUUID are available in Node 19+, but
// we polyfill getRandomValues for Node 18 compatibility.

import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  // @ts-expect-error — Node 18 polyfill
  globalThis.crypto = webcrypto;
}
