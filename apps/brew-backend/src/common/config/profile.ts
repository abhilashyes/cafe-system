/**
 * Runtime profile — the composition-root switch that keeps the mocked demo
 * working as real persistence/integrations land (see the M1 "Demo continuity"
 * constraint).
 *
 * - `demo` (default): in-memory repositories + mock adapters (Cognito/Razorpay/
 *   printer). No external services required; the GitHub Pages demo and the §12
 *   demo flow run entirely on this profile.
 * - `live`: real adapters/persistence wired at the composition root. Real
 *   implementations are *added alongside* the mocks and selected here — the mock
 *   path is never deleted.
 *
 * Profiles are selected at the composition root only; module/service code stays
 * profile-agnostic (it depends on the abstract port, not the implementation).
 */
export type BrewProfile = 'demo' | 'live';

/** DI token for injecting the resolved profile where code needs to branch. */
export const BREW_PROFILE = 'BREW_PROFILE';

/**
 * Resolve the active profile from the environment. Defaults to `demo` so a bare
 * checkout (and CI) runs the mocked system with zero configuration.
 */
export function resolveProfile(env: NodeJS.ProcessEnv = process.env): BrewProfile {
  const raw = (env.BREW_PROFILE ?? 'demo').trim().toLowerCase();
  if (raw === '' || raw === 'demo' || raw === 'mock' || raw === 'dev') return 'demo';
  if (raw === 'live' || raw === 'prod' || raw === 'production') return 'live';
  throw new Error(`Unknown BREW_PROFILE="${raw}" (expected "demo" or "live")`);
}

export const isLive = (env?: NodeJS.ProcessEnv): boolean => resolveProfile(env) === 'live';
export const isDemo = (env?: NodeJS.ProcessEnv): boolean => resolveProfile(env) === 'demo';

/**
 * Persistence is selected INDEPENDENTLY of the auth/payments profile so the
 * platform can roll out in stages — e.g. a real Postgres database while login
 * and payments are still mocked (BREW_PROFILE=demo + BREW_PERSISTENCE=postgres).
 *
 * - `memory` (default): in-memory repositories (no DB needed).
 * - `postgres`: Prisma/Postgres repositories (requires DATABASE_URL).
 */
export type BrewPersistence = 'memory' | 'postgres';

export function resolvePersistence(env: NodeJS.ProcessEnv = process.env): BrewPersistence {
  const raw = (env.BREW_PERSISTENCE ?? '').trim().toLowerCase();
  if (raw === '' || raw === 'memory' || raw === 'inmemory') return 'memory';
  if (raw === 'postgres' || raw === 'postgresql' || raw === 'pg') return 'postgres';
  throw new Error(`Unknown BREW_PERSISTENCE="${raw}" (expected "memory" or "postgres")`);
}

export const usesPostgres = (env?: NodeJS.ProcessEnv): boolean =>
  resolvePersistence(env) === 'postgres';

/**
 * Error thrown by `live`-profile adapters whose real integration is not yet
 * implemented/configured. Makes the seam explicit: selecting `live` before the
 * milestone that wires the integration fails loudly rather than silently mocking.
 */
export function notConfigured(service: string, milestone: string): Error {
  return new Error(
    `${service} is not configured for the "live" profile yet (lands in ${milestone}). ` +
      `Use BREW_PROFILE=demo for the mocked system.`,
  );
}
