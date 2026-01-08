import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerComparisonDisplay } from './AnswerComparisonDisplay';
import { QuizQuestion } from '../../../types/quiz';

describe('AnswerComparisonDisplay', () => {
  const baseQuestion: QuizQuestion = {
    id: '1',
    type: 'fill-in-the-blank',
    question: 'The capital of France is ____',
    answer: ['Paris'],
  };

  const defaultProps = {
    question: baseQuestion,
    answers: ['London'],
    showResult: true,
    isAnswerCorrect: false,
  };

  describe('answer null protection (Fix #1)', () => {
    it('should handle undefined answer gracefully', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: undefined as any,
      };

      // Should not throw
      expect(() => {
        render(
          <AnswerComparisonDisplay
            {...defaultProps}
            question={question}
          />
        );
      }).not.toThrow();
    });

    it('should handle empty array answer gracefully', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: [],
      };

      // Should not throw
      expect(() => {
        render(
          <AnswerComparisonDisplay
            {...defaultProps}
            question={question}
          />
        );
      }).not.toThrow();
    });

    it('should handle null answer gracefully', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: null as any,
      };

      // Should not throw
      expect(() => {
        render(
          <AnswerComparisonDisplay
            {...defaultProps}
            question={question}
          />
        );
      }).not.toThrow();
    });
  });

  describe('display conditions', () => {
    it('should not render when showResult is false', () => {
      const { container } = render(
        <AnswerComparisonDisplay
          {...defaultProps}
          showResult={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when answer is correct', () => {
      const { container } = render(
        <AnswerComparisonDisplay
          {...defaultProps}
          isAnswerCorrect={true}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when showResult is true and answer is incorrect', () => {
      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          showResult={true}
          isAnswerCorrect={false}
        />
      );

      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });
  });

  describe('multiple blanks', () => {
    it('should display all blanks with user answers and correct answers', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        question: '____ is the capital of ____',
        answer: ['Paris', 'France'],
      };

      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          question={question}
          answers={['London', 'England']}
        />
      );

      // Should show blank numbers
      expect(screen.getByText('空格 1')).toBeInTheDocument();
      expect(screen.getByText('空格 2')).toBeInTheDocument();

      // Should show user answers
      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('England')).toBeInTheDocument();

      // Should show correct answers
      expect(screen.getByText('Paris')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
    });

    it('should handle unanswered blanks', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        question: '____ is the capital of ____',
        answer: ['Paris', 'France'],
      };

      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          question={question}
          answers={['', '']}
        />
      );

      // Should show "(未填写)" for empty answers
      const notFilledElements = screen.getAllByText('(未填写)');
      expect(notFilledElements).toHaveLength(2);
    });
  });

  describe('single blank (string answer)', () => {
    it('should handle string answer format', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        answer: 'Paris' as any, // Single answer might be a string
      };

      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          question={question}
          answers={['London']}
        />
      );

      expect(screen.getByText('London')).toBeInTheDocument();
      expect(screen.getByText('Paris')).toBeInTheDocument();
    });
  });

  describe('order-independent groups', () => {
    it('should display group indicator for order-independent answers', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        question: '____ and ____ are EU countries',
        answer: ['France', 'Germany'],
        extra_properties: {
          'order-independent-groups': [[0, 1]],
        },
      };

      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          question={question}
          answers={['Germany', 'France']}
        />
      );

      // Should show interchange indicator
      const interchangeIndicators = screen.getAllByText(/可互换/);
      expect(interchangeIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('explanation', () => {
    it('should display explanation when available', () => {
      const question: QuizQuestion = {
        ...baseQuestion,
        explanation: 'Paris is the capital city of France.',
      };

      render(
        <AnswerComparisonDisplay
          {...defaultProps}
          question={question}
        />
      );

      expect(screen.getByText('Paris is the capital city of France.')).toBeInTheDocument();
    });
  });
});
