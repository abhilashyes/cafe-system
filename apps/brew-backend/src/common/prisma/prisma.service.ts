import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { usesPostgres } from '../config/profile';

/**
 * Postgres connection (live profile only). In the demo profile the in-memory
 * repositories are bound instead, so this never connects and the DB/engine are
 * not required — constructing PrismaClient is lazy (no connection until $connect).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    if (!usesPostgres()) return;
    await this.$connect();
    this.logger.log('Connected to Postgres (BREW_PERSISTENCE=postgres)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect().catch(() => undefined);
  }
}
