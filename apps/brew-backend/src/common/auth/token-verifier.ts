import { Injectable } from '@nestjs/common';
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import type { Request } from 'express';
import { notConfigured } from '../config/profile';
import type { Principal } from './principal';

/**
 * Verifies the bearer token and resolves the request principal. The active
 * profile selects the implementation (see CommonModule): `MockTokenVerifier` for
 * demo, `FirebaseTokenVerifier` (Identity Platform) for live.
 */
export abstract class TokenVerifier {
  abstract verify(token: string, req: Request): Promise<Principal>;
}

/** Broad permission set granted to the mock principal so dev flows aren't 403'd. */
const DEV_PERMISSIONS = [
  'order:create', 'order:read', 'order:update',
  'payment:create', 'refund:approve', 'loyalty:read', 'kds:bump',
  'inventory:read', 'inventory:write', 'po:create', 'po:approve',
  'report:read:store', 'report:read:region', 'report:read:org', 'report:export',
  'privacy:dsr:manage', 'privacy:audit:read',
];

function csv(value: string | string[] | undefined): string[] | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return value.split(',').map((s) => s.trim());
}

/**
 * Demo verifier: trusts any non-empty bearer token and attaches a stub principal.
 * Tests/clients can override the granted roles/permissions via `x-mock-roles` /
 * `x-mock-permissions` headers to exercise RBAC without a real IdP.
 */
@Injectable()
export class MockTokenVerifier extends TokenVerifier {
  async verify(token: string, req: Request): Promise<Principal> {
    const roles = csv(req.headers['x-mock-roles']) ?? ['CUSTOMER'];
    const permissions = csv(req.headers['x-mock-permissions']) ?? DEV_PERMISSIONS;
    return { subjectId: `mock:${token.slice(0, 8)}`, roles, permissions };
  }
}

const FIREBASE_CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

/**
 * Live verifier for **Firebase Auth / Identity Platform** ID tokens. Phone+OTP
 * (customers) and email/MFA (staff) happen client-side via the Firebase SDK; the
 * client sends the resulting ID token as `Authorization: Bearer <jwt>`. We verify
 * it against Google's public certs (RS256) and check iss/aud/exp, then map the
 * token's custom claims (`roles`, `permissions`) onto the Principal. Custom claims
 * are set per user with the Firebase Admin SDK (staff onboarding / RBAC admin).
 */
interface JwtClaims {
  iss?: string;
  aud?: string;
  sub?: string;
  exp?: number;
  roles?: unknown;
  permissions?: unknown;
}

@Injectable()
export class FirebaseTokenVerifier extends TokenVerifier {
  private readonly projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT;
  private certs: { map: Record<string, string>; expiresAt: number } | null = null;

  async verify(token: string, _req: Request): Promise<Principal> {
    if (!this.projectId) throw notConfigured('Firebase auth', 'M2 (set FIREBASE_PROJECT_ID)');

    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed JWT');
    const [rawHeader, rawPayload, rawSig] = parts;

    const header = decode(rawHeader) as { alg?: string; kid?: string };
    if (header.alg !== 'RS256' || !header.kid) throw new Error('Unexpected token header');

    // Verify the RS256 signature against Google's public cert for this key id.
    const publicKey = createPublicKey(await this.certFor(header.kid));
    const ok = cryptoVerify(
      'RSA-SHA256',
      Buffer.from(`${rawHeader}.${rawPayload}`),
      publicKey,
      Buffer.from(rawSig, 'base64url'),
    );
    if (!ok) throw new Error('Invalid signature');

    // Validate the standard Firebase claims.
    const claims = decode(rawPayload) as JwtClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== `https://securetoken.google.com/${this.projectId}`) throw new Error('Bad issuer');
    if (claims.aud !== this.projectId) throw new Error('Bad audience');
    if (typeof claims.exp !== 'number' || claims.exp < now) throw new Error('Token expired');
    if (!claims.sub) throw new Error('Token missing subject');

    const roles = Array.isArray(claims.roles) ? (claims.roles as string[]) : ['CUSTOMER'];
    const permissions = Array.isArray(claims.permissions) ? (claims.permissions as string[]) : undefined;
    return { subjectId: claims.sub, roles, permissions };
  }

  /** Fetch + cache Google's signing certs (honouring Cache-Control max-age). */
  private async certFor(kid: string): Promise<string> {
    if (!this.certs || this.certs.expiresAt < Date.now()) {
      const res = await fetch(FIREBASE_CERT_URL);
      if (!res.ok) throw new Error(`Firebase cert fetch failed: ${res.status}`);
      const map = (await res.json()) as Record<string, string>;
      const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1] ?? 3600);
      this.certs = { map, expiresAt: Date.now() + maxAge * 1000 };
    }
    const cert = this.certs.map[kid];
    if (!cert) throw new Error(`Unknown Firebase key id ${kid}`);
    return cert;
  }
}

/** Decode a base64url JWT segment to JSON. */
function decode(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
}
