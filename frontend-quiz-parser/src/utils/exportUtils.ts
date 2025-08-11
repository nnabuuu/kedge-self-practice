import * as XLSX from 'xlsx';
import { QuizWithKnowledgePoint } from '../types/quiz';

export const exportToExcel = (quizWithKnowledgePoints: QuizWithKnowledgePoint[]) => {
  // Prepare data for Excel export
  const excelData = quizWithKnowledgePoints.map((item, index) => {
    // Format options
    let optionsText = '';
    if (item.options && item.options.length > 0) {
      optionsText = item.options.map((option, idx) => 
        `${String.fromCharCode(65 + idx)}. ${option}`
      ).join('\n');
    }

    // Format answer
    let answerText = '';
    if (item.type === 'single-choice' || item.type === 'multiple-choice') {
      // For choice questions, convert answer to letter format
      let correctAnswerIndices: number[] = [];
      
      if (Array.isArray(item.answer)) {
        if (typeof item.answer[0] === 'number') {
          correctAnswerIndices = item.answer as number[];
        } else {
          // If answer is array of strings, find their indices in options
          correctAnswerIndices = (item.answer as string[]).map(ans => 
            item.options?.findIndex(opt => opt === ans) ?? -1
          ).filter(idx => idx !== -1);
        }
      } else if (typeof item.answer === 'number') {
        correctAnswerIndices = [item.answer];
      } else if (typeof item.answer === 'string' && item.options) {
        const answerIndex = item.options.findIndex(opt => opt === item.answer);
        if (answerIndex !== -1) {
          correctAnswerIndices = [answerIndex];
        }
      }
      
      answerText = correctAnswerIndices.map(idx => String.fromCharCode(65 + idx)).join(', ');
    } else {
      // For other question types, use the answer as is
      answerText = typeof item.answer === 'string' ? item.answer : 
                   Array.isArray(item.answer) ? item.answer.join(', ') : 
                   String(item.answer);
    }

    // Format knowledge point
    const knowledgePointTopic = item.knowledgePoint?.topic || '未匹配';
    
    // Format full knowledge point information
    let knowledgePointFull = '未匹配';
    if (item.knowledgePoint) {
      knowledgePointFull = `分册: ${item.knowledgePoint.volume} | 单元: ${item.knowledgePoint.unit} | 课程: ${item.knowledgePoint.lesson} | 子目: ${item.knowledgePoint.sub} | 知识点: ${item.knowledgePoint.topic}`;
    }

    return {
      '序号': index + 1,
      '题干': item.question,
      '选项': optionsText,
      '答案': answerText,
      '题型': getQuestionTypeLabel(item.type),
      '知识点': knowledgePointTopic,
      '知识点全部信息': knowledgePointFull
    };
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 6 },   // 序号
    { wch: 50 },  // 题干
    { wch: 40 },  // 选项
    { wch: 30 },  // 答案
    { wch: 10 },  // 题型
    { wch: 30 },  // 知识点
    { wch: 60 }   // 知识点全部信息
  ];
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, '题目导出');

  // Generate filename with timestamp
  const now = new Date();
  const timestamp = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(/[/:]/g, '-').replace(/\s/g, '_');
  
  const filename = `导出时间_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};

const getQuestionTypeLabel = (type: string): string => {
  switch (type) {
    case 'single-choice':
      return '单选题';
    case 'multiple-choice':
      return '多选题';
    case 'fill-in-the-blank':
      return '填空题';
    case 'subjective':
      return '主观题';
    case 'other':
      return '其他题型';
    default:
      return '未知题型';
  }
};