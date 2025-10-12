#!/usr/bin/env tsx
/**
 * Generate Alternative Answers and Hints for Fill-in-the-Blank Questions
 *
 * This script iterates through all fill-in-the-blank quizzes in the database
 * and generates alternative answers and hints using GPT for questions that
 * don't already have them.
 *
 * Requirements:
 * - Node.js 18+
 * - tsx (install globally: npm install -g tsx)
 * - Backend API server must be running (default: http://localhost:8718)
 * - All environment variables must be properly configured in .env
 *
 * Usage:
 *   cd backend
 *   source .envrc  # Load environment variables
 *   tsx scripts/generate-fill-blank-alternatives.ts
 *
 * Or with npx:
 *   cd backend
 *   source .envrc
 *   npx tsx scripts/generate-fill-blank-alternatives.ts
 *
 * Options:
 *   --dry-run            Run without making any database changes
 *   --limit=N            Process only the first N quizzes
 *   --force              Regenerate even if hints/alternatives already exist
 *   --quiz-id=ID         Process only a specific quiz by ID
 *   --api-url=URL        Override API URL (default: http://localhost:8718)
 *   --retry-errors=FILE  Retry quizzes from a previous error log file
 *
 * Examples:
 *   # Dry run to see what would be updated
 *   tsx scripts/generate-fill-blank-alternatives.ts --dry-run
 *
 *   # Process only first 10 quizzes
 *   tsx scripts/generate-fill-blank-alternatives.ts --limit=10
 *
 *   # Force regeneration for all quizzes
 *   tsx scripts/generate-fill-blank-alternatives.ts --force
 *
 *   # Process a specific quiz
 *   tsx scripts/generate-fill-blank-alternatives.ts --quiz-id=abc-123-def
 *
 *   # Retry failed quizzes from error log
 *   tsx scripts/generate-fill-blank-alternatives.ts --retry-errors=errors-2025-01-15.json
 *
 *   # Use custom API URL
 *   tsx scripts/generate-fill-blank-alternatives.ts --api-url=http://localhost:3000
 *
 * Environment Variables Required:
 *   LLM_API_KEY                   OpenAI/DeepSeek API key
 *   LLM_MODEL_QUIZ_PARSER         Model for generation (e.g., gpt-4o)
 *   LLM_TEMP_QUIZ_PARSER          Temperature setting (optional, default: 0.1)
 *   LLM_MAX_TOKENS_QUIZ_PARSER    Max tokens for generation (optional, default: 4000)
 *   API_PORT                      Backend API port (optional, default: 8718)
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// ============================================================================
// Configuration
// ============================================================================

interface Config {
  apiUrl: string;
  llmApiKey: string;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
  llmBaseUrl?: string;
}

interface ScriptOptions {
  dryRun: boolean;
  limit?: number;
  force: boolean;
  quizId?: string;
  apiUrl?: string;
  retryErrors?: string;
}

interface ErrorRecord {
  quizId: string;
  question: string;
  answer: string | string[];
  error: string;
  timestamp: string;
}

interface QuizItem {
  id: string;
  type: string;
  question: string;
  answer: string | string[];
  alternative_answers?: string[] | string[][];
  hints?: (string | null)[] | null;
  originalParagraph?: string;
}

interface GeneratedData {
  alternative_answers: string[] | string[][];
  hints: (string | null)[];
}

// ============================================================================
// Parse Command Line Arguments
// ============================================================================

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    }
    if (arg.startsWith('--quiz-id=')) {
      options.quizId = arg.split('=')[1];
    }
    if (arg.startsWith('--api-url=')) {
      options.apiUrl = arg.split('=')[1];
    }
    if (arg.startsWith('--retry-errors=')) {
      options.retryErrors = arg.split('=')[1];
    }
  }

  return options;
}

// ============================================================================
// Load and Validate Configuration
// ============================================================================

function loadConfig(options: ScriptOptions): Config {
  const apiPort = process.env.API_PORT || '8718';
  const apiUrl = options.apiUrl || `http://localhost:${apiPort}`;
  const llmApiKey = process.env.LLM_API_KEY;
  const llmModel = process.env.LLM_MODEL_QUIZ_PARSER || 'gpt-4o';
  const llmTemperature = parseFloat(process.env.LLM_TEMP_QUIZ_PARSER || '0.1');
  const llmMaxTokens = parseInt(process.env.LLM_MAX_TOKENS_QUIZ_PARSER || '4000', 10);
  const llmBaseUrl = process.env.LLM_BASE_URL;

  if (!llmApiKey || llmApiKey === 'your-llm-api-key-here') {
    throw new Error('LLM_API_KEY is not set or is using the default placeholder. Please configure a valid API key in .envrc or .envrc.override.');
  }

  return {
    apiUrl,
    llmApiKey,
    llmModel,
    llmTemperature,
    llmMaxTokens,
    llmBaseUrl,
  };
}

// ============================================================================
// Error Tracking
// ============================================================================

function saveErrorRecords(errors: ErrorRecord[], outputPath?: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = outputPath || `errors-${timestamp}.json`;
  const filepath = path.resolve(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(errors, null, 2), 'utf-8');
  return filepath;
}

function loadErrorRecords(filepath: string): ErrorRecord[] {
  if (!fs.existsSync(filepath)) {
    throw new Error(`Error file not found: ${filepath}`);
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const errors = JSON.parse(content) as ErrorRecord[];

  if (!Array.isArray(errors)) {
    throw new Error('Invalid error file format: expected array of error records');
  }

  return errors;
}

// ============================================================================
// API Client Operations
// ============================================================================

async function fetchQuizzes(apiUrl: string, options: ScriptOptions): Promise<QuizItem[]> {
  console.log('\n📊 Fetching fill-in-the-blank quizzes from API...');

  // If retrying from error file, load quiz IDs from file
  if (options.retryErrors) {
    console.log(`   Loading quiz IDs from error file: ${options.retryErrors}`);
    const errorRecords = loadErrorRecords(options.retryErrors);
    const quizIds = errorRecords.map(e => e.quizId);
    console.log(`   Found ${quizIds.length} quiz IDs to retry`);

    const quizzes: QuizItem[] = [];
    for (const quizId of quizIds) {
      try {
        const response = await fetch(`${apiUrl}/v1/quiz/${quizId}`);
        if (!response.ok) {
          console.warn(`   ⚠️  Could not fetch quiz ${quizId}: ${response.statusText}`);
          continue;
        }
        const data = await response.json();
        if (data.data.type === 'fill-in-the-blank') {
          quizzes.push(data.data);
        }
      } catch (error) {
        console.warn(`   ⚠️  Error fetching quiz ${quizId}:`, error);
      }
    }
    console.log(`✅ Successfully loaded ${quizzes.length} quizzes for retry`);
    return quizzes;
  }

  if (options.quizId) {
    // Fetch specific quiz by ID
    const response = await fetch(`${apiUrl}/v1/quiz/${options.quizId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }
    const data = await response.json();

    if (data.data.type !== 'fill-in-the-blank') {
      console.log('⚠️  Specified quiz is not a fill-in-the-blank question');
      return [];
    }

    return [data.data];
  } else {
    // Fetch all quizzes and filter for fill-in-the-blank
    let page = 1;
    const limit = 100; // Fetch in batches
    const allQuizzes: QuizItem[] = [];

    while (true) {
      const url = `${apiUrl}/v1/quiz?page=${page}&limit=${limit}&type=fill-in-the-blank`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
      }

      const data = await response.json();
      const quizzes = data.data || [];

      allQuizzes.push(...quizzes);

      // Check if we've fetched all quizzes
      if (quizzes.length < limit) {
        break;
      }

      page++;

      // Apply limit if specified
      if (options.limit && allQuizzes.length >= options.limit) {
        break;
      }
    }

    // Apply limit if specified
    const result = options.limit ? allQuizzes.slice(0, options.limit) : allQuizzes;
    console.log(`✅ Found ${result.length} fill-in-the-blank quizzes`);

    return result;
  }
}

function needsGeneration(quiz: QuizItem, force: boolean): boolean {
  if (force) {
    return true;
  }

  const hasAlternatives =
    quiz.alternative_answers &&
    Array.isArray(quiz.alternative_answers) &&
    quiz.alternative_answers.length > 0;

  const hasHints =
    quiz.hints &&
    Array.isArray(quiz.hints) &&
    quiz.hints.length > 0;

  return !hasAlternatives || !hasHints;
}

async function updateQuizViaAPI(
  apiUrl: string,
  quizId: string,
  data: GeneratedData
): Promise<void> {
  const response = await fetch(`${apiUrl}/v1/quiz/${quizId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alternative_answers: data.alternative_answers,
      hints: data.hints,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update quiz: ${response.statusText} - ${errorText}`);
  }
}

// ============================================================================
// GPT Integration
// ============================================================================

function buildPrompt(quiz: QuizItem): string {
  const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
  const blankCount = answer.length;

  return `你是一位专业的中学历史教育专家。请为以下填空题生成替代答案（alternative_answers）和提示词（hints）。

## 填空题信息
**题目**: ${quiz.question}
**答案**: ${JSON.stringify(quiz.answer)}
${quiz.originalParagraph ? `**原文**: ${quiz.originalParagraph}` : ''}

## 任务要求

### 1. 生成替代答案 (alternative_answers)
为每个空格寻找其他可接受的答案表述，考虑：
- 同义词或近义表达（如"美国"和"美利坚合众国"）
- 简称与全称（如"北约"和"北大西洋公约组织"）
- 不同翻译（如"列宁"和"列寧"）
- 历史上的不同名称（如"紫禁城"和"故宫"）
- 书名号的有无（如"红楼梦"和"《红楼梦》"）

### 2. 生成提示词 (hints)
为每个空格提供一个简短的类型提示，如：
- 人名、地名、国家、城市、朝代、民族
- 著作、发明、制度、学派、文物、称号
- 事件、年份、数字、组织

## 输出格式
请以JSON格式返回，严格遵循以下结构：

${blankCount === 1 ? `
\`\`\`json
{
  "alternative_answers": ["替代答案1", "替代答案2"],  // 字符串数组，如果没有替代答案则为空数组 []
  "hints": ["提示词"]  // 单个元素的数组
}
\`\`\`
` : `
\`\`\`json
{
  "alternative_answers": [
    ["空格1替代1", "空格1替代2"],  // 第一个空格的替代答案
    ["空格2替代1"]                 // 第二个空格的替代答案
  ],
  "hints": ["提示词1", "提示词2"]  // 每个空格对应一个提示词
}
\`\`\`
`}

## 注意事项
1. 如果某个空格没有合适的替代答案，使用空数组 []
2. 提示词要简洁，通常1-3个字即可
3. 不要使用null，如果没有替代答案就用空数组
4. alternative_answers的结构取决于空格数量：
   - 单个空格：字符串数组 ["替代1", "替代2"]
   - 多个空格：二维数组 [["空格1替代"], ["空格2替代"]]

请基于题目内容和答案，生成合适的替代答案和提示词。`;
}

async function generateAlternativesAndHints(
  openai: OpenAI,
  config: Config,
  quiz: QuizItem
): Promise<GeneratedData> {
  const prompt = buildPrompt(quiz);

  console.log(`  🤖 Calling ${config.llmModel}...`);

  const completion = await openai.chat.completions.create({
    model: config.llmModel,
    messages: [
      {
        role: 'system',
        content: '你是一位专业的中学历史教育专家，擅长为填空题生成替代答案和提示词。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: config.llmTemperature,
    max_tokens: config.llmMaxTokens,
    response_format: { type: 'json_object' },
  });

  const responseText = completion.choices[0].message.content;
  if (!responseText) {
    throw new Error('Empty response from LLM');
  }

  console.log(`  ✅ Received response (${responseText.length} chars)`);

  // Parse JSON response
  const parsed = JSON.parse(responseText);

  // Validate and normalize the response
  const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
  const blankCount = answer.length;

  let alternativeAnswers = parsed.alternative_answers || [];
  let hints = parsed.hints || [];

  // Normalize alternative_answers structure
  if (blankCount === 1) {
    // Single blank: should be string[]
    if (!Array.isArray(alternativeAnswers)) {
      alternativeAnswers = [];
    }
  } else {
    // Multiple blanks: should be string[][]
    if (!Array.isArray(alternativeAnswers) || !Array.isArray(alternativeAnswers[0])) {
      alternativeAnswers = Array(blankCount).fill([]);
    }
  }

  // Normalize hints structure
  if (!Array.isArray(hints)) {
    hints = Array(blankCount).fill(null);
  } else if (hints.length < blankCount) {
    hints = [...hints, ...Array(blankCount - hints.length).fill(null)];
  }

  return {
    alternative_answers: alternativeAnswers,
    hints: hints,
  };
}

// ============================================================================
// Main Script Logic
// ============================================================================

async function processQuiz(
  openai: OpenAI,
  config: Config,
  quiz: QuizItem,
  options: ScriptOptions,
  index: number,
  total: number
): Promise<boolean> {
  console.log(`\n[${index + 1}/${total}] Processing quiz: ${quiz.id}`);
  console.log(`  📝 Question: ${quiz.question.substring(0, 80)}${quiz.question.length > 80 ? '...' : ''}`);
  console.log(`  ✏️  Answer: ${JSON.stringify(quiz.answer)}`);

  // Check if generation is needed
  if (!needsGeneration(quiz, options.force)) {
    console.log(`  ⏭️  Skipping - already has alternatives and hints`);
    return false;
  }

  console.log(`  🔄 Needs generation...`);

  try {
    // Generate data using GPT
    const generatedData = await generateAlternativesAndHints(openai, config, quiz);

    console.log(`  📊 Generated:`);
    console.log(`     Alternative answers: ${JSON.stringify(generatedData.alternative_answers)}`);
    console.log(`     Hints: ${JSON.stringify(generatedData.hints)}`);

    // Update via API (unless dry run)
    if (options.dryRun) {
      console.log(`  🔍 [DRY RUN] Would update via API`);
    } else {
      await updateQuizViaAPI(config.apiUrl, quiz.id, generatedData);
      console.log(`  💾 Successfully updated via API`);
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error processing quiz ${quiz.id}:`, error);
    if (error instanceof Error) {
      console.error(`     ${error.message}`);
    }
    return false;
  }
}

async function checkAPIHealth(apiUrl: string): Promise<void> {
  console.log(`\n🏥 Checking API health at ${apiUrl}...`);

  try {
    const response = await fetch(`${apiUrl}/v1/`);
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    console.log('   ✅ API is healthy and reachable');
  } catch (error) {
    console.error('   ❌ API is not reachable');
    throw new Error(`Cannot connect to API at ${apiUrl}. Please ensure the backend server is running.`);
  }
}

async function main() {
  console.log('🚀 Fill-in-the-Blank Alternative Answers & Hints Generator');
  console.log('='.repeat(70));

  // Parse command line arguments
  const options = parseArgs();

  console.log('\n⚙️  Options:');
  console.log(`   Dry Run: ${options.dryRun ? 'Yes (no database changes)' : 'No'}`);
  console.log(`   Limit: ${options.limit || 'No limit'}`);
  console.log(`   Force: ${options.force ? 'Yes (regenerate all)' : 'No (skip if exists)'}`);
  if (options.quizId) {
    console.log(`   Quiz ID: ${options.quizId}`);
  }
  if (options.retryErrors) {
    console.log(`   Retry Errors: ${options.retryErrors}`);
  }

  // Load configuration
  console.log('\n🔧 Loading configuration...');
  const config = loadConfig(options);
  console.log(`   API URL: ${config.apiUrl}`);
  console.log(`   LLM Model: ${config.llmModel}`);
  console.log(`   Temperature: ${config.llmTemperature}`);
  console.log(`   Max Tokens: ${config.llmMaxTokens}`);
  if (config.llmBaseUrl) {
    console.log(`   Base URL: ${config.llmBaseUrl}`);
  }

  // Check API health
  await checkAPIHealth(config.apiUrl);

  // Initialize OpenAI client
  console.log('\n🤖 Initializing LLM client...');
  const openai = new OpenAI({
    apiKey: config.llmApiKey,
    baseURL: config.llmBaseUrl,
  });
  console.log('   ✅ LLM client initialized');

  // Fetch quizzes
  const quizzes = await fetchQuizzes(config.apiUrl, options);

  if (quizzes.length === 0) {
    console.log('\n⚠️  No fill-in-the-blank quizzes found to process.');
    return;
  }

  // Process each quiz
  console.log('\n🔄 Processing quizzes...');
  console.log('='.repeat(70));

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const errorRecords: ErrorRecord[] = [];

  for (let i = 0; i < quizzes.length; i++) {
    const quiz = quizzes[i];

    try {
      const wasUpdated = await processQuiz(openai, config, quiz, options, i, quizzes.length);

      if (wasUpdated) {
        updatedCount++;
      } else {
        skippedCount++;
      }
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Fatal error on quiz ${quiz.id}:`, errorMessage);

      // Record the error with details
      errorRecords.push({
        quizId: quiz.id,
        question: quiz.question.substring(0, 100) + (quiz.question.length > 100 ? '...' : ''),
        answer: quiz.answer,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    // Add a small delay to avoid rate limiting
    if (i < quizzes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save error records to file if any errors occurred
  let errorFilePath: string | undefined;
  if (errorRecords.length > 0) {
    errorFilePath = saveErrorRecords(errorRecords);
    console.log(`\n💾 Error records saved to: ${errorFilePath}`);
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`   Total quizzes: ${quizzes.length}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount > 0 && errorFilePath) {
    console.log('\n📋 Error Details:');
    errorRecords.forEach((err, idx) => {
      console.log(`   ${idx + 1}. Quiz ID: ${err.quizId}`);
      console.log(`      Question: ${err.question}`);
      console.log(`      Error: ${err.error}`);
    });
    console.log(`\n💡 To retry failed quizzes, run:`);
    console.log(`   tsx scripts/generate-fill-blank-alternatives.ts --retry-errors=${path.basename(errorFilePath)}`);
  }

  if (options.dryRun) {
    console.log('\n🔍 This was a dry run. No changes were made to the database.');
    console.log('   Run without --dry-run to apply changes.');
  }

  console.log('\n✅ Script completed successfully!\n');
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  if (error instanceof Error) {
    console.error(error.stack);
  }
  process.exit(1);
});
