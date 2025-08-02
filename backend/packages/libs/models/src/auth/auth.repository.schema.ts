import { z } from 'zod';

/**
 * 用户模型
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  wallet_address: z.string(),
  username: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

export type User = z.infer<typeof UserSchema>;

/**
 * 导出所有Auth相关的Schema
 */
export const AuthRepositorySchemas = {
  User: UserSchema
};
