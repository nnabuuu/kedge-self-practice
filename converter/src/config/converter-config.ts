/**
 * Configuration management for converter
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export interface ConverterConfig {
  // Conversion settings
  conversion: {
    quality: number;
    dpi: number;
    background: string;
    keepOriginal: boolean;
    createPlaceholders: boolean;
  };
  
  // Performance settings
  performance: {
    parallel: number;
    maxFileSize: number; // MB
    timeout: number; // seconds
  };
  
  // Path settings
  paths: {
    outputDir: string;
    tempDir: string;
    reportsDir: string;
  };
  
  // Tool preferences
  tools: {
    preferredConverter: 'imagemagick' | 'libreoffice' | 'inkscape' | 'auto';
    fallbackToPlaceholder: boolean;
  };
  
  // Logging
  logging: {
    verbose: boolean;
    generateReport: boolean;
    reportFormat: 'json' | 'html' | 'csv';
  };
}

export const DEFAULT_CONFIG: ConverterConfig = {
  conversion: {
    quality: 95,
    dpi: 150,
    background: 'white',
    keepOriginal: false,
    createPlaceholders: true
  },
  performance: {
    parallel: 4,
    maxFileSize: 100,
    timeout: 30
  },
  paths: {
    outputDir: './output',
    tempDir: './temp',
    reportsDir: './output/reports'
  },
  tools: {
    preferredConverter: 'auto',
    fallbackToPlaceholder: true
  },
  logging: {
    verbose: false,
    generateReport: true,
    reportFormat: 'json'
  }
};

export class ConfigManager {
  private config: ConverterConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'converter.config.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): ConverterConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        console.log(chalk.gray(`Loading config from: ${this.configPath}`));
        const userConfig = fs.readJsonSync(this.configPath);
        return this.mergeConfig(DEFAULT_CONFIG, userConfig);
      }
    } catch (error) {
      console.warn(chalk.yellow('Failed to load config file, using defaults'));
    }
    
    return { ...DEFAULT_CONFIG };
  }

  private mergeConfig(defaults: any, userConfig: any): ConverterConfig {
    const merged = { ...defaults };
    
    for (const key in userConfig) {
      if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        merged[key] = this.mergeConfig(defaults[key] || {}, userConfig[key]);
      } else {
        merged[key] = userConfig[key];
      }
    }
    
    return merged;
  }

  async saveConfig(): Promise<void> {
    try {
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      console.log(chalk.green(`Config saved to: ${this.configPath}`));
    } catch (error) {
      console.error(chalk.red('Failed to save config:'), error);
    }
  }

  async createDefaultConfig(): Promise<void> {
    if (!await fs.pathExists(this.configPath)) {
      await fs.writeJson(this.configPath, DEFAULT_CONFIG, { spaces: 2 });
      console.log(chalk.green(`Created default config at: ${this.configPath}`));
    } else {
      console.log(chalk.yellow('Config file already exists'));
    }
  }

  get(): ConverterConfig {
    return this.config;
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    let current: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate quality
    if (this.config.conversion.quality < 1 || this.config.conversion.quality > 100) {
      errors.push('Quality must be between 1 and 100');
    }
    
    // Validate DPI
    if (this.config.conversion.dpi < 50 || this.config.conversion.dpi > 600) {
      errors.push('DPI must be between 50 and 600');
    }
    
    // Validate parallel
    if (this.config.performance.parallel < 1 || this.config.performance.parallel > 32) {
      errors.push('Parallel must be between 1 and 32');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}