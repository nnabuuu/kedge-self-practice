import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthServiceProvider } from "./auth.service";
import { env } from "../env";
import { JwtStrategy } from '../jwt/jwt.strategy';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { JwtOrQueryGuard } from '../jwt/jwt-or-query.guard';
import { PersistentModule } from '@kedge/persistent';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [
    PassportModule,
    PersistentModule,
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: env().JWT_SECRET,
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  providers: [
    AuthServiceProvider,
    JwtStrategy,
    JwtAuthGuard,
    JwtOrQueryGuard,
    AuthRepository,
  ],
  exports: [
    AuthServiceProvider,
    JwtAuthGuard,
    JwtOrQueryGuard,
    JwtModule,
  ]
})
export class AuthModule {}
