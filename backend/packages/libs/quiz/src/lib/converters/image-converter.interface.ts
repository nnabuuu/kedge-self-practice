/**
 * Image Converter Interface
 * Defines the contract for all image converters
 */

export interface ConversionResult {
  success: boolean;
  outputBuffer?: Buffer;
  outputPath?: string;
  outputFormat: string;
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    size?: number;
    originalFormat?: string;
  };
}

export interface ConversionOptions {
  quality?: number;          // 0-100 for lossy formats
  width?: number;            // Target width
  height?: number;           // Target height
  maintainAspectRatio?: boolean;
  background?: string;       // Background color for transparent images
  format?: 'png' | 'jpeg' | 'webp';  // Target format
}

export interface IImageConverter {
  /**
   * Check if this converter can handle the given format
   */
  canConvert(format: string): boolean;
  
  /**
   * Get supported input formats
   */
  getSupportedFormats(): string[];
  
  /**
   * Convert image from buffer
   */
  convertFromBuffer(
    buffer: Buffer,
    sourceFormat: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>;
  
  /**
   * Convert image from file path
   */
  convertFromFile(
    filePath: string,
    options?: ConversionOptions
  ): Promise<ConversionResult>;
  
  /**
   * Get converter name/type
   */
  getName(): string;
  
  /**
   * Check if converter dependencies are available
   */
  isAvailable(): Promise<boolean>;
}