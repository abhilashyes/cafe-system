import { Test } from '@nestjs/testing';
import { resolveProfile, isDemo, isLive } from './profile';
import { CommonModule } from '../common.module';
import { AuthAdapter, MockAuthAdapter } from '../adapters/auth.adapter';
import { PaymentAdapter, MockPaymentAdapter } from '../adapters/payment.adapter';

describe('runtime profile', () => {
  describe('resolveProfile', () => {
    it('defaults to demo when unset', () => {
      expect(resolveProfile({})).toBe('demo');
      expect(isDemo({})).toBe(true);
      expect(isLive({})).toBe(false);
    });

    it('accepts demo aliases', () => {
      for (const v of ['demo', 'mock', 'dev', '', '  DEMO  ']) {
        expect(resolveProfile({ BREW_PROFILE: v })).toBe('demo');
      }
    });

    it('accepts live aliases', () => {
      for (const v of ['live', 'prod', 'production', 'LIVE']) {
        expect(resolveProfile({ BREW_PROFILE: v })).toBe('live');
      }
    });

    it('rejects unknown values', () => {
      expect(() => resolveProfile({ BREW_PROFILE: 'staging' })).toThrow(/Unknown BREW_PROFILE/);
    });
  });

  describe('composition root (default demo)', () => {
    it('binds the mock adapters', async () => {
      const moduleRef = await Test.createTestingModule({ imports: [CommonModule] }).compile();
      expect(moduleRef.get(AuthAdapter)).toBeInstanceOf(MockAuthAdapter);
      expect(moduleRef.get(PaymentAdapter)).toBeInstanceOf(MockPaymentAdapter);
    });
  });
});
