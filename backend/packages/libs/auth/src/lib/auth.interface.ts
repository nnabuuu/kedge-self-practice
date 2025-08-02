import { User, UserRole } from '@kedge/models';

export abstract class AuthService {
  abstract createUser(
    name: string,
    password: string,
    role: UserRole,
  ): Promise<User>;

  abstract signIn(
    name: string,
    password: string,
  ): Promise<{ accessToken: string; userId: string }>;
}
