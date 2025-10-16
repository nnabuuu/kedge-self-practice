import { z } from 'zod';
import { UserRoleSchema } from './auth.repository.schema';

/**
 * Sign up request schema
 */
export const SignUpSchema = z.object({
  name: z.string().nullable().optional(), // Name is optional
  account_id: z.string().min(1), // Support any non-empty string as account ID
  password: z.string(),
  role: UserRoleSchema, // Role is required
  class: z.string().nullable().optional(), // Class is optional (required for students)
});

export type SignUpRequest = z.infer<typeof SignUpSchema>;

/**
 * Sign in request schema
 */
export const SignInSchema = z.object({
  account_id: z.string().min(1), // Support any non-empty string as account ID
  password: z.string(),
});

export type SignInRequest = z.infer<typeof SignInSchema>;

/**
 * Auth API response schemas
 */
export const AuthResponseSchema = z.object({
  token: z.string(),
  user: z.object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    account_id: z.string(),
    role: UserRoleSchema,
    class: z.string().nullable(),
  }),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * All auth API related schemas
 */
export const AuthApiSchemas = {
  SignUp: SignUpSchema,
  SignIn: SignInSchema,
  AuthResponse: AuthResponseSchema,
};
