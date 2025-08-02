import { z } from 'zod';

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  iss: z.string(),
  aud: z.string(),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  userId: z.string(),
});
