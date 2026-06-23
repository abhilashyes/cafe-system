import { Global, Module } from '@nestjs/common';
import { EventBus } from './events/event-bus';
import { AuthAdapter, MockAuthAdapter } from './adapters/auth.adapter';
import { PaymentAdapter, MockPaymentAdapter } from './adapters/payment.adapter';

/**
 * Cross-cutting providers shared by every module: event bus + the mock adapters.
 * Swap the `useClass` for prod adapters (Cognito/Razorpay) via env/DI later.
 */
@Global()
@Module({
  providers: [
    EventBus,
    { provide: AuthAdapter, useClass: MockAuthAdapter },
    { provide: PaymentAdapter, useClass: MockPaymentAdapter },
  ],
  exports: [EventBus, AuthAdapter, PaymentAdapter],
})
export class CommonModule {}
