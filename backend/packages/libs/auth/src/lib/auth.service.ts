import {
  Injectable,
  Logger,
  NotImplementedException,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.interface";
import { AuthRepository } from "./auth.repository";


@Injectable()
export class DefaultAuthService implements AuthService {

    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly authRepository: AuthRepository,
    ) {}

    async signIn(message: string, signature: string): Promise<{ accessToken: string}> {
      throw new NotImplementedException();
    }

    async verifySignature(message: string, signature: string, publicKey: string): Promise<boolean> {
        return true;
    }
}

export const AuthServiceProvider = {
  provide: AuthService,
  useClass: DefaultAuthService
}
