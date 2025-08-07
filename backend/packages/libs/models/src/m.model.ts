/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { AuthSchema } from './auth';
import { AppSchema } from './app';
import { PracticeSchema } from './practice';

const Models = {
  database: {
    kedge_auth: AuthSchema,
    kedge_practice: PracticeSchema,
  },
  app: AppSchema,
  auth: AuthSchema,
  practice: PracticeSchema,
} as const;

export type ModelOfDatabase<
  S extends keyof typeof Models.database,
  T extends keyof (typeof Models.database)[S],
> = (typeof Models.database)[S][T] extends z.ZodType<infer O> ? O : never;

export const m = {
  database<
    S extends keyof typeof Models.database,
    T extends keyof (typeof Models.database)[S],
  >(schema: S, table: T) {
    return Models.database[schema][table];
  },
  auth<T extends keyof typeof Models.auth>(type: T) {
    return Models.auth[type];
  },
  app<T extends keyof typeof Models.app>(type: T) {
    return Models.app[type];
  },
};
