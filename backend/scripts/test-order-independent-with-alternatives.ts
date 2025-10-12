#!/usr/bin/env tsx
/**
 * Test order-independent-groups with alternative_answers
 *
 * Verifies that the evaluation logic correctly handles both features together.
 */

interface TestCase {
  name: string;
  userAnswer: string[];
  expected: boolean;
}

// Quiz configuration
const quiz = {
  question: "北宋与___、___并立，后期___崛起",
  answer: ["辽", "西夏", "金"],
  alternative_answers: ["契丹", "[1]大夏", "金朝"],
  extra_properties: { "order-independent-groups": [[0, 1]] }
};

console.log('📋 Quiz Configuration:');
console.log('Question:', quiz.question);
console.log('Answer:', quiz.answer);
console.log('Alternative answers:', quiz.alternative_answers);
console.log('Order-independent-groups:', quiz.extra_properties['order-independent-groups']);
console.log('');

// Test cases
const testCases: TestCase[] = [
  // Basic tests
  { name: "Original answers in correct order", userAnswer: ["辽", "西夏", "金"], expected: true },
  { name: "Swap positions 0 and 1 (in group)", userAnswer: ["西夏", "辽", "金"], expected: true },

  // Alternative answers
  { name: "Use general alternative for position 0", userAnswer: ["契丹", "西夏", "金"], expected: true },
  { name: "Use position-specific alternative for position 1", userAnswer: ["辽", "大夏", "金"], expected: true },
  { name: "Use general alternative for position 2", userAnswer: ["辽", "西夏", "金朝"], expected: true },

  // Combinations: swap + alternatives
  { name: "Swap + alternative for position 0", userAnswer: ["西夏", "契丹", "金"], expected: true },
  { name: "Swap + alternative for position 1", userAnswer: ["大夏", "辽", "金"], expected: true },
  { name: "All alternatives (no swap)", userAnswer: ["契丹", "大夏", "金朝"], expected: true },
  { name: "All alternatives (with swap)", userAnswer: ["大夏", "契丹", "金朝"], expected: true },

  // Invalid cases
  { name: "Wrong answer for position 2", userAnswer: ["辽", "西夏", "辽"], expected: false },
  { name: "Position 2 in wrong place", userAnswer: ["金", "西夏", "辽"], expected: false },
  { name: "Completely wrong answers", userAnswer: ["宋", "唐", "明"], expected: false },
  { name: "Position-specific alternative in wrong position", userAnswer: ["大夏", "西夏", "金"], expected: false },
];

console.log('🧪 Running Test Cases:\n');

// Helper: normalize answer text
const normalize = (text: string) => text.trim().toLowerCase();

// Helper: check if a single answer matches
const checkAnswerMatch = (
  userAns: string,
  correctAns: string,
  position: number,
  alternativeAnswers: string[]
): boolean => {
  const normalizedUserAns = normalize(userAns);
  const normalizedCorrectAns = normalize(correctAns);

  // Check main answer
  if (normalizedUserAns === normalizedCorrectAns) {
    return true;
  }

  // Check position-specific alternatives
  const positionSpecific = alternativeAnswers
    .filter(alt => alt.startsWith(`[${position}]`))
    .map(alt => normalize(alt.replace(`[${position}]`, '')));

  if (positionSpecific.includes(normalizedUserAns)) {
    return true;
  }

  // Check general alternatives
  const general = alternativeAnswers
    .filter(alt => !alt.match(/^\[\d+\]/))
    .map(alt => normalize(alt));

  return general.includes(normalizedUserAns);
};

// Main evaluation logic (matches backend implementation)
const evaluateAnswer = (
  userAnswers: string[],
  correctAnswers: string[],
  alternativeAnswers: string[],
  orderIndependentGroups: number[][]
): boolean => {
  if (userAnswers.length !== correctAnswers.length) {
    return false;
  }

  const userMatched = new Array(userAnswers.length).fill(false);
  const correctMatched = new Array(correctAnswers.length).fill(false);

  // Build map of position to group index
  const positionToGroup = new Map<number, number>();
  orderIndependentGroups.forEach((group, groupIndex) => {
    group.forEach(pos => positionToGroup.set(pos, groupIndex));
  });

  // Process each order-independent group
  for (const group of orderIndependentGroups) {
    for (const userIdx of group) {
      if (userMatched[userIdx]) continue;

      let matchFound = false;
      for (const correctIdx of group) {
        if (correctMatched[correctIdx]) continue;

        if (checkAnswerMatch(userAnswers[userIdx], correctAnswers[correctIdx], correctIdx, alternativeAnswers)) {
          userMatched[userIdx] = true;
          correctMatched[correctIdx] = true;
          matchFound = true;
          break;
        }
      }

      if (!matchFound) {
        return false;
      }
    }
  }

  // Check positions not in any group (must match exactly)
  for (let i = 0; i < correctAnswers.length; i++) {
    if (!positionToGroup.has(i)) {
      if (!checkAnswerMatch(userAnswers[i], correctAnswers[i], i, alternativeAnswers)) {
        return false;
      }
    }
  }

  return true;
};

// Run tests
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = evaluateAnswer(
    testCase.userAnswer,
    quiz.answer,
    quiz.alternative_answers,
    quiz.extra_properties['order-independent-groups']
  );

  const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
  if (result === testCase.expected) {
    passed++;
  } else {
    failed++;
  }

  console.log(`${index + 1}. ${status}: ${testCase.name}`);
  console.log(`   User answer: [${testCase.userAnswer.join(', ')}]`);
  console.log(`   Expected: ${testCase.expected ? '✓ Correct' : '✗ Wrong'}, Got: ${result ? '✓ Correct' : '✗ Wrong'}`);

  if (result !== testCase.expected) {
    console.log(`   ⚠️  Test failed!`);
  }
  console.log('');
});

// Summary
console.log('═'.repeat(60));
console.log(`📊 Test Summary: ${passed} passed, ${failed} failed out of ${testCases.length} total`);
console.log('═'.repeat(60));

if (failed === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
