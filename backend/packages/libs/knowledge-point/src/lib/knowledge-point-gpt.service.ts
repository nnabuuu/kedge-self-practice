import { Injectable, Logger } from '@nestjs/common';
import { ConfigsService } from '@kedge/configs';
import { KnowledgePoint } from '@kedge/models';
import { OpenAI } from 'openai';

export interface KnowledgePointMatch {
  knowledgePoint: KnowledgePoint;
  confidence: number;
  reasoning: string;
}

@Injectable()
export class KnowledgePointGPTService {
  private readonly logger = new Logger(KnowledgePointGPTService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configsService: ConfigsService) {
    const apiKey = this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not set - GPT features will be disabled');
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async matchKnowledgePoints(
    quizText: string,
    availablePoints: KnowledgePoint[],
    maxMatches: number = 3,
  ): Promise<KnowledgePointMatch[]> {
    const apiKey = this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not available - returning empty matches');
      return [];
    }

    try {
      const prompt = this.buildMatchingPrompt(quizText, availablePoints);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的教育内容分析助手，擅长将题目内容与知识点进行匹配。请根据题目内容，从给定的知识点列表中选择最匹配的知识点，并给出匹配的置信度和理由。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('Empty response from OpenAI');
      }

      return this.parseMatchingResult(result, availablePoints, maxMatches);
    } catch (error) {
      this.logger.error('Failed to match knowledge points with GPT', error);
      return [];
    }
  }

  private buildMatchingPrompt(
    quizText: string,
    availablePoints: KnowledgePoint[],
  ): string {
    const pointsList = availablePoints
      .map(
        (point, index) =>
          `${index + 1}. ID: ${point.id}, 册别: ${point.volume}, 单元: ${point.unit}, 课程: ${point.lesson}, 分类: ${point.sub}, 知识点: ${point.topic}`,
      )
      .join('\n');

    return `
请分析以下题目内容，并从提供的知识点列表中选择最匹配的知识点：

题目内容：
${quizText}

可选知识点列表：
${pointsList}

请按照以下JSON格式返回最匹配的3个知识点（按匹配度排序）：
{
  "matches": [
    {
      "id": "知识点ID",
      "confidence": 0.95,
      "reasoning": "匹配理由说明"
    }
  ]
}

要求：
1. confidence 范围为 0-1，表示匹配的置信度
2. reasoning 简要说明为什么这个知识点与题目匹配
3. 只返回置信度 > 0.6 的匹配结果
4. 最多返回3个匹配结果
`;
  }

  private parseMatchingResult(
    result: string,
    availablePoints: KnowledgePoint[],
    maxMatches: number,
  ): KnowledgePointMatch[] {
    try {
      // Extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in GPT response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const matches = parsed.matches || [];

      const results: KnowledgePointMatch[] = [];
      
      for (const match of matches.slice(0, maxMatches)) {
        const knowledgePoint = availablePoints.find(
          point => point.id === match.id,
        );
        
        if (knowledgePoint && match.confidence > 0.6) {
          results.push({
            knowledgePoint,
            confidence: match.confidence,
            reasoning: match.reasoning || '',
          });
        }
      }

      return results.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      this.logger.error('Failed to parse GPT matching result', error);
      return [];
    }
  }

  async polishKnowledgePointMatch(
    quizText: string,
    currentMatch: KnowledgePoint,
  ): Promise<{
    improvedMatch: KnowledgePoint;
    confidence: number;
    reasoning: string;
  } | null> {
    const apiKey = this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OpenAI API key not available - cannot polish matches');
      return null;
    }

    try {
      const prompt = `
请分析以下题目内容和当前匹配的知识点，判断匹配是否合理，如有需要请提出改进建议：

题目内容：
${quizText}

当前匹配的知识点：
册别: ${currentMatch.volume}
单元: ${currentMatch.unit}  
课程: ${currentMatch.lesson}
分类: ${currentMatch.sub}
知识点: ${currentMatch.topic}

请按照以下JSON格式返回分析结果：
{
  "isGoodMatch": true/false,
  "confidence": 0.85,
  "reasoning": "分析说明",
  "improvedMatch": {
    "volume": "建议的册别",
    "unit": "建议的单元",
    "lesson": "建议的课程", 
    "sub": "建议的分类",
    "topic": "建议的知识点描述"
  }
}
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的教育内容分析助手，请仔细分析题目与知识点的匹配度。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 800,
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        return null;
      }

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.isGoodMatch && parsed.confidence > 0.7) {
        return {
          improvedMatch: {
            ...currentMatch,
            ...parsed.improvedMatch,
          },
          confidence: parsed.confidence,
          reasoning: parsed.reasoning,
        };
      }

      return null;
    } catch (error) {
      this.logger.error('Failed to polish knowledge point match', error);
      return null;
    }
  }
}