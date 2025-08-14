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
  name: z.string().nullable().optional(), // Name is optional
  account_id: z.string().email().or(z.string().min(1)), // Support email or any non-empty string
  password: z.string(),
  role: UserRoleSchema,
});

export class SignUpDto extends createZodDto(SignUpSchema) {}

const SignInSchema = z.object({
  account_id: z.string().email().or(z.string().min(1)), // Support email or any non-empty string  
  password: z.string(),
});

export class SignInDto extends createZodDto(SignInSchema) {}

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('sign-up')
  @UseGuards(JwtAuthGuard, AdminGuard)
  signUp(@Body() body: SignUpDto): Promise<User> {
    return this.authService.createUser(body.name || null, body.account_id, body.password, body.role);
  }

  @Post('sign-in')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body.account_id, body.password);
  }

  // Frontend-compatible endpoints
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.signIn(body.email, body.password);
    return {
      token: result.accessToken,
      user: { id: result.userId },
    };
  }

  @Post('register')
  async register(@Body() body: { email: string; password: string; name?: string; role?: UserRole }) {
    const user = await this.authService.createUser(
      body.name || null, // Optional display name
      body.email, // account_id (email)
      body.password,
      body.role || 'teacher'
    );
    
    // Generate token for immediate login after registration
    const payload = { sub: user.id, role: user.role };
    const token = await this.jwtService.signAsync(payload);
    
    return {
      token,
      user,
    };
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
