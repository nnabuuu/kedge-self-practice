import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    ENABLE_DEBUG_INFO: z.coerce.boolean().default(true),
    API_PORT: z.coerce.number().default(process.env.PORT ? parseInt(process.env.PORT) : 8716),
  },
  runtimeEnv: process.env,
});
