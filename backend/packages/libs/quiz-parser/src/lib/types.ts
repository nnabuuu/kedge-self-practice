export interface ParagraphBlock {
  paragraph: string;
  highlighted: { text: string; color: string }[];
}

export interface QuizItem {
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options?: string[];
  answer?: string | string[] | number[];
}
