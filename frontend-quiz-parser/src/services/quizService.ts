import { ParagraphData, QuizItem, GPTQuizResponse, KnowledgePoint } from '../types/quiz';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_URL = `${API_BASE_URL}/${API_VERSION}`;

export const uploadDocxFile = async (file: File): Promise<ParagraphData[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/docx/extract-quiz-with-images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.statusText}`);
  }

  return response.json();
};

export const extractQuizFromParagraphs = async (paragraphs: ParagraphData[]): Promise<QuizItem[]> => {
  const response = await fetch(`${API_URL}/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paragraphs }),
  });

  if (!response.ok) {
    throw new Error(`题目提取失败: ${response.statusText}`);
  }

  const data: QuizItem[] = await response.json();
  console.log('Quiz extraction successful, items count:', data.length);
  return data;
};

export const polishQuizItem = async (item: QuizItem): Promise<QuizItem> => {
  const response = await fetch(`${API_URL}/quiz/polish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ item }),
  });

  if (!response.ok) {
    throw new Error(`题目润色失败: ${response.statusText}`);
  }

  const data: QuizItem = await response.json();
  return data;
};

export const matchKnowledgePoints = async (quiz: QuizItem): Promise<KnowledgePoint[]> => {
  const response = await fetch(`${API_URL}/knowledge/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quiz }),
  });

  if (!response.ok) {
    throw new Error(`知识点匹配失败: ${response.statusText}`);
  }

  const data: KnowledgePoint[] = await response.json();
  return data;
};

export const downloadExcel = (data: any[], filename: string = 'quiz_export.xlsx') => {
  // This is a placeholder - actual Excel export would use a library like xlsx
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace('.xlsx', '.json');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};