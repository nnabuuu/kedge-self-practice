import { Injectable } from '@nestjs/common';
import { GptParagraphBlock, QuizItem } from '@kedge/models';
import { getLLMProvider, LLMProvider, getModelConfig, getOpenAIConfig, getAutoBaseURL } from '@kedge/configs';
import { GptService } from './gpt.service';
import { DeepSeekService } from './deepseek.service';

/**
 * Unified LLM Service that automatically switches between different providers
 * based on the model name prefix (gpt-* uses OpenAI, deepseek-* uses DeepSeek)
 */
@Injectable()
export class LLMService {
  constructor(
    private readonly gptService: GptService,
    private readonly deepseekService: DeepSeekService,
  ) {
    const provider = this.getProvider();
    const modelConfig = getModelConfig('quizParser');
    console.log(`LLM Service initialized - Model: ${modelConfig.model}, Provider: ${provider}`);
  }

  /**
   * Extract quiz items from paragraphs using the appropriate LLM provider
   * Provider is determined by model name prefix:
   * - gpt-*, o1-*, chatgpt-* -> OpenAI
   * - deepseek-* -> DeepSeek
   */
  async extractQuizItems(paragraphs: GptParagraphBlock[]): Promise<QuizItem[]> {
    const provider = getLLMProvider('quizParser');
    const modelConfig = getModelConfig('quizParser');
    
    console.log(`Using ${provider} provider with model ${modelConfig.model} for quiz extraction`);
    
    switch (provider) {
      case 'deepseek':
        return this.deepseekService.extractQuizItems(paragraphs);
      case 'openai':
      default:
        return this.gptService.extractQuizItems(paragraphs);
    }
  }

  /**
   * Get the current LLM provider name based on the model configuration
   */
  getProvider(): string {
    return getLLMProvider('quizParser');
  }

  /**
   * Get provider-specific information based on current model configuration
   */
  getProviderInfo(): { provider: string; model: string; features: string[] } {
    const provider = getLLMProvider('quizParser');
    const modelConfig = getModelConfig('quizParser');
    
    switch (provider) {
      case 'deepseek':
        return {
          provider: 'DeepSeek',
          model: modelConfig.model,
          features: [
            'Cost-effective (10x cheaper than GPT-4)',
            'JSON object response format',
            'Excellent Chinese language support',
            'Fast response times'
          ]
        };
      case 'openai':
      default:
        return {
          provider: 'OpenAI',
          model: modelConfig.model,
          features: [
            'JSON schema validation',
            'High accuracy',
            'Multi-language support',
            'Structured output guarantee'
          ]
        };
    }
  }

  /**
   * Get comprehensive LLM configuration (excludes sensitive data like API keys)
   */
  getFullConfiguration() {
    const config = getOpenAIConfig();
    const currentProviders: Record<string, string> = {};
    const modelConfigs: Record<string, any> = {};
    
    // Detect provider for each use case
    const useCases = ['quizParser', 'quizRenderer', 'answerValidator', 'knowledgePointExtractor'] as const;
    
    useCases.forEach(useCase => {
      const provider = getLLMProvider(useCase);
      currentProviders[useCase] = provider;
      
      const modelConfig = getModelConfig(useCase);
      modelConfigs[useCase] = {
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        maxTokens: modelConfig.maxTokens,
        provider: provider,
      };
    });

    // Get base URLs for each unique provider
    const uniqueProviders = [...new Set(Object.values(currentProviders))];
    const baseUrls: Record<string, string | undefined> = {};
    uniqueProviders.forEach(provider => {
      baseUrls[provider] = getAutoBaseURL(provider as LLMProvider);
    });

    return {
      // Current configuration
      configuration: {
        apiKeyConfigured: !!config.apiKey && config.apiKey !== 'your-llm-api-key-here',
        baseURL: config.baseURL || 'auto-detected',
        organization: config.organization || 'not configured',
      },
      
      // Model configurations for each use case
      models: modelConfigs,
      
      // Provider detection
      providers: currentProviders,
      
      // Base URLs being used
      baseUrls: baseUrls,
      
      // Environment variable names for reference
      envVariables: {
        apiKey: 'LLM_API_KEY',
        baseURL: 'LLM_BASE_URL (optional)',
        organization: 'LLM_ORGANIZATION (optional)',
        models: {
          quizParser: 'LLM_MODEL_QUIZ_PARSER',
          quizRenderer: 'LLM_MODEL_QUIZ_RENDERER',
          answerValidator: 'LLM_MODEL_ANSWER_VALIDATOR',
          knowledgePointExtractor: 'LLM_MODEL_KNOWLEDGE_EXTRACTOR',
        },
        temperatures: {
          quizParser: 'LLM_TEMP_QUIZ_PARSER',
          quizRenderer: 'LLM_TEMP_QUIZ_RENDERER',
          answerValidator: 'LLM_TEMP_ANSWER_VALIDATOR',
          knowledgePointExtractor: 'LLM_TEMP_KNOWLEDGE_EXTRACTOR',
        },
        maxTokens: {
          quizParser: 'LLM_MAX_TOKENS_QUIZ_PARSER',
          quizRenderer: 'LLM_MAX_TOKENS_QUIZ_RENDERER',
          answerValidator: 'LLM_MAX_TOKENS_ANSWER_VALIDATOR',
          knowledgePointExtractor: 'LLM_MAX_TOKENS_KNOWLEDGE_EXTRACTOR',
        },
      },
      
      // Tips for configuration
      tips: [
        'Models starting with "gpt-", "o1-", "chatgpt-" use OpenAI provider',
        'Models starting with "deepseek-" use DeepSeek provider',
        'Base URL is auto-detected based on provider if not explicitly set',
        'Use .envrc.override to customize settings without modifying tracked files',
      ],
    };
  }
}