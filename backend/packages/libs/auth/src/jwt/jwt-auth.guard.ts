import { createParamDecorator, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Decorator
export const ParseUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log(`request.user: ${JSON.stringify(request.user)}`);
    return request.user;
  },
);