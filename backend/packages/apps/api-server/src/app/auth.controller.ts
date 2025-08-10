import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuthService, JwtAuthGuard, AdminGuard } from '@kedge/auth';
import { User, UserRole, UserRoleSchema } from '@kedge/models';

const SignUpSchema = z.object({
  name: z.string(),
  password: z.string(),
  role: UserRoleSchema,
});

export class SignUpDto extends createZodDto(SignUpSchema) {}

const SignInSchema = z.object({
  name: z.string(),
  password: z.string(),
});

export class SignInDto extends createZodDto(SignInSchema) {}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('sign-up')
  @UseGuards(JwtAuthGuard, AdminGuard)
  signUp(@Body() body: SignUpDto): Promise<User> {
    return this.authService.createUser(body.name, body.password, body.role);
  }

  @Post('sign-in')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body.name, body.password);
  }

  @Post('mock-admin-sign-in')
  async mockAdminSignIn(@Req() req: Request) {
    const ip = req.ip;
    if (
      ip !== '127.0.0.1' &&
      ip !== '::1' &&
      ip !== '::ffff:127.0.0.1'
    ) {
      throw new NotFoundException();
    }

    const payload = { sub: 'mock-admin', role: 'admin' as UserRole };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      userId: 'mock-admin',
    };
  }
}
