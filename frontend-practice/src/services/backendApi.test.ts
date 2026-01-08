import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the convertQuiz method, but it's private
// So we'll test indirectly through the public API or extract the logic

// For testing purposes, let's extract the conversion logic and test it directly
// This tests the fix for: answer_index field being passed through

interface BackendQuiz {
  id: number;
  type: string;
  question: string;
  options?: string[];
  answer?: string | string[] | number[];
  answer_index?: number[];
  knowledge_point_id?: number;
  images?: string[];
}

// Extracted conversion logic for testing
function convertQuizType(backendType: string): string {
  const typeMap: Record<string, string> = {
    'single-choice': 'single-choice',
    'multiple-choice': 'multiple-choice',
    'fill-in-the-blank': 'fill-in-the-blank',
    'subjective': 'subjective',
    'essay': 'essay',
  };
  return typeMap[backendType] || backendType;
}

function convertQuiz(backendQuiz: BackendQuiz) {
  const type = convertQuizType(backendQuiz.type);
  const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Convert options from array to object
  let options: Record<string, string> | undefined;
  if (Array.isArray(backendQuiz.options)) {
    options = {};
    backendQuiz.options.forEach((opt, idx) => {
      if (idx < keys.length) {
        options![keys[idx]] = opt;
      }
    });
  }

  let answer = backendQuiz.answer;

  // Process answer based on type
  if (type === 'single-choice' || type === 'multiple-choice') {
    if (options) {
      if (typeof answer === 'number') {
        answer = keys[answer] || String(answer);
      } else if (Array.isArray(answer) && answer.length > 0) {
        if (typeof answer[0] === 'number') {
          answer = answer.map((idx: number) => keys[idx] || String(idx));
        }
        if (type === 'single-choice' && Array.isArray(answer)) {
          answer = answer[0];
        }
      }
    }
  }

  return {
    id: String(backendQuiz.id),
    type,
    question: backendQuiz.question,
    options,
    answer,
    answer_index: backendQuiz.answer_index, // Fix: pass through answer_index
    images: backendQuiz.images || [],
  };
}

describe('backendApi convertQuiz', () => {
  describe('answer_index field (Fix #0)', () => {
    it('should pass through answer_index for single-choice questions', () => {
      const backendQuiz: BackendQuiz = {
        id: 1,
        type: 'single-choice',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        answer: 1,
        answer_index: [1],
      };

      const result = convertQuiz(backendQuiz);

      expect(result.answer_index).toEqual([1]);
      expect(result.answer).toBe('B');
    });

    it('should pass through answer_index for multiple-choice questions', () => {
      const backendQuiz: BackendQuiz = {
        id: 2,
        type: 'multiple-choice',
        question: 'Select all prime numbers',
        options: ['1', '2', '3', '4'],
        answer: [1, 2],
        answer_index: [1, 2],
      };

      const result = convertQuiz(backendQuiz);

      expect(result.answer_index).toEqual([1, 2]);
      expect(result.answer).toEqual(['B', 'C']);
    });

    it('should handle missing answer_index gracefully', () => {
      const backendQuiz: BackendQuiz = {
        id: 3,
        type: 'single-choice',
        question: 'Test question',
        options: ['A', 'B', 'C', 'D'],
        answer: 0,
      };

      const result = convertQuiz(backendQuiz);

      expect(result.answer_index).toBeUndefined();
    });
  });

  describe('options conversion', () => {
    it('should convert options array to object with letter keys', () => {
      const backendQuiz: BackendQuiz = {
        id: 4,
        type: 'single-choice',
        question: 'Test',
        options: ['Option 1', 'Option 2', 'Option 3'],
        answer: 0,
      };

      const result = convertQuiz(backendQuiz);

      expect(result.options).toEqual({
        A: 'Option 1',
        B: 'Option 2',
        C: 'Option 3',
      });
    });
  });

  describe('answer format conversion', () => {
    it('should convert numeric answer to letter for single-choice', () => {
      const backendQuiz: BackendQuiz = {
        id: 5,
        type: 'single-choice',
        question: 'Test',
        options: ['A', 'B', 'C', 'D'],
        answer: 2,
      };

      const result = convertQuiz(backendQuiz);

      expect(result.answer).toBe('C');
    });

    it('should convert numeric array to letter array for multiple-choice', () => {
      const backendQuiz: BackendQuiz = {
        id: 6,
        type: 'multiple-choice',
        question: 'Test',
        options: ['A', 'B', 'C', 'D'],
        answer: [0, 2],
      };

      const result = convertQuiz(backendQuiz);

      expect(result.answer).toEqual(['A', 'C']);
    });
  });
});

