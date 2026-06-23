import { Global, Logger, Module } from '@nestjs/common';
import { EventBus } from './events/event-bus';
import { AuthAdapter, LiveAuthAdapter, MockAuthAdapter } from './adapters/auth.adapter';
import { PaymentAdapter, LivePaymentAdapter, MockPaymentAdapter } from './adapters/payment.adapter';
import { BREW_PROFILE, resolveProfile } from './config/profile';

/**
 * Cross-cutting providers shared by every module. The active runtime profile
 * (BREW_PROFILE, default `demo`) selects the implementation bound to each port —
 * mock adapters for `demo`, real adapters for `live` — at this single
 * composition root, so module code stays profile-agnostic. Real implementations
 * are added alongside the mocks (never replace them), keeping the demo working
 * as live integrations land (M1 "Demo continuity" constraint).
 */
const profile = resolveProfile();
new Logger('CommonModule').log(`Runtime profile: ${profile}`);

@Global()
@Module({
  providers: [
    EventBus,
    { provide: BREW_PROFILE, useValue: profile },
    { provide: AuthAdapter, useClass: profile === 'live' ? LiveAuthAdapter : MockAuthAdapter },
    { provide: PaymentAdapter, useClass: profile === 'live' ? LivePaymentAdapter : MockPaymentAdapter },
  ],
  exports: [EventBus, AuthAdapter, PaymentAdapter, BREW_PROFILE],
})
export class CommonModule {}
