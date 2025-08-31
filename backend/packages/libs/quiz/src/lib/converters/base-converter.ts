/**
 * Base Image Converter
 * Abstract base class for all image converters
 */

import { Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { ConversionOptions, ConversionResult, IImageConverter } from './image-converter.interface';

export abstract class BaseImageConverter implements IImageConverter {
  protected readonly logger: Logger;
  protected readonly supportedFormats: string[];
  
  constructor(
    protected readonly name: string,
    supportedFormats: string[]
  ) {
    this.logger = new Logger(this.constructor.name);
    this.supportedFormats = supportedFormats.map(f => f.toLowerCase());
  }
  
  getName(): string {
    return this.name;
  }
  
  getSupportedFormats(): string[] {
    return [...this.supportedFormats];
  }
  
  canConvert(format: string): boolean {
    const normalizedFormat = this.normalizeFormat(format);
    return this.supportedFormats.includes(normalizedFormat);
  }
  
  async convertFromFile(
    filePath: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          outputFormat: options?.format || 'png',
          error: `File not found: ${filePath}`
        };
      }
      
      const buffer = await fs.promises.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      return this.convertFromBuffer(buffer, ext, options);
    } catch (error) {
      this.logger.error(`Failed to convert file ${filePath}:`, error);
      return {
        success: false,
        outputFormat: options?.format || 'png',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  abstract convertFromBuffer(
    buffer: Buffer,
    sourceFormat: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>;
  
  abstract isAvailable(): Promise<boolean>;
  
  /**
   * Normalize format string (remove dots, lowercase)
   */
  protected normalizeFormat(format: string): string {
    return format.toLowerCase().replace(/^\./, '').replace(/^image\//, '');
  }
  
  /**
   * Get MIME type from format
   */
  protected getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'emf': 'image/x-emf',
      'wmf': 'image/x-wmf',
    };
    
    return mimeTypes[this.normalizeFormat(format)] || 'application/octet-stream';
  }
}