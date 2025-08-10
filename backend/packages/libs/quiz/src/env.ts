import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      QUIZ_STORAGE_PATH: z.string().default('./quiz-storage'),
    },
    runtimeEnv: process.env,
  }),
);
