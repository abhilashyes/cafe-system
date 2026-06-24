import { Module } from '@nestjs/common';
import { resolvePersistence } from '../../common/config/profile';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import {
  PaymentRepository,
  InMemoryPaymentRepository,
  PrismaPaymentRepository,
} from './payment.repository';

const persistence = resolvePersistence();

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PaymentRepository,
      useClass: persistence === 'postgres' ? PrismaPaymentRepository : InMemoryPaymentRepository,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
