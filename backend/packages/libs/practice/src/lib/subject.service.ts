import { Injectable } from '@nestjs/common';
import { 
  Subject, 
  CreateSubjectRequest, 
  UpdateSubjectRequest,
  SubjectSchema,
  CreateSubjectSchema,
  UpdateSubjectSchema
} from '@kedge/models';
import { z } from 'zod';

@Injectable()
export class SubjectService {
  private subjects: Map<string, Subject> = new Map();

  constructor() {
    // Initialize with default subjects
    this.seedDefaultSubjects();
  }

  private seedDefaultSubjects() {
    const defaultSubjects = [
      {
        id: 'history',
        name: '历史',
        icon: 'Scroll',
        color: '#f59e0b',
        description: '中国历史与世界历史',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'biology',
        name: '生物',
        icon: 'Dna',
        color: '#10b981',
        description: '生物学基础知识',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'physics',
        name: '物理',
        icon: 'Atom',
        color: '#3b82f6',
        description: '物理学基础概念与原理',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'chemistry',
        name: '化学',
        icon: 'FlaskConical',
        color: '#8b5cf6',
        description: '化学基础知识与实验',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultSubjects.forEach(subject => {
      this.subjects.set(subject.id, subject);
    });
  }

  async findAll(includeInactive = false): Promise<Subject[]> {
    const allSubjects = Array.from(this.subjects.values());
    
    if (includeInactive) {
      return allSubjects;
    }
    
    return allSubjects.filter(subject => subject.isActive);
  }

  async findById(id: string): Promise<Subject | null> {
    const subject = this.subjects.get(id);
    return subject || null;
  }

  async create(createSubjectDto: CreateSubjectRequest): Promise<Subject> {
    // Validate input
    const validatedData = CreateSubjectSchema.parse(createSubjectDto);
    
    // Generate unique ID if not provided
    const id = validatedData.id || this.generateId();
    
    // Check if ID already exists
    if (this.subjects.has(id)) {
      throw new Error(`Subject with ID ${id} already exists`);
    }

    const now = new Date();
    const subject: Subject = {
      ...validatedData,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Validate complete subject
    SubjectSchema.parse(subject);
    
    this.subjects.set(id, subject);
    return subject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectRequest): Promise<Subject | null> {
    const existingSubject = this.subjects.get(id);
    if (!existingSubject) {
      return null;
    }

    // Validate input
    const validatedData = UpdateSubjectSchema.parse(updateSubjectDto);
    
    const updatedSubject: Subject = {
      ...existingSubject,
      ...validatedData,
      updatedAt: new Date()
    };

    // Validate complete subject
    SubjectSchema.parse(updatedSubject);
    
    this.subjects.set(id, updatedSubject);
    return updatedSubject;
  }

  async delete(id: string): Promise<boolean> {
    return this.subjects.delete(id);
  }

  async deactivate(id: string): Promise<Subject | null> {
    const subject = this.subjects.get(id);
    if (!subject) {
      return null;
    }

    const deactivatedSubject = {
      ...subject,
      isActive: false,
      updatedAt: new Date()
    };

    this.subjects.set(id, deactivatedSubject);
    return deactivatedSubject;
  }

  async activate(id: string): Promise<Subject | null> {
    const subject = this.subjects.get(id);
    if (!subject) {
      return null;
    }

    const activatedSubject = {
      ...subject,
      isActive: true,
      updatedAt: new Date()
    };

    this.subjects.set(id, activatedSubject);
    return activatedSubject;
  }

  private generateId(): string {
    return `subject_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get statistics for a subject
  async getSubjectStats(id: string): Promise<{
    totalKnowledgePoints: number;
    totalQuestions: number;
    lastPracticed?: Date;
  } | null> {
    const subject = this.subjects.get(id);
    if (!subject) {
      return null;
    }

    // TODO: Implement stats calculation with knowledge point and question services
    return {
      totalKnowledgePoints: 0,
      totalQuestions: 0
    };
  }

  // Search subjects by name or description
  async search(query: string): Promise<Subject[]> {
    if (!query.trim()) {
      return this.findAll();
    }

    const searchTerm = query.toLowerCase();
    const allSubjects = Array.from(this.subjects.values());
    
    return allSubjects.filter(subject => 
      subject.isActive && (
        subject.name.toLowerCase().includes(searchTerm) ||
        (subject.description?.toLowerCase().includes(searchTerm))
      )
    );
  }
}