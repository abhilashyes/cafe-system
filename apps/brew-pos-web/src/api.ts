import { BrewClient } from '@brew/contracts';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

/** The store this terminal is bound to (from config in a real deployment). */
export const STORE_ID = import.meta.env.VITE_STORE_ID ?? 'store_1';

/** All app data flows through the published contracts SDK (API-first). */
export const api = new BrewClient({
  baseUrl: API_BASE_URL,
  // Dev: any token is accepted by the mock Cognito guard.
  getAccessToken: async () => localStorage.getItem('brew.accessToken') ?? 'dev-token',
});
