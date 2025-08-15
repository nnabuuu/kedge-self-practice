import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';

/**
 * Custom JWT guard that accepts token from either:
 * 1. Authorization header (standard Bearer token)
 * 2. Query parameter 'token' (for image/file requests from <img> tags)
 */
@Injectable()
export class JwtOrQueryGuard extends AuthGuard('jwt') {
  constructor(private jwtService: JwtService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // First, try standard JWT auth from header
    try {
      const result = await super.canActivate(context);
      if (result) return true;
    } catch (error) {
      // If header auth fails, try query parameter
    }

    // Try to get token from query parameter
    const token = request.query?.token;
    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify the token
      const payload = this.jwtService.verify(token);
      
      // Attach user to request (similar to what Passport does)
      request.user = payload;
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}