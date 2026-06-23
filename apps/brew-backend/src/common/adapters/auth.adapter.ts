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
 * Live AWS Cognito adapter (selected by BREW_PROFILE=live). The real
 * implementation — Cognito user-pool sign-up/sign-in, SMS OTP, JWKS-backed token
 * issuance — lands in milestone M2. The class exists now so the composition root
 * can bind it; calling it before M2 fails loudly via `notConfigured`.
 */
@Injectable()
export class LiveAuthAdapter extends AuthAdapter {
  async startOtp(_phone: string): Promise<void> {
    throw notConfigured('Cognito auth', 'M2 (Identity & access)');
  }

  async verifyOtp(_phone: string, _code: string): Promise<AuthTokens> {
    throw notConfigured('Cognito auth', 'M2 (Identity & access)');
  }
}
