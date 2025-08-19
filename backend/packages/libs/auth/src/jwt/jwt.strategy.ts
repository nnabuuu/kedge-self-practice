import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { env } from '../env';
import { m } from '@kedge/models';
import {JwtPayload} from "jsonwebtoken";

// 定义验证后返回的用户对象类型

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env().JWT_SECRET,  // 使用与 AuthModule 相同的密钥
    });
  }

  async validate(payload: unknown): Promise<JwtPayload> {
    try {
      // 验证 JWT payload
      if (!payload) {
        this.logger.error('JWT payload is empty');
        throw new UnauthorizedException('Invalid token payload');
      }

      // 使用 Zod 验证 payload
      const result = m.auth('jwt_payload').safeParse(payload);
      if (!result.success) {
        throw new UnauthorizedException('Invalid token payload: validation failed');
      }

      const validatedPayload = result.data;

      // 创建用户对象并验证
      // Map 'sub' to 'userId' for consistency with controller expectations
      const user = {
        userId: validatedPayload.sub,  // Map sub to userId
        role: validatedPayload.role,
        sub: validatedPayload.sub,
      };

      // Return the user object with userId for controller use
      return user as any;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
