import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global so any module's Prisma-backed repository can inject PrismaService. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
