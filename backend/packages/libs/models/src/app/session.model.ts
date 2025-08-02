import { z } from 'zod';

export const KedgeSessionContextSchema = z.object({
  userId: z.coerce.string(),
  chatId: z.coerce.string(),
  sessionId: z.coerce.string(),
  isDialogActive: z.coerce.boolean(),
  agentId: z.coerce.string().optional()
});

export type KedgeSessionContext = z.infer<typeof KedgeSessionContextSchema>;

export function makeKedgeSessionContext(
  userId: string,
  chatId: string,
  sessionId: string,
  isDialogActive: boolean,
  agentId?: string,
): KedgeSessionContext {
  return { userId, sessionId, chatId, isDialogActive, agentId };
}

export function makeDefaultKedgeSessionContext(): KedgeSessionContext {
  return makeKedgeSessionContext('', '', '', false);
}
