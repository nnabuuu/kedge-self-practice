/**
 * Image information utilities
 * Extract metadata and information from EMF/WMF files
 */

import * as fs from 'fs-extra';
import * as path from 'path';

export interface ImageInfo {
  format: string;
  width?: number;
  height?: number;
  fileSize: number;
  isVector: boolean;
  hasTransparency?: boolean;
}

export class ImageInfoExtractor {
  /**
   * Get image information from file
   */
  static async getImageInfo(filePath: string): Promise<ImageInfo> {
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase().substring(1);
    
    const info: ImageInfo = {
      format: ext,
      fileSize: stats.size,
      isVector: ['emf', 'wmf', 'svg'].includes(ext)
    };

    // Try to extract dimensions for EMF/WMF
    if (ext === 'emf' || ext === 'wmf') {
      const dimensions = await this.extractEmfWmfDimensions(filePath);
      if (dimensions) {
        info.width = dimensions.width;
        info.height = dimensions.height;
      }
    }

    return info;
  }

  /**
   * Extract dimensions from EMF/WMF header
   */
  private static async extractEmfWmfDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Check for EMF signature
      if (buffer.length > 4 && buffer.readUInt32LE(0) === 0x00000001) {
        // EMF file - read header
        if (buffer.length > 24) {
          // EMF header contains bounds rectangle at offset 8
          const left = buffer.readInt32LE(8);
          const top = buffer.readInt32LE(12);
          const right = buffer.readInt32LE(16);
          const bottom = buffer.readInt32LE(20);
          
          return {
            width: Math.abs(right - left),
            height: Math.abs(bottom - top)
          };
        }
      }
      
      // Check for WMF signature
      if (buffer.length > 18) {
        const magic = buffer.readUInt32LE(0);
        if (magic === 0x9AC6CDD7 || buffer.readUInt16LE(0) === 0xCDD7) {
          // Placeable WMF - has bounds
          const left = buffer.readInt16LE(6);
          const top = buffer.readInt16LE(8);
          const right = buffer.readInt16LE(10);
          const bottom = buffer.readInt16LE(12);
          
          return {
            width: Math.abs(right - left),
            height: Math.abs(bottom - top)
          };
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Estimate optimal conversion settings based on image info
   */
  static getOptimalSettings(info: ImageInfo): { dpi: number; quality: number } {
    // Larger images might need higher DPI
    const avgDimension = (info.width && info.height) 
      ? (info.width + info.height) / 2 
      : 1000;
    
    let dpi = 150;
    let quality = 95;
    
    if (avgDimension > 2000) {
      dpi = 200;
    } else if (avgDimension > 4000) {
      dpi = 300;
    }
    
    // Vector formats can use higher quality
    if (info.isVector) {
      quality = 98;
    }
    
    return { dpi, quality };
  }
}