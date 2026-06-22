import { Test } from '@nestjs/testing';
import { EventBus } from '../../common/events/event-bus';
import { LoyaltyService } from './loyalty.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [LoyaltyService, EventBus],
    }).compile();
    service = moduleRef.get(LoyaltyService);
    service.onModuleInit();
  });

  it('exposes exactly 5 membership tiers', () => {
    expect(service.listTiers()).toHaveLength(5);
  });

  it('starts a new customer at the Welcome tier with zero stars', () => {
    const account = service.getAccount('cust_1');
    expect(account.tierId).toBe('t1');
    expect(account.balanceStars).toBe(0);
  });

  it('accrues stars and upgrades tier when a payment is captured', async () => {
    const events = new EventBus();
    const moduleRef = await Test.createTestingModule({
      providers: [LoyaltyService, { provide: EventBus, useValue: events }],
    }).compile();
    const svc = moduleRef.get(LoyaltyService);
    svc.onModuleInit();

    await events.publish({
      name: 'payment.captured',
      storeId: 'store_1',
      occurredAt: new Date().toISOString(),
      eventId: 'evt_1',
      data: { orderId: 'o1', customerId: 'cust_2', amountPaise: 600000 },
    });

    const account = svc.getAccount('cust_2');
    expect(account.balanceStars).toBeGreaterThan(0);
    // ₹5000 spend crosses the Green threshold (500000 paise).
    expect(account.tierId).toBe('t2');
    expect(svc.getLedger('cust_2')).toHaveLength(1);
  });
});
