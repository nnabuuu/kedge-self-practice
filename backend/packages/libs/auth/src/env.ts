import { createEnv } from '@t3-oss/env-core';
import memoizee from 'memoizee';
import { z } from 'zod';

export const env = memoizee(() => {
  try {
    return createEnv({
      server: {
        JWT_SECRET: z.string().min(1, 'JWT_SECRET must not be empty')
      },
      runtimeEnv: process.env,
      onValidationError: (error) => {
        console.error('❌ Missing required environment variables:');
        console.error('   JWT_SECRET is required but not set');
        console.error('\nPlease set JWT_SECRET in your environment or .env file');
        console.error('Example: export JWT_SECRET="your-secret-key"');
        throw new Error('Missing required environment variable: JWT_SECRET');
      },
    });
  } catch (error) {
    console.error('Failed to initialize auth environment configuration');
    throw error;
  }
});
