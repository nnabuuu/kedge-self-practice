import { Injectable } from '@nestjs/common';
import { KnowledgePoint } from '@kedge/models';

@Injectable()
export class KnowledgePointService {
  private knowledgePoints: Map<string, KnowledgePoint> = new Map();

  constructor() {
    // Initialize with mock data matching frontend-practice
    this.seedDefaultKnowledgePoints();
  }

  private seedDefaultKnowledgePoints() {
    const historyKnowledgePoints: KnowledgePoint[] = [
      // First lesson of history
      {
        id: 'HIST-1-1-1',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第1课 中华文明的起源与早期国家',
        section: '第一子目 石器时代的古人类和文化遗存',
        topic: '旧石器时代与新石器文明'
      },
      {
        id: 'HIST-1-1-1-2',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第1课 中华文明的起源与早期国家',
        section: '第一子目 石器时代的古人类和文化遗存',
        topic: '中华文明起源的考古学证据'
      },
      {
        id: 'HIST-1-1-2-1',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第1课 中华文明的起源与早期国家',
        section: '第二子目 夏商周的政治制度',
        topic: '夏朝的建立与政治制度'
      },
      {
        id: 'HIST-1-1-2-2',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第1课 中华文明的起源与早期国家',
        section: '第二子目 夏商周的政治制度',
        topic: '商朝的政治制度与甲骨文'
      },
      {
        id: 'HIST-1-1-2-3',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第1课 中华文明的起源与早期国家',
        section: '第二子目 夏商周的政治制度',
        topic: '西周的分封制与宗法制'
      },
      // Second lesson
      {
        id: 'HIST-1-2-1-1',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第2课 诸侯纷争与变法运动',
        section: '第一子目 春秋战国的政治格局',
        topic: '春秋五霸与政治变革'
      },
      {
        id: 'HIST-1-2-1-2',
        subjectId: 'history',
        volume: '中外历史纲要上',
        unit: '第一单元 从中华文明起源到秦汉统一多民族封建国家的建立与巩固',
        lesson: '第2课 诸侯纷争与变法运动',
        section: '第一子目 春秋战国的政治格局',
        topic: '战国七雄与兼并战争'
      }
    ];

    const biologyKnowledgePoints: KnowledgePoint[] = [
      {
        id: 'BIO-1-1-1',
        subjectId: 'biology',
        volume: '生物学必修1 分子与细胞',
        unit: '第一章 走近细胞',
        lesson: '第1节 细胞是生命活动的基本单位',
        section: '第一子目 细胞的发现',
        topic: '细胞的发现及细胞学说的建立'
      },
      {
        id: 'BIO-1-1-2',
        subjectId: 'biology',
        volume: '生物学必修1 分子与细胞',
        unit: '第一章 走近细胞',
        lesson: '第2节 细胞的多样性和统一性',
        section: '第一子目 细胞的基本结构',
        topic: '原核细胞和真核细胞的结构特点'
      },
      {
        id: 'BIO-1-2-1',
        subjectId: 'biology',
        volume: '生物学必修1 分子与细胞',
        unit: '第二章 组成细胞的分子',
        lesson: '第1节 细胞中的元素和化合物',
        section: '第一子目 细胞中的元素',
        topic: '组成细胞的主要元素和化合物'
      },
      {
        id: 'BIO-1-2-2',
        subjectId: 'biology',
        volume: '生物学必修1 分子与细胞',
        unit: '第二章 组成细胞的分子',
        lesson: '第2节 生命活动的主要承担者——蛋白质',
        section: '第一子目 蛋白质的结构',
        topic: '蛋白质的结构和功能'
      }
    ];

    // Add all knowledge points to the map
    [...historyKnowledgePoints, ...biologyKnowledgePoints].forEach(kp => {
      this.knowledgePoints.set(kp.id, kp);
    });
  }

  async findAll(): Promise<KnowledgePoint[]> {
    return Array.from(this.knowledgePoints.values());
  }

  async findBySubject(subjectId: string): Promise<KnowledgePoint[]> {
    return Array.from(this.knowledgePoints.values())
      .filter(kp => kp.subjectId === subjectId);
  }

  async findById(id: string): Promise<KnowledgePoint | null> {
    return this.knowledgePoints.get(id) || null;
  }

  async findByIds(ids: string[]): Promise<KnowledgePoint[]> {
    return ids.map(id => this.knowledgePoints.get(id))
      .filter((kp): kp is KnowledgePoint => kp !== undefined);
  }

  // Get hierarchical structure for a subject
  async getHierarchyBySubject(subjectId: string): Promise<any> {
    const knowledgePoints = await this.findBySubject(subjectId);
    
    const hierarchy: any = {};
    
    knowledgePoints.forEach(kp => {
      if (!hierarchy[kp.volume]) {
        hierarchy[kp.volume] = { units: {} };
      }
      
      if (!hierarchy[kp.volume].units[kp.unit]) {
        hierarchy[kp.volume].units[kp.unit] = { lessons: {} };
      }
      
      if (!hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson]) {
        hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson] = { 
          sections: {},
          topics: []
        };
      }
      
      if (!hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].sections[kp.section]) {
        hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].sections[kp.section] = {
          topics: []
        };
      }
      
      hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].sections[kp.section].topics.push({
        id: kp.id,
        topic: kp.topic
      });
      
      // Also add to lesson level for easier access
      hierarchy[kp.volume].units[kp.unit].lessons[kp.lesson].topics.push({
        id: kp.id,
        topic: kp.topic,
        section: kp.section
      });
    });
    
    return hierarchy;
  }

  // Search knowledge points
  async search(query: string, subjectId?: string): Promise<KnowledgePoint[]> {
    let points = Array.from(this.knowledgePoints.values());
    
    if (subjectId) {
      points = points.filter(kp => kp.subjectId === subjectId);
    }
    
    if (!query.trim()) {
      return points;
    }
    
    const searchTerm = query.toLowerCase();
    return points.filter(kp => 
      kp.topic.toLowerCase().includes(searchTerm) ||
      kp.lesson.toLowerCase().includes(searchTerm) ||
      kp.unit.toLowerCase().includes(searchTerm) ||
      kp.volume.toLowerCase().includes(searchTerm)
    );
  }

  // Get knowledge points by lesson
  async findByLesson(subjectId: string, volume: string, unit: string, lesson: string): Promise<KnowledgePoint[]> {
    return Array.from(this.knowledgePoints.values()).filter(kp =>
      kp.subjectId === subjectId &&
      kp.volume === volume &&
      kp.unit === unit &&
      kp.lesson === lesson
    );
  }

  // Get knowledge points by unit
  async findByUnit(subjectId: string, volume: string, unit: string): Promise<KnowledgePoint[]> {
    return Array.from(this.knowledgePoints.values()).filter(kp =>
      kp.subjectId === subjectId &&
      kp.volume === volume &&
      kp.unit === unit
    );
  }

  // Get knowledge points by volume
  async findByVolume(subjectId: string, volume: string): Promise<KnowledgePoint[]> {
    return Array.from(this.knowledgePoints.values()).filter(kp =>
      kp.subjectId === subjectId &&
      kp.volume === volume
    );
  }
}