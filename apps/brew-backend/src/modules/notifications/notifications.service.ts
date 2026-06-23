import { ForbiddenException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainEvents } from '@brew/contracts';
import { EventBus } from '../../common/events/event-bus';
import { PrivacyService } from '../privacy/privacy.service';

/** Notifications — SMS/push/email. OTP is delegated to Cognito. */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly events: EventBus,
    private readonly privacy: PrivacyService,
  ) {}

  onModuleInit(): void {
    // Transactional notification — no marketing consent required.
    this.events.subscribe(DomainEvents.OrderReady, (evt) => {
      this.logger.log(`[notify] order ready → ${(evt.data as { orderId: string }).orderId}`);
    });
  }

  send(input: {
    customerId: string;
    channel: 'SMS' | 'PUSH' | 'EMAIL';
    purpose: 'TRANSACTIONAL' | 'MARKETING';
    template: string;
  }): { queued: boolean } {
    // Marketing sends are gated on DPDP consent.
    if (input.purpose === 'MARKETING' && !this.privacy.hasConsent(input.customerId, 'MARKETING')) {
      throw new ForbiddenException('No marketing consent');
    }
    this.logger.log(`[notify] ${input.channel}/${input.purpose} → ${input.customerId}`);
    return { queued: true };
  }
}
