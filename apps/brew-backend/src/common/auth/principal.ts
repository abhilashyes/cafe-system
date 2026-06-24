/** Authenticated principal attached to the request by the AuthGuard. */
export interface Principal {
  /** Stable subject id (Firebase uid in live, mock:* in demo). */
  subjectId: string;
  /** Role keys (from Firebase custom claims in live). */
  roles: string[];
  /** Granular permissions; when absent, RBAC relies on roles. */
  permissions?: string[];
}
