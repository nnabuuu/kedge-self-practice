export * from './lib/auth.module';
export * from './lib/auth.service';
export * from './lib/auth.interface';
export * from './lib/auth.repository';
export * from './jwt/jwt-auth.guard';
export * from './jwt/jwt.strategy';
export * from './jwt/teacher.guard';
export * from './jwt/admin.guard';
export * from './jwt/jwt-or-query.guard';
// Use AdminGuard from jwt folder, not lib/guards
