// Subject configuration loader for frontend
import subjectsConfigJson from '../../../shared-config/subjects.json';
import type { SubjectsConfiguration, SubjectConfig } from '../../../shared-config/subjects.types';
import { Subject } from '../types/quiz';

// Load the configuration
const subjectsConfig = subjectsConfigJson as SubjectsConfiguration;

// Convert SubjectConfig to frontend Subject type
function configToSubject(config: SubjectConfig): Subject {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    icon: config.emoji, // Use emoji for now, can switch to icon component later
    color: config.color
  };
}

// Get enabled subjects for frontend use
export function getEnabledSubjects(): Subject[] {
  return subjectsConfig.subjects
    .filter(subject => subject.enabled)
    .sort((a, b) => a.order - b.order)
    .map(configToSubject);
}

// Get all subjects (including disabled ones for admin)
export function getAllSubjects(): Subject[] {
  return subjectsConfig.subjects
    .sort((a, b) => a.order - b.order)
    .map(configToSubject);
}

// Find subject by ID
export function findSubjectById(id: string): Subject | undefined {
  const config = subjectsConfig.subjects.find(s => s.id === id);
  return config ? configToSubject(config) : undefined;
}

// Get subject configuration metadata
export function getSubjectMetadata(id: string): SubjectConfig['metadata'] | undefined {
  const config = subjectsConfig.subjects.find(s => s.id === id);
  return config?.metadata;
}

// Check if a subject is enabled
export function isSubjectEnabled(id: string): boolean {
  const config = subjectsConfig.subjects.find(s => s.id === id);
  return config?.enabled ?? false;
}

// Get grades for a subject
export function getSubjectGrades(id: string): string[] {
  const config = subjectsConfig.subjects.find(s => s.id === id);
  return config?.grades ?? [];
}

// Export the raw configuration if needed
export { subjectsConfig };

// Default export for convenience
export default {
  getEnabledSubjects,
  getAllSubjects,
  findSubjectById,
  getSubjectMetadata,
  isSubjectEnabled,
  getSubjectGrades,
  config: subjectsConfig
};