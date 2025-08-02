export abstract class AuthService {
  abstract signIn(message: string, signature: string): Promise<{ accessToken: string, userId?: string }>;
}
