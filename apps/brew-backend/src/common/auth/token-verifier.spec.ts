import type { Request } from 'express';
import { MockTokenVerifier, FirebaseTokenVerifier } from './token-verifier';

const reqWith = (headers: Record<string, string> = {}): Request =>
  ({ headers } as unknown as Request);

describe('MockTokenVerifier (demo)', () => {
  const verifier = new MockTokenVerifier();

  it('trusts any token and defaults to CUSTOMER', async () => {
    const principal = await verifier.verify('abcdef123', reqWith());
    expect(principal.subjectId).toBe('mock:abcdef12');
    expect(principal.roles).toEqual(['CUSTOMER']);
    expect(principal.permissions).toContain('order:create');
  });

  it('honours x-mock-roles / x-mock-permissions overrides', async () => {
    const principal = await verifier.verify('t', reqWith({
      'x-mock-roles': 'STORE_MANAGER, FINANCE_ANALYST',
      'x-mock-permissions': 'report:read:org',
    }));
    expect(principal.roles).toEqual(['STORE_MANAGER', 'FINANCE_ANALYST']);
    expect(principal.permissions).toEqual(['report:read:org']);
  });
});

describe('FirebaseTokenVerifier (live)', () => {
  it('fails loudly when no project id is configured', async () => {
    const prev = { fp: process.env.FIREBASE_PROJECT_ID, gp: process.env.GOOGLE_CLOUD_PROJECT };
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    try {
      const verifier = new FirebaseTokenVerifier();
      await expect(verifier.verify('whatever', reqWith())).rejects.toThrow(/not configured/i);
    } finally {
      if (prev.fp) process.env.FIREBASE_PROJECT_ID = prev.fp;
      if (prev.gp) process.env.GOOGLE_CLOUD_PROJECT = prev.gp;
    }
  });

  it('rejects a malformed token', async () => {
    process.env.FIREBASE_PROJECT_ID = 'brew-test';
    try {
      const verifier = new FirebaseTokenVerifier();
      await expect(verifier.verify('not-a-jwt', reqWith())).rejects.toThrow();
    } finally {
      delete process.env.FIREBASE_PROJECT_ID;
    }
  });
});
