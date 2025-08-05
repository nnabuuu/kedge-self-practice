import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from '@kedge/auth';
import { AuthController } from './auth.controller';
import { IndexController } from './index.controller';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [
    AuthController,
    IndexController,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    }
  ],
})
export class AppModule {}
