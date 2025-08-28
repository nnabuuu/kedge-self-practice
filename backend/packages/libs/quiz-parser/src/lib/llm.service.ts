import { Injectable } from '@nestjs/common';
import { GptParagraphBlock, QuizItem } from '@kedge/models';
import { getLLMProvider, LLMProvider, getModelConfig } from '@kedge/configs';
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
}