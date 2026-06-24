import { Injectable, Logger } from '@nestjs/common';
import { notConfigured } from '../config/profile';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Port for phone+OTP auth. Prod impl = AWS Cognito; dev impl = mock. */
export abstract class AuthAdapter {
  abstract startOtp(phone: string): Promise<void>;
  abstract verifyOtp(phone: string, code: string): Promise<AuthTokens>;
}

/**
 * Mock Cognito adapter. Accepts OTP "000000" for any phone and returns fake
 * tokens. OTP throttling (anti SMS-bombing) is enforced at the gateway/Redis
 * in prod; here we only log.
 */
@Injectable()
export class MockAuthAdapter extends AuthAdapter {
  private readonly logger = new Logger(MockAuthAdapter.name);

  async startOtp(phone: string): Promise<void> {
    this.logger.log(`[mock] OTP sent to ${phone} (use 000000)`);
  }

  async verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    if (code !== '000000') throw new Error('Invalid OTP');
    return { accessToken: `mock-access.${phone}`, refreshToken: `mock-refresh.${phone}` };
  }
}

/**
 * Live auth adapter (selected by BREW_PROFILE=live). With **Firebase Auth /
 * Identity Platform** the phone+OTP and email/MFA flows run **client-side** via
 * the Firebase SDK — the server does not initiate OTP. The server's job is to
 * *verify* the resulting ID token, which is handled by `FirebaseTokenVerifier`
 * (see auth/token-verifier.ts), not this adapter. These server-initiated OTP
 * methods are therefore unused in the Firebase flow and fail loudly if called.
 */
@Injectable()
export class LiveAuthAdapter extends AuthAdapter {
  async startOtp(_phone: string): Promise<void> {
    throw notConfigured('Server-initiated OTP (Firebase does phone OTP client-side)', 'M2');
  }

  async verifyOtp(_phone: string, _code: string): Promise<AuthTokens> {
    throw notConfigured('Server-initiated OTP (Firebase does phone OTP client-side)', 'M2');
  }
}
