import { Body, Controller, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AuthService } from '@kedge/auth';
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
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() body: SignUpDto): Promise<User> {
    return this.authService.createUser(body.name, body.password, body.role);
  }

  @Post('sign-in')
  signIn(@Body() body: SignInDto) {
    return this.authService.signIn(body.name, body.password);
  }
}
