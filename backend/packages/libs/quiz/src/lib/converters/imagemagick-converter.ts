/**
 * ImageMagick Converter
 * Handles EMF, WMF and other formats using ImageMagick command-line tool
 */

import { BaseImageConverter } from './base-converter';
import { ConversionOptions, ConversionResult } from './image-converter.interface';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuid } from 'uuid';

const execAsync = promisify(exec);

export class ImageMagickConverter extends BaseImageConverter {
  constructor() {
    super('ImageMagick', [
      'emf',
      'wmf',
      'eps',
      'ps',
      'pdf',
      'psd',
      'xcf',
      'svg',
      'tiff',
      'tif',
      'bmp',
      'pcx',
      'dcm',  // DICOM medical images
      'dng',  // Digital Negative
      'cr2',  // Canon RAW
      'nef',  // Nikon RAW
      'arw',  // Sony RAW
    ]);
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('convert -version');
      const isAvailable = stdout.includes('ImageMagick');
      if (isAvailable) {
        this.logger.log('ImageMagick is available');
        // Log version for debugging
        const versionMatch = stdout.match(/Version: ImageMagick ([\d.]+)/);
        if (versionMatch) {
          this.logger.log(`ImageMagick version: ${versionMatch[1]}`);
        }
      }
      return isAvailable;
    } catch (error) {
      this.logger.warn('ImageMagick is not available:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  async convertFromBuffer(
    buffer: Buffer,
    sourceFormat: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'img-convert-'));
    const inputPath = path.join(tempDir, `input.${this.normalizeFormat(sourceFormat)}`);
    const outputFormat = options.format || 'png';
    const outputPath = path.join(tempDir, `output.${outputFormat}`);
    
    try {
      // Write input buffer to temp file
      await fs.promises.writeFile(inputPath, buffer);
      
      // Build ImageMagick command
      const args: string[] = [];
      
      // Input file
      args.push(`"${inputPath}"`);
      
      // Background for transparent images (important for EMF/WMF)
      if (options.background) {
        args.push('-background', options.background);
        args.push('-flatten');
      } else if (['emf', 'wmf'].includes(this.normalizeFormat(sourceFormat))) {
        // Default white background for EMF/WMF
        args.push('-background', 'white');
        args.push('-flatten');
      }
      
      // Resize options
      if (options.width || options.height) {
        let resizeArg = '';
        if (options.width && options.height) {
          resizeArg = `${options.width}x${options.height}`;
          if (!options.maintainAspectRatio) {
            resizeArg += '!';  // Force exact dimensions
          }
        } else if (options.width) {
          resizeArg = `${options.width}x`;
        } else {
          resizeArg = `x${options.height}`;
        }
        args.push('-resize', resizeArg);
      }
      
      // Quality for lossy formats
      if (options.quality && ['jpeg', 'jpg', 'webp'].includes(outputFormat)) {
        args.push('-quality', `${options.quality}`);
      }
      
      // Density for vector formats (improves quality)
      if (['emf', 'wmf', 'svg', 'eps', 'ps', 'pdf'].includes(this.normalizeFormat(sourceFormat))) {
        args.push('-density', '150');  // DPI for rasterization
      }
      
      // Output file
      args.push(`"${outputPath}"`);
      
      // Execute conversion
      const command = `convert ${args.join(' ')}`;
      this.logger.debug(`Executing: ${command}`);
      
      const { stderr } = await execAsync(command);
      if (stderr && !stderr.includes('Warning')) {
        this.logger.warn(`ImageMagick warnings: ${stderr}`);
      }
      
      // Read output file
      const outputBuffer = await fs.promises.readFile(outputPath);
      const stats = await fs.promises.stat(outputPath);
      
      // Get image dimensions using identify command
      let metadata: any = {
        size: stats.size,
        originalFormat: sourceFormat
      };
      
      try {
        const { stdout: identifyOutput } = await execAsync(`identify -format "%wx%h" "${outputPath}"`);
        const [width, height] = identifyOutput.split('x').map(Number);
        metadata.width = width;
        metadata.height = height;
      } catch (error) {
        this.logger.debug('Could not get image dimensions:', error instanceof Error ? error.message : String(error));
      }
      
      return {
        success: true,
        outputBuffer,
        outputFormat,
        metadata
      };
      
    } catch (error) {
      this.logger.error(`ImageMagick conversion failed:`, error);
      return {
        success: false,
        outputFormat,
        error: `ImageMagick conversion failed: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      // Cleanup temp files
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        this.logger.debug('Failed to cleanup temp directory:', error instanceof Error ? error.message : String(error));
      }
    }
  }
}