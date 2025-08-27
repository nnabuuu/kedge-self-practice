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

// Default configuration with fallbacks
export const getOpenAIConfig = (): OpenAIConfig => {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL,
    organization: process.env.OPENAI_ORGANIZATION,
    models: {
      quizParser: {
        model: process.env.OPENAI_MODEL_QUIZ_PARSER || 'gpt-4o',
        temperature: parseFloat(process.env.OPENAI_TEMP_QUIZ_PARSER || '0.7'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_QUIZ_PARSER || '4000'),
      },
      quizRenderer: {
        model: process.env.OPENAI_MODEL_QUIZ_RENDERER || 'gpt-4o-mini',
        temperature: parseFloat(process.env.OPENAI_TEMP_QUIZ_RENDERER || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_QUIZ_RENDERER || '1000'),
      },
      answerValidator: {
        model: process.env.OPENAI_MODEL_ANSWER_VALIDATOR || 'gpt-4o-mini',
        temperature: parseFloat(process.env.OPENAI_TEMP_ANSWER_VALIDATOR || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_ANSWER_VALIDATOR || '500'),
      },
      knowledgePointExtractor: {
        model: process.env.OPENAI_MODEL_KNOWLEDGE_EXTRACTOR || 'gpt-4o',
        temperature: parseFloat(process.env.OPENAI_TEMP_KNOWLEDGE_EXTRACTOR || '0.3'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS_KNOWLEDGE_EXTRACTOR || '1000'),
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