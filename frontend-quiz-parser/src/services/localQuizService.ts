import { ParagraphData, QuizItem, KnowledgePoint, QuizWithKnowledgePoint } from '../types/quiz';
import { apiFetch } from './api';

// Image processing utilities
export const processImagePlaceholders = (text: string, imageUrls: string[]): string => {
  // Replace {{img:N}} placeholders with actual image URLs
  return text.replace(/\{\{img:(\d+)\}\}/g, (match, index) => {
    const imgIndex = parseInt(index, 10);
    if (imageUrls && imageUrls[imgIndex]) {
      return `<img src="${imageUrls[imgIndex]}" alt="Image ${imgIndex + 1}" class="inline-block max-w-full" />`;
    }
    return match; // Keep placeholder if no image available
  });
};

// Upload DOCX file with image support
export const uploadDocxFileWithImages = async (file: File): Promise<{
  paragraphs: ParagraphData[];
  images: string[];
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiFetch('/docx/extract-quiz-with-images', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
  
  const data = await response.json();
  
  return {
    paragraphs: data.paragraphs || [],
    images: data.images || [],
  };
};

// Submit quiz items to backend
export const submitQuizItems = async (quizItems: QuizItem[]): Promise<{
  success: boolean;
  message: string;
  quizIds?: string[];
}> => {
  const response = await apiFetch('/quiz/batch', {
    method: 'POST',
    body: JSON.stringify({ items: quizItems }),
  });
  
  const data = await response.json();
  return data;
};

// Submit quiz with images
export const submitQuizWithImages = async (
  quizItem: QuizItem,
  images?: File[]
): Promise<{
  success: boolean;
  quizId: string;
  attachmentUrls?: string[];
}> => {
  const formData = new FormData();
  
  // Add quiz data
  formData.append('quiz', JSON.stringify(quizItem));
  
  // Add images if provided
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });
  }
  
  const response = await apiFetch('/quiz/submit-with-images', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
  
  const data = await response.json();
  return data;
};

// Get quiz attachment URL
export const getQuizAttachmentUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/api/v1';
  // Remove /api/v1 from base URL if it's already included in the path
  const cleanBaseUrl = baseUrl.replace(/\/api\/v1$/, '');
  return `${cleanBaseUrl}${path}`;
};

// Extract quiz using GPT (local backend)
export const extractQuizFromParagraphsLocal = async (
  paragraphs: ParagraphData[],
  images?: string[]
): Promise<QuizItem[]> => {
  const response = await apiFetch('/gpt/extract-quiz', {
    method: 'POST',
    body: JSON.stringify({ 
      paragraphs,
      images: images || [],
    }),
  });
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    console.error('Invalid response format:', data);
    throw new Error('Quiz extraction failed: Invalid response format');
  }
  
  // Process image placeholders in questions and options
  const processedQuizItems = data.map((item: QuizItem) => ({
    ...item,
    question: images ? processImagePlaceholders(item.question, images) : item.question,
    options: item.options?.map(opt => 
      images ? processImagePlaceholders(opt, images) : opt
    ) || [],
  }));
  
  return processedQuizItems;
};

// Create knowledge point
export const createKnowledgePoint = async (
  knowledgePoint: Omit<KnowledgePoint, 'id'>
): Promise<KnowledgePoint> => {
  const response = await apiFetch('/knowledge-points', {
    method: 'POST',
    body: JSON.stringify(knowledgePoint),
  });
  
  const data = await response.json();
  return data;
};

// List knowledge points
export const listKnowledgePoints = async (): Promise<KnowledgePoint[]> => {
  const response = await apiFetch('/knowledge-points', {
    method: 'GET',
  });
  
  const data = await response.json();
  return data;
};

// Match knowledge point for a quiz item
export const matchKnowledgePointLocal = async (
  item: QuizItem
): Promise<{
  matched?: KnowledgePoint;
  candidates: KnowledgePoint[];
  keywords: string[];
}> => {
  const response = await apiFetch('/knowledge-points/match', {
    method: 'POST',
    body: JSON.stringify(item),
  });
  
  const data = await response.json();
  return data;
};

// Submit quiz with knowledge point association
export const submitQuizWithKnowledgePoint = async (
  quiz: QuizWithKnowledgePoint,
  images?: File[]
): Promise<{
  success: boolean;
  quizId: string;
  message: string;
}> => {
  const formData = new FormData();
  
  // Prepare quiz data with knowledge point
  const quizData = {
    ...quiz,
    knowledgePointId: quiz.knowledgePoint?.id,
  };
  
  formData.append('quiz', JSON.stringify(quizData));
  
  // Add images if provided
  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append('images', image);
    });
  }
  
  const response = await apiFetch('/quiz/submit-with-knowledge-point', {
    method: 'POST',
    body: formData,
    headers: {},
  });
  
  const data = await response.json();
  return data;
};

// Batch submit quizzes with knowledge points
export const batchSubmitQuizzesWithKnowledgePoints = async (
  quizzes: QuizWithKnowledgePoint[]
): Promise<{
  success: boolean;
  successCount: number;
  failCount: number;
  results: Array<{ quizId?: string; error?: string }>;
}> => {
  const response = await apiFetch('/quiz/batch-with-knowledge-points', {
    method: 'POST',
    body: JSON.stringify({ quizzes }),
  });
  
  const data = await response.json();
  return data;
};