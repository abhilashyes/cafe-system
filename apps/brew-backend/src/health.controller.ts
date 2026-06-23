import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller({ version: '1' })
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'brew-backend', time: new Date().toISOString() };
  }
}
