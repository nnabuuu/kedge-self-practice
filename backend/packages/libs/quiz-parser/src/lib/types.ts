export interface DocxImage {
  id: string;
  filename: string;
  data: Buffer;
  contentType: string;
  width?: number;
  height?: number;
}

export interface ParagraphBlock {
  paragraph: string;
  highlighted: { text: string; color: string }[];
  images: DocxImage[];
}

export interface QuizItem {
  type: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective' | 'other';
  question: string;
  options?: string[];
  answer?: string | string[] | number[];
}
