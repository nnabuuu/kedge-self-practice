# Answer Format Standard

## Single Source of Truth

All answer handling in the frontend should follow this standard:

### 1. Question Data (After `convertQuiz()`)

**Single-Choice:**
```typescript
{
  type: 'single-choice',
  options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], // ALWAYS array
  answer: "C",  // ALWAYS a letter (A, B, C, D, etc.)
  answer_index: [2]  // Index for reference (0-based)
}
```

**Multiple-Choice:**
```typescript
{
  type: 'multiple-choice',
  options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  answer: ["A", "C"],  // Array of letters
  answer_index: [0, 2]  // Array of indices
}
```

**Fill-in-Blank:**
```typescript
{
  type: 'fill-in-the-blank',
  answer: ["answer1", "answer2"],  // Array of text answers
  alternative_answers: ["alt1", "[0]positionSpecific"],  // Optional alternatives
  order_independent_groups: [[0, 1]]  // Optional order flexibility
}
```

**Key Point:** After `convertQuiz()`, the `answer` field format depends on question type.

### 2. User Submitted Answer (From Backend)

**Single-Choice:**
Backend DB stores: `"2"` (index as string)
Frontend converts to: `"C"` (letter for display)

**Multiple-Choice:**
Backend DB stores: `"0,2"` (comma-separated indices)
Frontend converts to: `["A", "C"]` (array of letters)

**Fill-in-Blank:**
Backend DB stores: `"answer1|||answer2"` (delimited string)
Frontend converts to: `["answer1", "answer2"]` (array of answers)

### 3. Display Format (In Components)

```typescript
// Single-choice
selectedAnswer: "C"  // Letter
correctAnswer: "C"   // Letter (from getCorrectAnswerLetter)

// Multiple-choice
selectedAnswers: ["A", "C"]  // Array of letters
correctAnswers: ["A", "C"]   // Array of letters

// Fill-in-blank
fillInBlankAnswers: ["answer1", "answer2"]  // Array of text
correctAnswers: ["answer1", "answer2"]      // Array of text
```

## Standard Conversion Functions

###convert Index to Letter
```typescript
function indexToLetter(index: number): string {
  return String.fromCharCode(65 + index); // 0→A, 1→B, 2→C
}
```

### Letter to Index
```typescript
function letterToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65; // A→0, B→1, C→2
}
```

## Data Flow

### Single-Choice / Multiple-Choice
```
Backend DB (index: "2")
  ↓
Backend API (answer_index: [2], answer: ["Option 3"])
  ↓
convertQuiz() (answer: "C")  ← STANDARDIZED
  ↓
QuizPracticeWrapper Resume (user_answer: "2" → "C")  ← CONVERT HERE
  ↓
Component Display (selectedAnswer: "C", correctAnswer: "C")
  ↓
Submit (backendApi converts "C" → "2")  ← CONVERT BACK
  ↓
Backend DB (stores index: "2")
```

### Fill-in-Blank
```
Backend DB (text: "answer1|||answer2")
  ↓
Backend API (answer: ["answer1", "answer2"])
  ↓
convertQuiz() (answer: ["answer1", "answer2"])  ← NO CONVERSION NEEDED
  ↓
QuizPracticeWrapper Resume (split "|||" → array)  ← SIMPLE SPLIT
  ↓
Component Display (fillInBlankAnswers: ["answer1", "answer2"])
  ↓
Submit (join array → "answer1|||answer2" happens in backend)
  ↓
Backend DB (stores: "answer1|||answer2")
```

## Rules

1. **Never mix formats** - Once converted to letters, always use letters for choice questions
2. **Convert at boundaries** - Convert backend data immediately upon receipt
3. **Single conversion point** - All conversions happen in QuizPracticeWrapper (resume) and backendApi (submit)
4. **No re-conversion** - Never convert letters back to indices in display components
5. **Fill-in-blank is simple** - Just array ↔ delimited string, no index/letter conversion
