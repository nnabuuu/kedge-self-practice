import { Injectable, Logger } from '@nestjs/common';
import { ConfigsService, getOpenAIConfig, getModelConfig } from '@kedge/configs';
import { KnowledgePoint } from '@kedge/models';
import { OpenAI } from 'openai';
import { createChatCompletionParams } from './openai-utils';

@Injectable()
export class KnowledgePointGPTService {
  private readonly logger = new Logger(KnowledgePointGPTService.name);
  private readonly openai: OpenAI;
  private readonly config = getOpenAIConfig();

  constructor(private readonly configsService: ConfigsService) {
    if (!this.config.apiKey) {
      this.logger.warn('LLM_API_KEY not set - GPT features will be disabled');
    }
    this.openai = new OpenAI({
      apiKey: this.config.apiKey || 'dummy-key',
      baseURL: this.config.baseURL,
      organization: this.config.organization,
    });
  }

  async extractKeywordsFromQuiz(quizText: string): Promise<{keywords: string[], country: string, dynasty: string}> {
    const apiKey = this.configsService.getOptional('LLM_API_KEY') || this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('No LLM_API_KEY or OPENAI_API_KEY found, returning empty keywords');
      return {keywords: [], country: '未知', dynasty: '无'};
    }

    const schema = {
      name: 'extract_keywords',
      description: '从试题中提取关键词列表',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            description: '关键词数组，用于教学知识点匹配',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 5,
          },
          country: {
            type: 'string',
            description: '题目涉及的国家',
          },
          dynasty: {
            type: 'string',
            description: '题目涉及的朝代，如果国家不是中国则填：无'
          }
        },
        required: ['keywords', 'country', 'dynasty'],
        additionalProperties: false,
      },
    };

    const prompt = `你是一位历史教育专家，负责从中学历史选择题中提取/总结关键词、国家、朝代，用于后续匹配标准教学知识点。

请根据提供的试题内容和正确选项，从题目中提炼 1～5 个最能表达该题核心考点的关键词或短语。

提取原则如下：

1. **优先体现正确答案所代表的核心历史概念或事件**，如"光荣革命""夏朝""农耕文明"等；
2. 同时结合题干中提供的背景、描述、逻辑判断等线索，提炼/总结能够准确描述题意的关键词；
3. 避免提取无意义的功能性词（如"选择""描述"），也不要简单照抄选项；`;

    try {
      const modelConfig = getModelConfig('knowledgePointExtractor');
      const completionParams = createChatCompletionParams({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        messages: [
          {
            role: 'user',
            content: prompt + '\n\n' + quizText,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      }, modelConfig.maxTokens);
      const response = await this.openai.chat.completions.create(completionParams);

      return JSON.parse(response.choices[0].message?.content || '');
    } catch (error) {
      this.logger.error('Failed to extract keywords', error);
      return {keywords: [], country: '未知', dynasty: '无'};
    }
  }

  async suggestUnitsByCountryAndDynasty(
    quizText: string,
    units: string[],
  ): Promise<string[]> {
    const apiKey = this.configsService.getOptional('LLM_API_KEY') || this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('No LLM_API_KEY or OPENAI_API_KEY found, cannot suggest units');
      return [];
    }

    const schema = {
      name: 'suggest_units',
      description: '根据试题提到的国家和朝代，返回最相关教学单元在原始列表中的索引（从0开始）',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          indexes: {
            type: 'array',
            description: '最相关教学单元在原始输入数组中的索引，按相关性降序排列，最多返回3个',
            items: { type: 'integer' },
            minItems: 1,
            maxItems: 3,
          },
        },
        required: ['indexes'],
        additionalProperties: false,
      },
    };

    const prompt = `你是一位中学历史教学专家。

请根据以下选择题内容，分析其涉及的国家、朝代或历史语境，并从提供的教学单元中选择最相关的 1-3 个。

请只返回这些教学单元在原始输入数组中的索引（从0开始计数）。例如，如果你选择了第1、3、5项，则返回 [1, 3, 5]。

题目内容如下：
${quizText}

可供选择的教学单元包括：
${units.map((u, i) => `索引 ${i}: ${u}`).join('\n')}

你应根据国家、时代背景、关键词、设问重点等维度，判断哪几个单元最可能与该题有关。`;

    try {
      const modelConfig = getModelConfig('knowledgePointExtractor');
      const completionParams = createChatCompletionParams({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        messages: [{ role: 'user', content: prompt }],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      }, modelConfig.maxTokens);
      const response = await this.openai.chat.completions.create(completionParams);

      const parsed = JSON.parse(response.choices[0].message?.content || '{}');
      const indexes: number[] = parsed.indexes ?? [];
      return indexes.map(i => units[i]).filter(Boolean);
    } catch (error) {
      this.logger.error('Failed to suggest units', error);
      return [];
    }
  }

  getStructuredHierarchyStrings(points: KnowledgePoint[]): string[] {
    const result: string[] = [];

    const grouped = new Map<
      string, // volume + unit
      Map<string, // lesson
        Map<string, // sub
          KnowledgePoint[] // topics
        >
      >
    >();

    for (const kp of points) {
      const volumeUnit = `${kp.volume}::${kp.unit}`;
      if (!grouped.has(volumeUnit)) {
        grouped.set(volumeUnit, new Map());
      }

      const lessonMap = grouped.get(volumeUnit)!;
      if (!lessonMap.has(kp.lesson)) {
        lessonMap.set(kp.lesson, new Map());
      }

      const subMap = lessonMap.get(kp.lesson)!;
      if (!subMap.has(kp.sub)) {
        subMap.set(kp.sub, []);
      }

      subMap.get(kp.sub)!.push(kp);
    }

    for (const [volumeUnit, lessonMap] of grouped.entries()) {
      const [, unit] = volumeUnit.split('::');
      result.push(`${unit}`);
      for (const [lesson, subMap] of lessonMap.entries()) {
        result.push(`${lesson}`);
        for (const [sub, points] of subMap.entries()) {
          result.push(`${sub}`);
          for (const kp of points) {
            result.push(`{id: ${kp.id}, topic: ${kp.topic}}`);
          }
        }
      }
    }

    return result;
  }

  async disambiguateTopicFromCandidates(
    quizText: string,
    knowledgePoints: KnowledgePoint[],
  ): Promise<{ selectedId: string; candidateIds: string[] }> {
    const apiKey = this.configsService.getOptional('LLM_API_KEY') || this.configsService.getOptional('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('No LLM_API_KEY or OPENAI_API_KEY found, cannot disambiguate topics');
      return { selectedId: '', candidateIds: [] };
    }

    this.logger.log(`筛选知识点：
${quizText}
Candidates:
${JSON.stringify(knowledgePoints, null, 2)}
    `);

    const schema = {
      name: 'disambiguate_topic',
      description: '从多个候选知识点中选择最相关的一项，并返回最多三个备选项',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          selectedId: {
            type: 'string',
            description: '最终选择的知识点 ID',
          },
          candidateIds: {
            type: 'array',
            items: { type: 'string' },
            description: '最多三个与该题相关的候选知识点 ID（含 selectedId）',
            minItems: 1,
            maxItems: 3,
          },
        },
        required: ['selectedId', 'candidateIds'],
        additionalProperties: false,
      },
    };

    const hierarchyDescription = this.getStructuredHierarchyStrings(knowledgePoints).join('\n');

    this.logger.log(`Prepared hierarchyDescription:`)

    const prompt = `你是一位中学历史命题与教学专家，擅长分析历史选择题背后的考查意图。

请根据下列题目内容、选项、答案和提供的多个候选知识点，选择其中最贴切、最能准确覆盖该题目考查意图的知识点，并返回其 ID。

**重要**：你必须返回一个 candidateIds 数组，包含 1-3 个相关的知识点 ID。
- candidateIds 数组必须包含 selectedId
- 如果有其他相关的知识点，也要加入到 candidateIds 中（总共最多3个）
- 即使只有一个匹配的知识点，candidateIds 仍然要是一个数组
- 按相关性从高到低排列（selectedId 应该是最相关的）

---

请你在匹配前，**务必先判断这道题的"考查重点"属于以下哪一类**（仅选其一）：
- 思想主张（如某学派的理论、人物的政治观念）
- 制度变迁（如郡县制、世袭制、科举、改革措施）
- 历史事件（如某场战争、革命、运动、条约）
- 社会结构或文化特征（如农耕文明、宗教传播、民族认同）
- 历史背景与因果分析（如某事件发生的根本原因或历史影响）
- 概念识记（如对某一历史术语、称谓、现象的定义）

---

### 匹配原则：

1. **知识点匹配应以"正确答案"所属的知识范畴为核心依据。**
   - 无论题干涉及何种背景或对象，最终匹配应聚焦于答案所体现的核心概念；
   - 避免仅因题干涉及某历史时期、人物或背景就选择该时期下的知识点。

2. **根据题目所体现的知识层级，匹配语义抽象程度一致的知识点。**
   - 若答案是总体概念、理论归纳或人物思想，应优先选择总结性强的知识点；
   - 若答案是术语定义或具体制度，应优先选择标题明确、含义具体的知识点。

3. **避免泛化或跳跃式匹配。**
   - 不应仅因某知识点覆盖面大或频率高就默认其相关性更强；
   - 匹配知识点应当能完整、精准地承载"答案"的定义与归属。

### 候选知识点(包括上级目录信息)：
${hierarchyDescription}

### Quiz
${quizText}

### 返回格式要求
请返回 JSON，必须包含以下两个字段：
1. selectedId: 最匹配的知识点 ID（字符串）
2. candidateIds: 包含 1-3 个相关知识点 ID 的数组（必须包含 selectedId，如果有其他相关的也要加入）

示例返回格式：
{
  "selectedId": "kp_25",
  "candidateIds": ["kp_25", "kp_23", "kp_27"]
}

注意：即使只有一个匹配项，candidateIds 也必须是数组格式，如：["kp_25"]`;

    try {
      const modelConfig = getModelConfig('knowledgePointExtractor');
      const completionParams = createChatCompletionParams({
        model: modelConfig.model,
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: schema,
        },
      }, modelConfig.maxTokens);
      const response = await this.openai.chat.completions.create(completionParams);

      const raw = response.choices[0].message?.content;
      this.logger.log(`筛选结果： ${raw}`);

      const parsed = JSON.parse(raw || '');
      
      // Debug logging
      this.logger.log(`=== GPT Response Debug ===`);
      this.logger.log(`Raw response: ${raw}`);
      this.logger.log(`Parsed selectedId: ${parsed.selectedId}`);
      this.logger.log(`Parsed candidateIds type: ${typeof parsed.candidateIds}`);
      this.logger.log(`Parsed candidateIds isArray: ${Array.isArray(parsed.candidateIds)}`);
      this.logger.log(`Parsed candidateIds value: ${JSON.stringify(parsed.candidateIds)}`);
      this.logger.log(`Parsed candidateIds length: ${parsed.candidateIds?.length}`);
      
      const result = {
        selectedId: parsed.selectedId ?? '',
        candidateIds: Array.isArray(parsed.candidateIds) ? parsed.candidateIds.slice(0, 3) : [],
      };
      
      this.logger.log(`Final result selectedId: ${result.selectedId}`);
      this.logger.log(`Final result candidateIds: ${JSON.stringify(result.candidateIds)}`);
      this.logger.log(`=== End GPT Response Debug ===`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to disambiguate topics', error);
      return { selectedId: '', candidateIds: [] };
    }
  }
}