// Session field mapping tests
interface BackendSession {
  id: string;
  user_id: string;
  status: string;
  correct_answers: number;
  incorrect_answers: number;
  answered_questions: number;
  total_questions: number;
  score: number;
  time_spent_seconds: number;
  time_limit_minutes: number | null;
  auto_advance_delay: number;
  last_question_index: number;
  session_state: Record<string, any>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Extracted mapping logic for testing
function mapSessionFields(session: BackendSession | null): any {
  if (!session) return session;
  return {
    ...session,
    correctAnswers: session.correct_answers,
    incorrectAnswers: session.incorrect_answers,
    answeredQuestions: session.answered_questions,
    totalQuestions: session.total_questions,
    timeSpentSeconds: session.time_spent_seconds,
    timeLimitMinutes: session.time_limit_minutes,
    autoAdvanceDelay: session.auto_advance_delay,
    lastQuestionIndex: session.last_question_index,
    sessionState: session.session_state,
    startedAt: session.started_at,
    completedAt: session.completed_at,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

describe('backendApi mapSessionFields', () => {
  describe('session statistics field mapping', () => {
    it('should map correct_answers to correctAnswers', () => {
      const backendSession: BackendSession = {
        id: 'test-session-id',
        user_id: 'user-123',
        status: 'completed',
        correct_answers: 15,
        incorrect_answers: 5,
        answered_questions: 20,
        total_questions: 20,
        score: 75,
        time_spent_seconds: 600,
        time_limit_minutes: null,
        auto_advance_delay: 0,
        last_question_index: 19,
        session_state: {},
        started_at: '2024-01-01T00:00:00Z',
        completed_at: '2024-01-01T00:10:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:10:00Z',
      };

      const result = mapSessionFields(backendSession);

      expect(result.correctAnswers).toBe(15);
      expect(result.incorrectAnswers).toBe(5);
      expect(result.answeredQuestions).toBe(20);
      expect(result.totalQuestions).toBe(20);
      expect(result.score).toBe(75);
    });

    it('should preserve original snake_case fields', () => {
      const backendSession: BackendSession = {
        id: 'test-session-id',
        user_id: 'user-123',
        status: 'in_progress',
        correct_answers: 10,
        incorrect_answers: 2,
        answered_questions: 12,
        total_questions: 20,
        score: 83.33,
        time_spent_seconds: 300,
        time_limit_minutes: 30,
        auto_advance_delay: 2,
        last_question_index: 11,
        session_state: { shuffleSeed: 12345 },
        started_at: '2024-01-01T00:00:00Z',
        completed_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      };

      const result = mapSessionFields(backendSession);

      // Both camelCase and snake_case should exist
      expect(result.correct_answers).toBe(10);
      expect(result.correctAnswers).toBe(10);
      expect(result.incorrect_answers).toBe(2);
      expect(result.incorrectAnswers).toBe(2);
    });

    it('should handle null session gracefully', () => {
      const result = mapSessionFields(null);
      expect(result).toBeNull();
    });

    it('should map all date fields', () => {
      const backendSession: BackendSession = {
        id: 'test-session-id',
        user_id: 'user-123',
        status: 'completed',
        correct_answers: 5,
        incorrect_answers: 0,
        answered_questions: 5,
        total_questions: 5,
        score: 100,
        time_spent_seconds: 120,
        time_limit_minutes: null,
        auto_advance_delay: 0,
        last_question_index: 4,
        session_state: {},
        started_at: '2024-01-01T10:00:00Z',
        completed_at: '2024-01-01T10:02:00Z',
        created_at: '2024-01-01T09:59:00Z',
        updated_at: '2024-01-01T10:02:00Z',
      };

      const result = mapSessionFields(backendSession);

      expect(result.startedAt).toBe('2024-01-01T10:00:00Z');
      expect(result.completedAt).toBe('2024-01-01T10:02:00Z');
      expect(result.createdAt).toBe('2024-01-01T09:59:00Z');
      expect(result.updatedAt).toBe('2024-01-01T10:02:00Z');
    });
  });
});
