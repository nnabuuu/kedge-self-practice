import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources/chat/completions';

/**
 * List of newer models that have different parameter requirements
 */
const NEW_MODELS = [
  'o1-preview',
  'o1-mini',
  'o1',
  'gpt-5', // Future-proofing
];

/**
 * Determines if a model is one of the newer models with restrictions
 */
function isNewModel(model: string): boolean {
  return NEW_MODELS.some(m => model.toLowerCase().includes(m.toLowerCase()));
}

/**
 * Determines if a model supports max_tokens or max_completion_tokens
 * Newer models (o1, o1-mini, etc.) use max_completion_tokens
 * Legacy models (gpt-4, gpt-3.5, etc.) use max_tokens
 */
function supportsMaxCompletionTokens(model: string): boolean {
  return isNewModel(model);
}

/**
 * Determines if a model supports custom temperature values
 * Newer models (o1, o1-mini, etc.) only support temperature=1
 * Legacy models support various temperature values
 */
function supportsCustomTemperature(model: string): boolean {
  return !isNewModel(model);
}

/**
 * Creates OpenAI chat completion parameters with proper field names and values
 * Automatically handles:
 * - max_tokens vs max_completion_tokens based on the model
 * - temperature restrictions (newer models only support 1)
 * - top_p removal for newer models (not supported)
 */
export function createChatCompletionParams(
  baseParams: Omit<ChatCompletionCreateParamsNonStreaming, 'max_tokens' | 'max_completion_tokens'>,
  maxTokens?: number
): ChatCompletionCreateParamsNonStreaming {
  const model = baseParams.model;
  let params: any = { ...baseParams };
  
  // Handle temperature restrictions
  if (params.temperature !== undefined) {
    if (!supportsCustomTemperature(model)) {
      // Newer models only support temperature=1, remove it to use default
      delete params.temperature;
    }
  }
  
  // Handle top_p restrictions (newer models don't support it)
  if (params.top_p !== undefined) {
    if (isNewModel(model)) {
      // Newer models don't support top_p
      delete params.top_p;
    }
  }
  
  // Handle max tokens field
  if (maxTokens) {
    if (supportsMaxCompletionTokens(model)) {
      // Use max_completion_tokens for newer models
      params.max_completion_tokens = maxTokens;
    } else {
      // Use max_tokens for legacy models
      params.max_tokens = maxTokens;
    }
  }
  
  return params as ChatCompletionCreateParamsNonStreaming;
}