import { User, UserRole } from '@kedge/models';

export abstract class AuthService {
  abstract createUser(
    name: string | null,
    accountId: string,
    password: string,
    role: UserRole,
  ): Promise<User>;

  abstract signIn(
    accountId: string,
    password: string,
  ): Promise<{ accessToken: string; userId: string }>;
}
