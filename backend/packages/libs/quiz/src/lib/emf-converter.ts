/**
 * EMF/WMF Image Converter Utility
 * 
 * Enhanced Metafile (EMF) and Windows Metafile (WMF) are vector graphics formats
 * used primarily in Windows applications. Since browsers cannot display these formats
 * natively, we need to convert them to standard web formats.
 * 
 * Note: Actual conversion requires external tools like ImageMagick or LibreOffice.
 * This is a placeholder for future implementation.
 */

import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class EmfConverter {
  private readonly logger = new Logger(EmfConverter.name);

  /**
   * Check if EMF/WMF conversion is available
   */
  async isConversionAvailable(): Promise<boolean> {
    try {
      // Check if ImageMagick is installed
      const { stdout } = await execAsync('convert -version');
      return stdout.includes('ImageMagick');
    } catch {
      // Check if LibreOffice is installed
      try {
        const { stdout } = await execAsync('libreoffice --version');
        return stdout.includes('LibreOffice');
      } catch {
        return false;
      }
    }
  }

  /**
   * Convert EMF/WMF to PNG using ImageMagick (if available)
   */
  async convertToPng(inputPath: string, outputPath: string): Promise<boolean> {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Try ImageMagick first
      try {
        await execAsync(`convert "${inputPath}" "${outputPath}"`);
        this.logger.log(`Converted EMF/WMF to PNG: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
        return true;
      } catch (error) {
        this.logger.debug('ImageMagick conversion failed, trying LibreOffice...');
      }

      // Try LibreOffice as fallback
      try {
        const tempDir = path.dirname(outputPath);
        await execAsync(`libreoffice --headless --convert-to png --outdir "${tempDir}" "${inputPath}"`);
        
        // LibreOffice outputs with original filename but .png extension
        const expectedOutput = path.join(tempDir, path.basename(inputPath, path.extname(inputPath)) + '.png');
        if (fs.existsSync(expectedOutput) && expectedOutput !== outputPath) {
          fs.renameSync(expectedOutput, outputPath);
        }
        
        this.logger.log(`Converted EMF/WMF to PNG using LibreOffice: ${path.basename(inputPath)}`);
        return true;
      } catch (error) {
        this.logger.error('LibreOffice conversion also failed:', error);
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to convert EMF/WMF file: ${inputPath}`, error);
      return false;
    }
  }

  /**
   * Create a placeholder image for EMF/WMF files that couldn't be converted
   */
  createPlaceholder(filename: string): Buffer {
    // Create a simple SVG placeholder
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
        <text x="100" y="90" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
          EMF/WMF Image
        </text>
        <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">
          ${filename}
        </text>
        <text x="100" y="130" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">
          (Cannot display in browser)
        </text>
      </svg>
    `;
    
    return Buffer.from(svg);
  }
}

/**
 * Installation instructions for EMF/WMF conversion support:
 * 
 * Ubuntu/Debian:
 *   sudo apt-get install imagemagick
 *   # or
 *   sudo apt-get install libreoffice
 * 
 * Alpine (Docker):
 *   apk add imagemagick
 *   # or
 *   apk add libreoffice
 * 
 * macOS:
 *   brew install imagemagick
 *   # or
 *   brew install libreoffice
 */