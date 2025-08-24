// Subject configuration type definitions
// Shared between frontend and backend

export interface SubjectConfig {
  id: string;
  name: string;
  description: string;
  icon: string;      // Icon component name (e.g., 'Scroll', 'Dna')
  emoji: string;     // Emoji character for display
  color: string;     // Tailwind CSS color class
  enabled: boolean;  // Whether subject is currently available
  order: number;     // Display order
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