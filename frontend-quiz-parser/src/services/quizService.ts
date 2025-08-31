import { ParagraphData, QuizItem, GPTQuizResponse, KnowledgePoint } from '../types/quiz';

export const uploadDocxFile = async (file: File): Promise<ParagraphData[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://cyez.jiaoshi.one/v1/docx/extract-quiz-with-images', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`上传失败: ${response.statusText}`);
  }

  return response.json();
};

export const extractQuizFromParagraphs = async (paragraphs: ParagraphData[]): Promise<QuizItem[]> => {
  const response = await fetch('https://cyez.jiaoshi.one/v1/quiz/generate', {
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

  // ✅ 安全检查，确保返回的是数组格式
  if (!Array.isArray(data)) {
    console.error('Invalid response format:', data);
    throw new Error('题目提取失败：返回格式不正确');
  }

  console.log('Quiz extraction successful, items count:', data.length);
  return data;
};

export const polishQuizItem = async (item: QuizItem): Promise<QuizItem> => {
  const response = await fetch('https://cyez.jiaoshi.one/v1/quiz/polish', {
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

export const changeQuizType = async (item: QuizItem, newType: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective'): Promise<QuizItem> => {
  const response = await fetch('https://cyez.jiaoshi.one/v1/quiz/change-type', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ item, newType }),
  });

  if (!response.ok) {
    throw new Error(`题目类型修改失败: ${response.statusText}`);
  }

  const data: QuizItem = await response.json();
  return data;
};

export const matchKnowledgePoint = async (item: QuizItem): Promise<{matched?: KnowledgePoint, candidates: KnowledgePoint[], keywords: string[], country: string, dynasty: string}> => {
  const response = await fetch('https://cyez.jiaoshi.one/v1/knowledge-points/match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error(`知识点匹配失败: ${response.statusText}`);
  }

  const data: {matched?: KnowledgePoint, candidates: KnowledgePoint[], keywords: string[], country: string, dynasty: string} = await response.json();
  return data;
};