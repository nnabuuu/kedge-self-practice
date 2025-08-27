import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

/**
 * Determines if a model supports max_tokens or max_completion_tokens
 * Newer models (o1, o1-mini, etc.) use max_completion_tokens
 * Legacy models (gpt-4, gpt-3.5, etc.) use max_tokens
 */
function supportsMaxCompletionTokens(model: string): boolean {
  // Models that use max_completion_tokens
  const newModels = [
    'o1-preview',
    'o1-mini',
    'o1',
    'gpt-5', // Future-proofing
  ];
  
  // Check if the model is one of the newer ones
  return newModels.some(m => model.toLowerCase().includes(m.toLowerCase()));
}

/**
 * Creates OpenAI chat completion parameters with proper max tokens field
 * Automatically uses max_tokens or max_completion_tokens based on the model
 */
export function createChatCompletionParams(
  baseParams: Omit<ChatCompletionCreateParamsNonStreaming, 'max_tokens' | 'max_completion_tokens'>,
  maxTokens?: number
): ChatCompletionCreateParamsNonStreaming {
  if (!maxTokens) {
    return baseParams as ChatCompletionCreateParamsNonStreaming;
  }

  const model = baseParams.model;
  
  if (supportsMaxCompletionTokens(model)) {
    // Use max_completion_tokens for newer models
    return {
      ...baseParams,
      max_completion_tokens: maxTokens,
    } as ChatCompletionCreateParamsNonStreaming;
  } else {
    // Use max_tokens for legacy models
    return {
      ...baseParams,
      max_tokens: maxTokens,
    } as ChatCompletionCreateParamsNonStreaming;
  }
}