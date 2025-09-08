import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() =>
  createEnv({
    server: {
      QUIZ_STORAGE_PATH: z.string().default('./quiz-storage'),
      // Aliyun OSS Configuration
      ALIYUN_OSS_ACCESS_KEY_ID: z.string().optional(),
      ALIYUN_OSS_ACCESS_KEY_SECRET: z.string().optional(),
      ALIYUN_OSS_BUCKET: z.string().optional(),
      ALIYUN_OSS_REGION: z.string().optional(),
      ALIYUN_OSS_ENDPOINT: z.string().optional(),
      ALIYUN_OSS_INTERNAL_ENDPOINT: z.string().optional(),
      ALIYUN_OSS_CDN_DOMAIN: z.string().optional(),
      ALIYUN_OSS_PATH_PREFIX: z.string().optional(),
      ALIYUN_OSS_PUBLIC_READ: z.string().optional(),
      NODE_ENV: z.string().default('development'),
    },
    runtimeEnv: process.env,
  }),
);
