/**
 * Image Converter Service
 * Main service that manages multiple converters and handles conversion requests
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IImageConverter, ConversionOptions, ConversionResult } from './image-converter.interface';
import { ImageMagickConverter } from './imagemagick-converter';
import { SharpConverter } from './sharp-converter';
import * as path from 'path';

@Injectable()
export class ImageConverterService implements OnModuleInit {
  private readonly logger = new Logger(ImageConverterService.name);
  private readonly converters: IImageConverter[] = [];
  private readonly formatToConverterMap = new Map<string, IImageConverter>();
  
  constructor() {
    // Register converters in priority order
    this.converters.push(
      new SharpConverter(),        // Fast, for common formats
      new ImageMagickConverter(),  // Comprehensive, for special formats
    );
  }
  
  async onModuleInit() {
    await this.initializeConverters();
  }
  
  /**
   * Initialize converters and build format mapping
   */
  private async initializeConverters() {
    this.logger.log('Initializing image converters...');
    
    for (const converter of this.converters) {
      const isAvailable = await converter.isAvailable();
      
      if (isAvailable) {
        this.logger.log(`✅ ${converter.getName()} converter is available`);
        
        // Map formats to converters (first available converter wins)
        for (const format of converter.getSupportedFormats()) {
          if (!this.formatToConverterMap.has(format)) {
            this.formatToConverterMap.set(format, converter);
          }
        }
      } else {
        this.logger.warn(`❌ ${converter.getName()} converter is not available`);
      }
    }
    
    this.logger.log(`Supported formats: ${Array.from(this.formatToConverterMap.keys()).join(', ')}`);
  }
  
  /**
   * Check if a format can be converted
   */
  canConvert(format: string): boolean {
    const normalizedFormat = this.normalizeFormat(format);
    return this.formatToConverterMap.has(normalizedFormat);
  }
  
  /**
   * Get the appropriate converter for a format
   */
  getConverter(format: string): IImageConverter | null {
    const normalizedFormat = this.normalizeFormat(format);
    return this.formatToConverterMap.get(normalizedFormat) || null;
  }
  
  /**
   * Convert an image from buffer
   */
  async convertFromBuffer(
    buffer: Buffer,
    sourceFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const converter = this.getConverter(sourceFormat);
    
    if (!converter) {
      this.logger.warn(`No converter available for format: ${sourceFormat}`);
      return {
        success: false,
        outputFormat: options.format || 'png',
        error: `Unsupported format: ${sourceFormat}`
      };
    }
    
    this.logger.debug(`Converting ${sourceFormat} using ${converter.getName()}`);
    
    try {
      const result = await converter.convertFromBuffer(buffer, sourceFormat, options);
      
      if (result.success) {
        this.logger.log(
          `Successfully converted ${sourceFormat} to ${result.outputFormat} ` +
          `(${result.metadata?.width}x${result.metadata?.height}, ${this.formatBytes(result.metadata?.size || 0)})`
        );
      } else {
        this.logger.error(`Conversion failed: ${result.error}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Unexpected conversion error:`, error);
      return {
        success: false,
        outputFormat: options.format || 'png',
        error: `Conversion error: ${error.message}`
      };
    }
  }
  
  /**
   * Convert an image from file path
   */
  async convertFromFile(
    filePath: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const ext = path.extname(filePath).toLowerCase();
    const converter = this.getConverter(ext);
    
    if (!converter) {
      this.logger.warn(`No converter available for file: ${filePath}`);
      return {
        success: false,
        outputFormat: options.format || 'png',
        error: `Unsupported format: ${ext}`
      };
    }
    
    return converter.convertFromFile(filePath, options);
  }
  
  /**
   * Convert EMF/WMF specifically (convenience method)
   */
  async convertEmfWmf(
    buffer: Buffer,
    sourceFormat: 'emf' | 'wmf',
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    // Set default options optimized for EMF/WMF
    const emfOptions: ConversionOptions = {
      format: 'png',
      background: 'white',  // EMF/WMF often have transparency issues
      quality: 95,
      ...options
    };
    
    return this.convertFromBuffer(buffer, sourceFormat, emfOptions);
  }
  
  /**
   * Get list of supported formats
   */
  getSupportedFormats(): string[] {
    return Array.from(this.formatToConverterMap.keys());
  }
  
  /**
   * Check if EMF/WMF conversion is available
   */
  async canConvertEmf(): Promise<boolean> {
    const emfConverter = this.getConverter('emf');
    if (!emfConverter) return false;
    return emfConverter.isAvailable();
  }
  
  /**
   * Normalize format string
   */
  private normalizeFormat(format: string): string {
    return format.toLowerCase().replace(/^\./, '').replace(/^image\//, '');
  }
  
  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}