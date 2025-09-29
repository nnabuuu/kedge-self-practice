/**
 * Convert letter-based answers (A, B, C, D) to numeric indices (0, 1, 2, 3)
 * for more efficient backend processing
 */

const LETTER_TO_INDEX: Record<string, number> = {
  'A': 0,
  'B': 1,
  'C': 2,
  'D': 3,
  'E': 4,
  'F': 5
};

const INDEX_TO_LETTER = ['A', 'B', 'C', 'D', 'E', 'F'];

/**
 * Convert a letter answer to numeric index
 * @param letter The answer letter (A, B, C, D, etc.)
 * @returns The numeric index (0-based) or the original if not a letter
 */
export function letterToIndex(letter: string): number | string {
  const upperLetter = letter.toUpperCase();
  if (upperLetter in LETTER_TO_INDEX) {
    return LETTER_TO_INDEX[upperLetter];
  }
  // If it's already a number string, return as number
  const num = parseInt(letter, 10);
  if (!isNaN(num)) {
    return num;
  }
  return letter; // Return original if can't convert
}

/**
 * Convert a numeric index to letter answer
 * @param index The numeric index (0-based)
 * @returns The letter (A, B, C, D, etc.)
 */
export function indexToLetter(index: number): string {
  if (index >= 0 && index < INDEX_TO_LETTER.length) {
    return INDEX_TO_LETTER[index];
  }
  return String(index); // Return as string if out of range
}

/**
 * Convert multiple-choice answer array to indices
 * @param answers Array of letter answers
 * @returns Array of numeric indices
 */
export function lettersToIndices(answers: string[]): number[] {
  return answers.map(letter => {
    const result = letterToIndex(letter);
    return typeof result === 'number' ? result : -1;
  }).filter(idx => idx !== -1);
}

/**
 * Format answer for submission to backend
 * For single-choice: submit the index as a string
 * For multiple-choice: submit comma-separated indices
 * For fill-in-blank: submit with ||| separator
 * For others: submit as-is
 */
export function formatAnswerForSubmission(
  answer: string | string[] | null,
  questionType: string
): string {
  if (!answer) return '';
  
  if (questionType === 'single-choice') {
    // Convert letter to index for single-choice
    if (typeof answer === 'string') {
      const index = letterToIndex(answer);
      return String(index);
    }
  } else if (questionType === 'multiple-choice') {
    // Convert letters to indices for multiple-choice
    if (Array.isArray(answer)) {
      const indices = lettersToIndices(answer);
      return indices.join(',');
    } else if (typeof answer === 'string' && answer.includes(',')) {
      // Handle comma-separated letters
      const letters = answer.split(',').map(s => s.trim());
      const indices = lettersToIndices(letters);
      return indices.join(',');
    }
  } else if (questionType === 'fill-in-the-blank') {
    // Join multiple blanks with |||
    if (Array.isArray(answer)) {
      return answer.join('|||');
    }
  }
  
  // For other types, return as string
  return typeof answer === 'string' ? answer : String(answer);
}