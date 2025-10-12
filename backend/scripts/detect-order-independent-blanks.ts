#!/usr/bin/env tsx
/**
 * Detect and Fix Order-Independent Blanks in Fill-in-the-Blank Questions
 *
 * This script detects fill-in-the-blank quizzes where blanks are semantically
 * interchangeable (e.g., parallel items, coordinate concepts) and adds
 * cross-referenced alternative answers to allow students to answer in any order.
 *
 * Problem it solves:
 * - Question: "北宋和北方的____、____政权"
 * - Answer: ["辽", "西夏"]
 * - Student writes: "西夏、辽" (reversed order)
 * - Without this fix: ❌ Marked wrong
 * - With this fix: ✅ Marked correct
 *
 * Requirements:
 * - Node.js 18+
 * - tsx (use npx or install globally)
 * - Backend API server running
 * - LLM API key configured
 *
 * Usage:
 *   source .envrc
 *   npx tsx scripts/detect-order-independent-blanks.ts
 *
 * Options:
 *   --dry-run            Preview changes without updating
 *   --limit=N            Process only first N quizzes
 *   --force              Re-analyze even if already has cross-referenced alternatives
 *   --jwt-token=TOKEN    JWT token for authentication
 *   --username=EMAIL     Teacher email for login
 *   --password=PASS      Teacher password for login
 *
 * Examples:
 *   # Dry run
 *   npx tsx scripts/detect-order-independent-blanks.ts --dry-run
 *
 *   # Process first 10 quizzes
 *   npx tsx scripts/detect-order-independent-blanks.ts --limit=10 --jwt-token=...
 *
 *   # Force re-analysis
 *   npx tsx scripts/detect-order-independent-blanks.ts --force --jwt-token=...
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
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
  jwtToken: string;
}

interface ScriptOptions {
  dryRun: boolean;
  limit?: number;
  force: boolean;
  jwtToken?: string;
  username?: string;
  password?: string;
  apiUrl?: string;
}

interface QuizItem {
  id: string;
  type: string;
  question: string;
  answer: string | string[];
  alternative_answers?: string[];
  hints?: (string | null)[] | null;
}

interface OrderAnalysisResult {
  is_order_independent: boolean;
  interchangeable_pairs: number[][];  // e.g., [[0, 1], [2, 3]]
  reasoning: string;
}

interface ErrorRecord {
  quizId: string;
  question: string;
  answer: string | string[];
  error: string;
  timestamp: string;
}

// ============================================================================
// Authentication (reuse from generate-fill-blank-alternatives.ts)
// ============================================================================

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    let password = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          stdin.setRawMode(false);
          process.exit();
          break;
        case '\u007f':
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126) {
            password += char;
            stdout.write('*');
          }
          break;
      }
    };

    stdin.on('data', onData);
  });
}

async function loginWithCredentials(apiUrl: string, username: string, password: string): Promise<string> {
  console.log(`\n🔐 Logging in as ${username}...`);

  const response = await fetch(`${apiUrl}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: username, password: password, role: 'teacher' }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('Login response missing token');
  }

  console.log('   ✅ Login successful');
  return data.token;
}

async function getAuthToken(apiUrl: string, options: ScriptOptions): Promise<string> {
  if (options.jwtToken) {
    console.log('\n🔑 Using JWT token from command line');
    return options.jwtToken;
  }

  if (options.username && options.password) {
    return loginWithCredentials(apiUrl, options.username, options.password);
  }

  console.log('\n🔐 Authentication Required');
  console.log('   Choose method: 1=Token, 2=Login');
  const method = await promptInput('   Method (1/2): ');

  if (method === '1') {
    const token = await promptInput('   JWT token: ');
    if (!token.trim()) throw new Error('Token cannot be empty');
    return token.trim();
  } else if (method === '2') {
    const username = await promptInput('   Email: ');
    const password = await promptPassword('   Password: ');
    if (!username.trim() || !password.trim()) throw new Error('Credentials cannot be empty');
    return loginWithCredentials(apiUrl, username.trim(), password);
  } else {
    throw new Error('Invalid method');
  }
}

// ============================================================================
// Command Line Parsing
// ============================================================================

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) options.limit = parseInt(arg.split('=')[1], 10);
    if (arg.startsWith('--jwt-token=')) options.jwtToken = arg.split('=')[1];
    if (arg.startsWith('--username=')) options.username = arg.split('=')[1];
    if (arg.startsWith('--password=')) options.password = arg.split('=')[1];
    if (arg.startsWith('--api-url=')) options.apiUrl = arg.split('=')[1];
  }

  return options;
}

async function loadConfig(options: ScriptOptions): Promise<Config> {
  const apiPort = process.env.API_PORT || '8718';
  const apiUrl = options.apiUrl || `http://localhost:${apiPort}`;
  const llmApiKey = process.env.LLM_API_KEY || '';
  const llmModel = process.env.LLM_MODEL_QUIZ_PARSER || 'gpt-4o';
  const llmTemperature = parseFloat(process.env.LLM_TEMP_QUIZ_PARSER || '0.1');
  const llmMaxTokens = parseInt(process.env.LLM_MAX_TOKENS_QUIZ_PARSER || '4000', 10);
  const llmBaseUrl = process.env.LLM_BASE_URL || undefined;

  if (!llmApiKey || llmApiKey === 'your-llm-api-key-here') {
    throw new Error('LLM_API_KEY not set');
  }

  const jwtToken = await getAuthToken(apiUrl, options);

  return { apiUrl, llmApiKey, llmModel, llmTemperature, llmMaxTokens, llmBaseUrl, jwtToken };
}

// ============================================================================
// Error Tracking
// ============================================================================

function saveErrorRecords(errors: ErrorRecord[]): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `order-independent-errors-${timestamp}.json`;
  const filepath = path.resolve(process.cwd(), filename);
  fs.writeFileSync(filepath, JSON.stringify(errors, null, 2), 'utf-8');
  return filepath;
}

// ============================================================================
// API Operations
// ============================================================================

async function fetchMultiBlankQuizzes(apiUrl: string, jwtToken: string, options: ScriptOptions): Promise<QuizItem[]> {
  console.log('\n📊 Fetching multi-blank fill-in-the-blank quizzes...');

  const headers = { 'Authorization': `Bearer ${jwtToken}` };
  let page = 1;
  const limit = 100;
  const allQuizzes: QuizItem[] = [];

  while (true) {
    const url = `${apiUrl}/v1/quiz?page=${page}&limit=${limit}&type=fill-in-the-blank`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
    }

    const data = await response.json();
    const quizzes = data.data || [];
    allQuizzes.push(...quizzes);

    if (quizzes.length < limit) break;
    page++;
    if (options.limit && allQuizzes.length >= options.limit) break;
  }

  // Filter to only multi-blank quizzes
  const multiBlankQuizzes = allQuizzes.filter(quiz => {
    const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
    return answer.length > 1;
  });

  const result = options.limit ? multiBlankQuizzes.slice(0, options.limit) : multiBlankQuizzes;
  console.log(`✅ Found ${result.length} multi-blank quizzes`);

  return result;
}

function hasConjunctions(question: string): boolean {
  // Check if question contains conjunctions that might indicate parallel blanks
  const conjunctions = ['和', '与', '以及', '、'];
  return conjunctions.some(conj => question.includes(conj));
}

function needsAnalysis(quiz: QuizItem, force: boolean): boolean {
  if (force) return true;

  // Pre-filter: Only analyze if question contains conjunctions (saves tokens)
  if (!hasConjunctions(quiz.question)) {
    return false;
  }

  // Check if already has cross-referenced alternatives
  const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
  const alternatives = quiz.alternative_answers || [];

  // Check if any alternative has position prefix from another blank
  for (let i = 0; i < answer.length; i++) {
    for (let j = 0; j < answer.length; j++) {
      if (i !== j) {
        const crossRef = `[${i}]${answer[j]}`;
        if (alternatives.includes(crossRef)) {
          return false; // Already has cross-reference
        }
      }
    }
  }

  return true;
}

async function updateQuizViaAPI(apiUrl: string, jwtToken: string, quizId: string, alternatives: string[]): Promise<void> {
  const response = await fetch(`${apiUrl}/v1/quiz/${quizId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ alternative_answers: alternatives }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update quiz: ${response.statusText} - ${errorText}`);
  }
}

// ============================================================================
// GPT Analysis
// ============================================================================

function buildAnalysisPrompt(quiz: QuizItem): string {
  const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];

  return `你是一位专业的中学教育专家。请分析以下填空题，判断各空格之间是否可以互换顺序。

## 填空题信息
**题目**: ${quiz.question}
**答案**: ${JSON.stringify(quiz.answer)}

## 判断标准
对于多空格填空题，判断各空格之间是否存在顺序要求：

✅ **可互换的情况**（平等并列关系）：
- 答案是平等的并列关系，顺序不影响语义
- 例如："____和____政权" 答案：["辽", "西夏"] → 可互换
- 例如："____和____是重要发明" 答案：["火药", "指南针"] → 可互换

❌ **不可互换的情况**（有明确关系或顺序）：
- 答案之间有明确的从属、因果、时序等关系
- 例如："____的____去世了" 答案：["爷爷", "孙子"] → 不可互换
- 例如："从____到____" 答案：["1949", "1976"] → 不可互换

## 任务
1. 分析题目中各空格的答案是否可以互换顺序
2. 如果可以互换，指出哪些空格之间可以互换（用索引表示，从0开始）
3. 提供简短的判断理由

## 输出格式
请以JSON格式返回：

\`\`\`json
{
  "is_order_independent": true/false,
  "interchangeable_pairs": [[0, 1], [2, 3]],  // 可互换的空格对，如果不可互换则为空数组
  "reasoning": "判断理由"
}
\`\`\`

注意：
- interchangeable_pairs 是二维数组，每个子数组包含可以互换的空格索引
- 如果所有空格都可以任意互换，可以列出所有组合
- 只有真正语义上可以互换的才返回true，不确定时返回false`;
}

async function analyzeOrderIndependence(
  openai: OpenAI,
  config: Config,
  quiz: QuizItem
): Promise<OrderAnalysisResult> {
  const prompt = buildAnalysisPrompt(quiz);

  console.log(`  🤖 Analyzing with ${config.llmModel}...`);

  const completion = await openai.chat.completions.create({
    model: config.llmModel,
    messages: [
      {
        role: 'system',
        content: '你是一位专业的中学教育专家，擅长分析题目的语义关系和逻辑结构。',
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

  const parsed = JSON.parse(responseText);
  return {
    is_order_independent: parsed.is_order_independent || false,
    interchangeable_pairs: parsed.interchangeable_pairs || [],
    reasoning: parsed.reasoning || '',
  };
}

// ============================================================================
// Main Processing
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

  // Pre-filter check
  if (!options.force && !hasConjunctions(quiz.question)) {
    console.log(`  ⏭️  Skipping - no conjunctions found (和/与/以及/、)`);
    return false;
  }

  if (!needsAnalysis(quiz, options.force)) {
    console.log(`  ⏭️  Skipping - already has cross-referenced alternatives`);
    return false;
  }

  try {
    const analysis = await analyzeOrderIndependence(openai, config, quiz);

    console.log(`  📊 Analysis:`);
    console.log(`     Order-independent: ${analysis.is_order_independent}`);
    console.log(`     Interchangeable pairs: ${JSON.stringify(analysis.interchangeable_pairs)}`);
    console.log(`     Reasoning: ${analysis.reasoning}`);

    if (!analysis.is_order_independent || analysis.interchangeable_pairs.length === 0) {
      console.log(`  ℹ️  No order-independent blanks detected`);
      return false;
    }

    // Build new alternative_answers with cross-references
    const answer = Array.isArray(quiz.answer) ? quiz.answer : [quiz.answer];
    const existingAlts = quiz.alternative_answers || [];
    const newAlts = [...existingAlts];

    // Add cross-references for each interchangeable pair
    for (const [idx1, idx2] of analysis.interchangeable_pairs) {
      // Add answer[idx2] as alternative for position idx1
      const crossRef1 = `[${idx1}]${answer[idx2]}`;
      if (!newAlts.includes(crossRef1)) {
        newAlts.push(crossRef1);
      }

      // Add answer[idx1] as alternative for position idx2
      const crossRef2 = `[${idx2}]${answer[idx1]}`;
      if (!newAlts.includes(crossRef2)) {
        newAlts.push(crossRef2);
      }
    }

    console.log(`  ✨ New alternatives: ${JSON.stringify(newAlts)}`);

    if (options.dryRun) {
      console.log(`  🔍 [DRY RUN] Would update via API`);
    } else {
      await updateQuizViaAPI(config.apiUrl, config.jwtToken, quiz.id, newAlts);
      console.log(`  💾 Successfully updated via API`);
    }

    return true;
  } catch (error) {
    console.error(`  ❌ Error processing quiz ${quiz.id}:`, error);
    if (error instanceof Error) {
      console.error(`     ${error.message}`);
    }
    throw error;
  }
}

async function main() {
  console.log('🚀 Order-Independent Blanks Detection & Fixer');
  console.log('='.repeat(70));

  const options = parseArgs();

  console.log('\n⚙️  Script Options:');
  console.log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
  console.log(`   Limit: ${options.limit || 'No limit'}`);
  console.log(`   Force: ${options.force ? 'Yes' : 'No'}`);

  console.log('\n🔧 Loading configuration and authenticating...');
  const config = await loadConfig(options);
  console.log('   ✅ Configuration loaded');

  const openai = new OpenAI({
    apiKey: config.llmApiKey,
    baseURL: config.llmBaseUrl,
  });

  const quizzes = await fetchMultiBlankQuizzes(config.apiUrl, config.jwtToken, options);

  if (quizzes.length === 0) {
    console.log('\n⚠️  No multi-blank quizzes found.');
    return;
  }

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

      errorRecords.push({
        quizId: quiz.id,
        question: quiz.question.substring(0, 100),
        answer: quiz.answer,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    if (i < quizzes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  let errorFilePath: string | undefined;
  if (errorRecords.length > 0) {
    errorFilePath = saveErrorRecords(errorRecords);
    console.log(`\n💾 Error records saved to: ${errorFilePath}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`   Total quizzes: ${quizzes.length}`);
  console.log(`   ✅ Updated: ${updatedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errorCount > 0 && errorFilePath) {
    console.log(`\n💡 To retry errors: --retry-errors=${path.basename(errorFilePath)}`);
  }

  if (options.dryRun) {
    console.log('\n🔍 Dry run completed. No changes made.');
  }

  console.log('\n✅ Script completed!\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  if (error instanceof Error) {
    console.error(error.stack);
  }
  process.exit(1);
});
