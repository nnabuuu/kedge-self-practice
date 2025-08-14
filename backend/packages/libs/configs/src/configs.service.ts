import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigsService {
  get(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }

  getOptional(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }
}