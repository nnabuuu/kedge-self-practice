// Subject configuration loader for backend
import * as fs from 'fs';
import * as path from 'path';

export interface SubjectConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  color: string;
  enabled: boolean;
  order: number;
}

export interface SubjectsConfiguration {
  subjects: SubjectConfig[];
  version: string;
  lastUpdated: string;
  description: string;
}

export class SubjectsConfigService {
  private config: SubjectsConfiguration | null = null;
  private configPath: string | null = null;

  constructor() {
    // Try multiple paths to find the config file
    const possiblePaths = [
      path.join(process.cwd(), '../../shared-config/subjects.json'),
      path.join(process.cwd(), '../shared-config/subjects.json'),
      path.join(process.cwd(), 'shared-config/subjects.json'),
      path.join(__dirname, '../../../../../shared-config/subjects.json'),
      path.join(__dirname, '../../../../../../shared-config/subjects.json'),
    ];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        this.configPath = configPath;
        break;
      }
    }

    if (!this.configPath) {
      console.warn('Subjects configuration file not found, using defaults');
      // Use default configuration if file not found
      this.config = this.getDefaultConfig();
    }
  }

  private loadConfig(): SubjectsConfiguration {
    if (this.config) {
      return this.config;
    }

    try {
      if (this.configPath) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(configData) as SubjectsConfiguration;
      } else {
        this.config = this.getDefaultConfig();
      }
    } catch (error) {
      console.error('Failed to load subjects configuration:', error);
      this.config = this.getDefaultConfig();
    }

    return this.config;
  }

  private getDefaultConfig(): SubjectsConfiguration {
    return {
      subjects: [
        {
          id: 'history',
          name: '历史',
          description: '初中历史知识点练习',
          icon: 'Scroll',
          emoji: '📚',
          color: 'bg-amber-500',
          enabled: true,
          order: 1
        },
        {
          id: 'biology',
          name: '生物',
          description: '初中生物学习与实验',
          icon: 'Dna',
          emoji: '🧬',
          color: 'bg-green-500',
          enabled: true,
          order: 2
        }
      ],
      version: '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: 'Default subject configuration'
    };
  }

  // Get all subjects
  getAllSubjects(): SubjectConfig[] {
    const config = this.loadConfig();
    return config.subjects.sort((a, b) => a.order - b.order);
  }

  // Get only enabled subjects
  getEnabledSubjects(): SubjectConfig[] {
    const config = this.loadConfig();
    return config.subjects
      .filter(subject => subject.enabled)
      .sort((a, b) => a.order - b.order);
  }

  // Find subject by ID
  findSubjectById(id: string): SubjectConfig | undefined {
    const config = this.loadConfig();
    return config.subjects.find(subject => subject.id === id);
  }

  // Check if subject exists and is enabled
  isSubjectEnabled(id: string): boolean {
    const subject = this.findSubjectById(id);
    return subject?.enabled ?? false;
  }

  // Get subject IDs
  getSubjectIds(enabledOnly = true): string[] {
    const subjects = enabledOnly ? this.getEnabledSubjects() : this.getAllSubjects();
    return subjects.map(subject => subject.id);
  }


  // Reload configuration from file
  reloadConfig(): void {
    this.config = null;
    this.loadConfig();
  }
}

// Singleton instance
export const subjectsConfigService = new SubjectsConfigService();