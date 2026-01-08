import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultipleChoiceQuestion } from './MultipleChoiceQuestion';
import { QuizQuestion } from '../../types/quiz';

describe('MultipleChoiceQuestion', () => {
  const baseQuestion: QuizQuestion = {
    id: '1',
    type: 'multiple-choice',
    question: 'Select all correct answers',
    options: {
      A: 'Option A',
      B: 'Option B',
      C: 'Option C',
      D: 'Option D',
    },
    answer: ['A', 'C'],
  };

  const defaultProps = {
    question: baseQuestion,
    selectedAnswers: [],
    showResult: false,
    onAnswerToggle: vi.fn(),
    isAnswerCorrect: () => false,
  };

  describe('answer format compatibility (Fix #2)', () => {
    it('should handle answer as array of strings', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: ['A', 'C'],
      };

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          question={question}
          showResult={true}
        />
      );

      // Options A and C should be marked as correct
      const optionA = screen.getByText(/A\. Option A/);
      const optionC = screen.getByText(/C\. Option C/);

      // Check that correct options have green styling
      expect(optionA.closest('button')).toHaveClass('border-green-500');
      expect(optionC.closest('button')).toHaveClass('border-green-500');
    });

    it('should handle answer as comma-separated string', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: 'A, C' as any, // Backend might send comma-separated string
      };

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          question={question}
          showResult={true}
        />
      );

      // Options A and C should be marked as correct
      const optionA = screen.getByText(/A\. Option A/);
      const optionC = screen.getByText(/C\. Option C/);

      expect(optionA.closest('button')).toHaveClass('border-green-500');
      expect(optionC.closest('button')).toHaveClass('border-green-500');
    });

    it('should handle answer as comma-separated string without spaces', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: 'B,D' as any,
      };

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          question={question}
          showResult={true}
        />
      );

      const optionB = screen.getByText(/B\. Option B/);
      const optionD = screen.getByText(/D\. Option D/);

      expect(optionB.closest('button')).toHaveClass('border-green-500');
      expect(optionD.closest('button')).toHaveClass('border-green-500');
    });

    it('should handle empty answer gracefully', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: undefined as any,
      };

      // Should not throw
      expect(() => {
        render(
          <MultipleChoiceQuestion
            {...defaultProps}
            question={question}
            showResult={true}
          />
        );
      }).not.toThrow();
    });
  });

  describe('option selection', () => {
    it('should call onAnswerToggle when option is clicked', () => {
      const onAnswerToggle = vi.fn();

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          onAnswerToggle={onAnswerToggle}
        />
      );

      const optionA = screen.getByText(/A\. Option A/);
      fireEvent.click(optionA);

      expect(onAnswerToggle).toHaveBeenCalledWith('A');
    });

    it('should not allow selection when showResult is true', () => {
      const onAnswerToggle = vi.fn();

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          showResult={true}
          onAnswerToggle={onAnswerToggle}
        />
      );

      const optionA = screen.getByText(/A\. Option A/);
      fireEvent.click(optionA);

      expect(onAnswerToggle).not.toHaveBeenCalled();
    });
  });

  describe('result display', () => {
    it('should show wrong indicator for incorrect selected answers', () => {
      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          selectedAnswers={['B']}
          showResult={true}
        />
      );

      const optionB = screen.getByText(/B\. Option B/);
      expect(optionB.closest('button')).toHaveClass('border-red-500');
    });

    it('should show explanation when answer is incorrect', () => {
      const questionWithExplanation: QuizQuestion = {
        ...baseQuestion,
        explanation: 'This is the explanation',
      };

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          question={questionWithExplanation}
          selectedAnswers={['B']}
          showResult={true}
          isAnswerCorrect={() => false}
        />
      );

      expect(screen.getByText('This is the explanation')).toBeInTheDocument();
    });

    it('should not show explanation when answer is correct', () => {
      const questionWithExplanation: QuizQuestion = {
        ...baseQuestion,
        explanation: 'This is the explanation',
      };

      render(
        <MultipleChoiceQuestion
          {...defaultProps}
          question={questionWithExplanation}
          selectedAnswers={['A', 'C']}
          showResult={true}
          isAnswerCorrect={() => true}
        />
      );

      expect(screen.queryByText('This is the explanation')).not.toBeInTheDocument();
    });
  });
});
