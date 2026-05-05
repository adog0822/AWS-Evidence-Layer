import { describe, it, expect } from 'vitest';
import { newDownloadToken } from '../src/auth';

describe('newDownloadToken', () => {
  it('generates a 32-character hex string', () => {
    const token = newDownloadToken();
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generates unique tokens on every call', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => newDownloadToken()));
    expect(tokens.size).toBe(100);
  });
});
