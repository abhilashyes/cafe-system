import { BrewClient } from '@brew/contracts';

/** All app data flows through the published contracts SDK (API-first). */
export const api = new BrewClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  // Dev: any token is accepted by the mock Cognito guard.
  getAccessToken: async () => localStorage.getItem('brew.accessToken') ?? 'dev-token',
});
