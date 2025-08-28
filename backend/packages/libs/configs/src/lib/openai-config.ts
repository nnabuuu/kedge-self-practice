/**
 * OpenAI Model Configuration
 * Allows different models for different use cases to optimize cost and performance
 */

export interface OpenAIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  models: {
    // For parsing quiz content from documents (complex task, needs better model)
    quizParser: OpenAIModelConfig;
    // For rendering/formatting quiz questions (simpler task)
    quizRenderer: OpenAIModelConfig;
    // For validating fill-in-the-blank answers (semantic understanding)
    answerValidator: OpenAIModelConfig;
    // For extracting keywords and matching knowledge points
    knowledgePointExtractor: OpenAIModelConfig;
  };
}

// Default configuration using unified LLM_* variables
export const getOpenAIConfig = (): OpenAIConfig => {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL,
    organization: process.env.LLM_ORGANIZATION,
    models: {
      quizParser: {
        model: process.env.LLM_MODEL_QUIZ_PARSER || 'gpt-4o',
        temperature: parseFloat(process.env.LLM_TEMP_QUIZ_PARSER || '0.7'),
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS_QUIZ_PARSER || '4000'),
      },
      quizRenderer: {
        model: process.env.LLM_MODEL_QUIZ_RENDERER || 'gpt-4o-mini',
        temperature: parseFloat(process.env.LLM_TEMP_QUIZ_RENDERER || '0.3'),
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS_QUIZ_RENDERER || '1000'),
      },
      answerValidator: {
        model: process.env.LLM_MODEL_ANSWER_VALIDATOR || 'gpt-4o-mini',
        temperature: parseFloat(process.env.LLM_TEMP_ANSWER_VALIDATOR || '0.3'),
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS_ANSWER_VALIDATOR || '500'),
      },
      knowledgePointExtractor: {
        model: process.env.LLM_MODEL_KNOWLEDGE_EXTRACTOR || 'gpt-4o',
        temperature: parseFloat(process.env.LLM_TEMP_KNOWLEDGE_EXTRACTOR || '0.3'),
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS_KNOWLEDGE_EXTRACTOR || '1000'),
      },
    },
  };
};

// Helper function to get model config for a specific use case
export type ModelUseCase = 'quizParser' | 'quizRenderer' | 'answerValidator' | 'knowledgePointExtractor';

export const getModelConfig = (useCase: ModelUseCase): OpenAIModelConfig => {
  const config = getOpenAIConfig();
  return config.models[useCase];
};

// DeepSeek configuration - uses unified LLM_* variables
export const getDeepSeekConfig = (): DeepSeekConfig => {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseURL: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
    model: 'deepseek-chat', // Default DeepSeek model
  };
};

// Get the current LLM provider based on model name
export type LLMProvider = 'openai' | 'deepseek';

export const getLLMProvider = (useCase: ModelUseCase = 'quizParser'): LLMProvider => {
  const config = getOpenAIConfig();
  const model = config.models[useCase].model.toLowerCase();
  
  // Detect provider based on model prefix
  if (model.startsWith('deepseek')) {
    return 'deepseek';
  } else if (model.startsWith('gpt') || model.startsWith('o1') || model.startsWith('chatgpt')) {
    return 'openai';
  }
  
  // Default to OpenAI for unknown models
  return 'openai';
};

// Get the appropriate base URL for the detected provider
export const getAutoBaseURL = (provider: LLMProvider): string | undefined => {
  // If LLM_BASE_URL is explicitly set, use it
  if (process.env.LLM_BASE_URL) {
    return process.env.LLM_BASE_URL;
  }
  
  // Otherwise, use provider-specific defaults
  switch (provider) {
    case 'deepseek':
      return 'https://api.deepseek.com';
    case 'openai':
    default:
      return undefined; // OpenAI client uses its default
  }
};