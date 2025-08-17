import { Controller, Get } from '@nestjs/common';

@Controller()
export class IndexController {
  @Get()
  index(): string {
    return 'kedge API';
  }

  @Get('healthz')
  healthz(): string {
    return 'OK';
  }
}

@Controller('v1')
export class HealthController {
  @Get('health')
  health(): string {
    return 'OK';
  }
}
