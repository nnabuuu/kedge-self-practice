// Subject configuration type definitions
// Shared between frontend and backend

export interface SubjectMetadata {
  curriculum: string;
  totalKnowledgePoints: number;
  totalQuizzes: number;
}

export interface SubjectConfig {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  emoji: string;
  color: string;
  enabled: boolean;
  order: number;
  grades: string[];
  metadata: SubjectMetadata;
}

export interface SubjectsConfiguration {
  subjects: SubjectConfig[];
  version: string;
  lastUpdated: string;
  description: string;
}

// Helper function to load subjects from JSON
export function loadSubjectsConfig(): SubjectsConfiguration {
  // In frontend: import subjects from './subjects.json'
  // In backend: use fs.readFileSync
  return require('./subjects.json') as SubjectsConfiguration;
}

// Helper to get only enabled subjects
export function getEnabledSubjects(config: SubjectsConfiguration): SubjectConfig[] {
  return config.subjects
    .filter(subject => subject.enabled)
    .sort((a, b) => a.order - b.order);
}

// Helper to find subject by ID
export function findSubjectById(config: SubjectsConfiguration, id: string): SubjectConfig | undefined {
  return config.subjects.find(subject => subject.id === id);
}

// Helper to get subject IDs
export function getSubjectIds(config: SubjectsConfiguration, enabledOnly = true): string[] {
  const subjects = enabledOnly ? getEnabledSubjects(config) : config.subjects;
  return subjects.map(subject => subject.id);
}