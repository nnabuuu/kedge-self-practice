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
  images: string[]; // Legacy format
  extractedImages: Array<{id: string; url: string; filename: string}>; // New UUID format
  imageMapping: Record<string, string>; // UUID to URL mapping
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiFetch('/docx/extract-quiz-with-images', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
  
  const data = await response.json();
  
  // Extract images in both legacy and new formats
  const extractedImages = data.extractedImages || [];
  const legacyImageUrls = extractedImages.map((img: any) => img.url); // For backward compatibility
  
  // Create UUID to URL mapping
  const imageMapping: Record<string, string> = {};
  extractedImages.forEach((img: any) => {
    imageMapping[img.id] = img.url;
  });
  
  return {
    paragraphs: data.paragraphs || [],
    images: legacyImageUrls, // Legacy format for backward compatibility
    extractedImages, // New format with UUIDs
    imageMapping, // Direct UUID to URL mapping
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
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8718/v1';
  // Remove /v1 from base URL if it's already included in the path
  const cleanBaseUrl = baseUrl.replace(/\/v1$/, '');
  return `${cleanBaseUrl}${path}`;
};

// Extract quiz using GPT (local backend)
export const extractQuizFromParagraphsLocal = async (
  paragraphs: ParagraphData[],
  images?: string[],
  options?: {
    targetTypes?: Array<'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective'>;
    maxItems?: number;
  }
): Promise<QuizItem[]> => {
  console.log('=== Frontend Quiz Extraction Debug ===');
  console.log('Sending paragraphs:', paragraphs);
  console.log('Number of paragraphs:', paragraphs.length);
  
  // Clean paragraphs to ensure no images property is sent
  const cleanParagraphs = paragraphs.map(p => ({
    paragraph: p.paragraph || '',
    highlighted: p.highlighted || []
  }));
  
  // Log paragraphs with images
  cleanParagraphs.forEach((p, idx) => {
    if (p.paragraph && p.paragraph.includes('{{image:')) {
      console.log(`Paragraph ${idx} contains images:`, p.paragraph);
    }
  });
  
  const response = await apiFetch('/gpt/extract-quiz', {
    method: 'POST',
    body: JSON.stringify({ 
      paragraphs: cleanParagraphs, // Send clean paragraphs without images property
      images: images || [],
      options: options || {},
    }),
  });
  
  const data = await response.json();
  
  console.log('=== Backend Response ===');
  console.log('Received quiz items:', data);
  console.log('Number of quiz items:', Array.isArray(data) ? data.length : 0);
  
  if (!Array.isArray(data)) {
    console.error('Invalid response format:', data);
    throw new Error('Quiz extraction failed: Invalid response format');
  }
  
  // Log any quiz items with images
  data.forEach((item: QuizItem, idx: number) => {
    if (item.question && item.question.includes('{{image:')) {
      console.log(`Quiz item ${idx} contains images in question:`, item.question);
    }
    if (item.options) {
      item.options.forEach((opt, optIdx) => {
        if (opt && opt.includes('{{image:')) {
          console.log(`Quiz item ${idx} option ${optIdx} contains images:`, opt);
        }
      });
    }
  });
  
  // Don't process image placeholders here - let QuizImageDisplay handle them
  // Just return the raw quiz items with placeholders intact
  return data;
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

// Polish quiz item using GPT
export const polishQuizItem = async (item: QuizItem): Promise<QuizItem> => {
  const response = await apiFetch('/gpt/polish-quiz', {
    method: 'POST',
    body: JSON.stringify({ item }),
  });

  const data: QuizItem = await response.json();
  return data;
};

// Change quiz type
export const changeQuizType = async (
  item: QuizItem, 
  newType: 'single-choice' | 'multiple-choice' | 'fill-in-the-blank' | 'subjective'
): Promise<QuizItem> => {
  const response = await apiFetch('/gpt/change-quiz-type', {
    method: 'POST',
    body: JSON.stringify({ item, newType }),
  });

  const data: QuizItem = await response.json();
  return data;
};

// Match knowledge point for a quiz item
export const matchKnowledgePoint = async (
  item: QuizItem,
  targetHints?: {
    volume?: string;
    unit?: string;
    lesson?: string;
    sub?: string;
  }
): Promise<{
  matched: KnowledgePoint | null;
  candidates: KnowledgePoint[];
  keywords: string[];
  country: string;
  dynasty: string;
}> => {
  // Format answer for better context
  let answerText = '';
  if (item.answer) {
    if (typeof item.answer === 'string') {
      answerText = item.answer;
    } else if (Array.isArray(item.answer)) {
      // For multiple choice, get the actual option text
      if (item.options && typeof item.answer[0] === 'number') {
        answerText = item.answer.map(idx => item.options![idx]).join(', ');
      } else {
        answerText = item.answer.join(', ');
      }
    } else if (typeof item.answer === 'number' && item.options) {
      answerText = item.options[item.answer];
    }
  }
  
  // Combine question and answer for better LLM context
  const fullQuizText = answerText 
    ? `${item.question}\n答案：${answerText}`
    : item.question;
  
  const response = await apiFetch('/knowledge-points/match', {
    method: 'POST',
    body: JSON.stringify({
      quizText: fullQuizText,
      maxMatches: 3,
      targetHints,
    }),
  });
  
  const data = await response.json();
  return data;
};

// Get hierarchy options for knowledge points
export const getKnowledgePointHierarchy = async (filters?: {
  volume?: string;
  unit?: string;
  lesson?: string;
}): Promise<{
  volumes: string[];
  units: string[];
  lessons: string[];
  subs: string[];
}> => {
  const params = new URLSearchParams();
  if (filters?.volume) params.append('volume', filters.volume);
  if (filters?.unit) params.append('unit', filters.unit);
  if (filters?.lesson) params.append('lesson', filters.lesson);
  
  const response = await apiFetch(`/knowledge-points/hierarchy-options?${params.toString()}`);
  const data = await response.json();
  return data;
};

// Search knowledge points
export const searchKnowledgePoints = async (
  query?: string,
  limit?: number
): Promise<{
  knowledgePoints: KnowledgePoint[];
  total: number;
}> => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (limit) params.append('limit', limit.toString());
  
  const response = await apiFetch(`/knowledge-points/search?${params.toString()}`, {
    method: 'GET',
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
  // Transform quizzes to include keywords as tags and knowledge point ID
  const quizzesWithTags = quizzes.map(quiz => ({
    ...quiz,
    // Include keywords from matching result as tags
    tags: quiz.matchingResult?.keywords || [],
    // Ensure knowledge point ID is properly set
    knowledgePointId: quiz.knowledgePoint?.id,
    knowledgePoint: quiz.knowledgePoint,
  }));

  const response = await apiFetch('/quiz/submit-multiple', {
    method: 'POST',
    body: JSON.stringify({ quizzes: quizzesWithTags }),
  });
  
  const data = await response.json();
  return data;
};