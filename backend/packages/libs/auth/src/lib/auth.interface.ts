import { User, UserRole } from '@kedge/models';

export abstract class AuthService {
  abstract createUser(
    name: string | null,
    accountId: string,
    password: string,
    role: UserRole,
    userClass?: string | null,
  ): Promise<User>;

  abstract signIn(
    accountId: string,
    password: string,
  ): Promise<{ accessToken: string; userId: string }>;
  
  abstract validatePassword(
    accountId: string,
    password: string,
  ): Promise<boolean>;
  
  abstract updateUserPassword(
    userId: string,
    newPassword: string,
  ): Promise<void>;
}
