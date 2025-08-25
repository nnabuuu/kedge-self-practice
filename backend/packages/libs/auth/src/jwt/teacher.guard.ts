import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@kedge/models';

@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: UserRole } | undefined;
    // Allow both teachers and admins to access teacher resources
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      throw new ForbiddenException('Only teachers and admins can access this resource');
    }
    return true;
  }
}
