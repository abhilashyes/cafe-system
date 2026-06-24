import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller({ path: 'notifications', version: '1' })
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('send')
  send(
    @Body()
    body: {
      customerId: string;
      channel: 'SMS' | 'PUSH' | 'EMAIL';
      purpose: 'TRANSACTIONAL' | 'MARKETING';
      template: string;
    },
  ) {
    return this.notifications.send(body);
  }
}
