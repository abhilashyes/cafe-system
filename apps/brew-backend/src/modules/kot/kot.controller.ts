import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoGuard } from '../../common/auth/cognito.guard';
import { KotService } from './kot.service';

@ApiTags('kot-fulfilment')
@Controller({ version: '1' })
@UseGuards(CognitoGuard)
export class KotController {
  constructor(private readonly kot: KotService) {}

  @Get('print-jobs')
  poll(@Query('deviceId') deviceId: string) {
    return this.kot.pollJobs(deviceId);
  }

  @Post('print-jobs/:jobId/ack')
  ack(@Param('jobId') jobId: string, @Body() body: { status: 'PRINTED' | 'FAILED' }) {
    this.kot.ackJob(jobId, body.status);
    return { ok: true };
  }

  @Get('kds/:storeId/tickets')
  tickets(@Param('storeId') storeId: string, @Query('station') station?: string) {
    return this.kot.kdsTickets(storeId, station);
  }
}
