import { Controller, Get } from '@nestjs/common';

@Controller()
export class IndexController {
  @Get()
  index(): string {
    return 'kedge API';
  }

  @Get('healthz')
  health(): string {
    return 'OK';
  }
}
