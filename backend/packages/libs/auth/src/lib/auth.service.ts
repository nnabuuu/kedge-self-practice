import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { AuthService } from './auth.interface';
import { AuthRepository } from './auth.repository';
import { User, UserRole } from '@kedge/models';


@Injectable()
export class DefaultAuthService implements AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
  ) {}

  async createUser(
    name: string | null,
    accountId: string,
    password: string,
    role: UserRole,
  ): Promise<User> {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return this.authRepository.createUser({
      name,
      accountId,
      passwordHash,
      salt,
      role,
    });
  }

  async signIn(
    accountId: string,
    password: string,
  ): Promise<{ accessToken: string; userId: string }> {
    const user = await this.authRepository.findUserByAccountId(accountId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordHash = pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    if (passwordHash !== user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      userId: user.id,
    };
  }
}

export const AuthServiceProvider = {
  provide: AuthService,
  useClass: DefaultAuthService
}
