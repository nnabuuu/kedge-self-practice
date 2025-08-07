import { z } from 'zod';

export const UserRoleSchema = z.enum(['student', 'teacher'])
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: UserRoleSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const UserWithCredentialsSchema = UserSchema.extend({
  password_hash: z.string(),
  salt: z.string(),
});

export type UserWithCredentials = z.infer<typeof UserWithCredentialsSchema>;

/**
 * All auth related schemas
 */
export const AuthRepositorySchemas = {
  User: UserSchema,
  UserRole: UserRoleSchema,
  UserWithCredentials: UserWithCredentialsSchema,
};
