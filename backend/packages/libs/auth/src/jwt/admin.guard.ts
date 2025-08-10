import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@kedge/models';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Only admins can access this resource');
    }
    return true;
  }
}
