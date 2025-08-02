import { z } from 'zod';
import {UserRoleSchema} from "./auth.repository.schema";

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  iss: z.string().optional(),
  aud: z.string().optional(),
  role: UserRoleSchema,
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
