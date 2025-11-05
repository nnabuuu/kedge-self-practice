import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { env } from '../env';
import { AliyunOSSService } from './storage/oss.service';
import { HybridStorageService } from './storage/hybrid-storage.service';

export interface AttachmentFile {
  filename: string;
  data: Buffer;
  mimetype?: string;
}

export interface AttachmentMetadata {
  id: string;
  originalName: string;
  storedName: string;
  relativePath: string;
  mimetype: string;
  size: number;
  hash: string;
  uploadedAt: Date;
}

export interface AttachmentValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

@Injectable()
export class EnhancedQuizStorageService {
  private readonly logger = new Logger(EnhancedQuizStorageService.name);
  private readonly root = env().QUIZ_STORAGE_PATH;
  private readonly hybridStorage: HybridStorageService;
  
  constructor() {
    const ossService = new AliyunOSSService();
    this.hybridStorage = new HybridStorageService(ossService, this.root);
  }
  
  // Default validation options
  private readonly defaultValidation: AttachmentValidationOptions = {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'image/x-emf',
      'image/emf',
      'image/x-wmf',
      'image/wmf',
      'application/octet-stream', // EMF/WMF files sometimes come as binary
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.emf', '.wmf'],
  };

  /**
   * Save a single attachment with validation and metadata tracking
   */
  async saveAttachment(
    file: AttachmentFile,
    options: AttachmentValidationOptions = {},
  ): Promise<AttachmentMetadata | null> {
    const validation = { ...this.defaultValidation, ...options };
    
    // Skip empty files (size 0)
    if (!file.data || file.data.length === 0) {
      this.logger.warn(`Skipping empty attachment: ${file.filename} (size: 0 bytes)`);
      return null;
    }
    
    // Validate file
    this.validateFile(file, validation);
    
    // Generate metadata
    const fileId = uuid();
    const ext = extname(file.filename).toLowerCase();
    const safeOriginalName = this.sanitizeFilename(file.filename);
    const storedName = `${fileId}${ext}`;
    
    // Create year/month subdirectory structure for better organization
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const relativePath = join(year.toString(), month, storedName);
    const fullPath = join(this.root, relativePath);
    
    // Ensure directory exists
    const dir = join(this.root, year.toString(), month);
    await fs.mkdir(dir, { recursive: true });
    
    // Calculate file hash for deduplication/integrity
    const hash = createHash('sha256').update(file.data).digest('hex');
    
    // Save file using hybrid storage (OSS first, fallback to filesystem)
    const storageResult = await this.hybridStorage.saveFile(relativePath, file.data, {
      mimetype: file.mimetype || this.getMimeType(ext),
    });
    
    if (!storageResult.success) {
      throw new Error('Failed to save attachment to storage');
    }
    
    const metadata: AttachmentMetadata = {
      id: fileId,
      originalName: safeOriginalName,
      storedName,
      relativePath,
      mimetype: file.mimetype || this.getMimeType(ext),
      size: file.data.length,
      hash,
      uploadedAt: now,
    };
    
    this.logger.log(`Saved attachment: ${metadata.id} (${metadata.originalName}, size: ${metadata.size} bytes)`);
    
    return metadata;
  }

  /**
   * Save multiple attachments in parallel
   */
  async saveAttachments(
    files: AttachmentFile[],
    options: AttachmentValidationOptions = {},
  ): Promise<AttachmentMetadata[]> {
    const savePromises = files.map(file => this.saveAttachment(file, options));
    const results = await Promise.all(savePromises);
    // Filter out null results from empty files and assert type
    return results.filter((result): result is AttachmentMetadata => result !== null);
  }

  /**
   * Get attachment by ID (relative path)
   */
  async getAttachment(relativePath: string): Promise<Buffer> {
    // Prevent path traversal attacks
    if (relativePath.includes('..') || relativePath.includes('~')) {
      throw new BadRequestException('Invalid file path');
    }
    
    // Try hybrid storage (OSS first, then filesystem)
    const buffer = await this.hybridStorage.getFile(relativePath);
    
    if (!buffer) {
      throw new BadRequestException('Attachment not found');
    }
    
    return buffer;
  }

  /**
   * Get attachment by UUID and extension (new simplified format)
   */
  async getAttachmentByUuid(uuid: string, extension: string): Promise<{ buffer: Buffer; metadata?: AttachmentMetadata }> {
    // For now, we'll search for the file in the directory structure
    // In production, this should query the attachments table for the file path
    
    
    try {
      // Generate possible paths based on current and recent months
      // In production, this should query the database for the exact path
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      const possiblePaths: string[] = [];
      
      // Add current month and previous 11 months (1 year of history)
      for (let i = 0; i < 12; i++) {
        let year = currentYear;
        let month = currentMonth - i;
        
        // Handle year boundary
        if (month <= 0) {
          month += 12;
          year -= 1;
        }
        
        const monthStr = String(month).padStart(2, '0');
        possiblePaths.push(`${year}/${monthStr}/${uuid}.${extension}`);
      }
      
      
      for (const path of possiblePaths) {
        try {
          // Try to get file from hybrid storage
          const buffer = await this.hybridStorage.getFile(path);
          
          if (buffer) {
            
            const metadata: AttachmentMetadata = {
              id: uuid,
              originalName: `${uuid}.${extension}`,
              storedName: `${uuid}.${extension}`,
              relativePath: path,
              mimetype: this.getMimeType(`.${extension}`),
              size: buffer.length,
              hash: '',
              uploadedAt: new Date(),
            };
            
            return { buffer, metadata };
          }
        } catch (error) {
          // File not found in this path, try next
          continue;
        }
      }
      
      // If we get here, file wasn't found in any expected location
      console.error(`Attachment not found in any of the ${possiblePaths.length} paths checked`);
      console.error(`Storage root: ${this.root}`);
      console.error(`First few paths checked:`, possiblePaths.slice(0, 3));
      throw new BadRequestException(`Attachment not found: ${uuid}.${extension}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve attachment');
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(relativePath: string): Promise<void> {
    // Prevent path traversal attacks
    if (relativePath.includes('..') || relativePath.includes('~')) {
      throw new BadRequestException('Invalid file path');
    }
    
    // Delete from hybrid storage (both OSS and filesystem if present)
    const deleted = await this.hybridStorage.deleteFile(relativePath);
    
    if (deleted) {
      this.logger.log(`Deleted attachment: ${relativePath}`);
    }
  }

  /**
   * Delete multiple attachments
   */
  async deleteAttachments(relativePaths: string[]): Promise<void> {
    const deletePromises = relativePaths.map(path => this.deleteAttachment(path));
    await Promise.all(deletePromises);
  }

  /**
   * Check if attachment exists
   */
  async attachmentExists(relativePath: string): Promise<boolean> {
    if (relativePath.includes('..') || relativePath.includes('~')) {
      return false;
    }
    
    // Check in hybrid storage
    return this.hybridStorage.fileExists(relativePath);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byMonth: Record<string, { count: number; size: number }>;
    storage: {
      oss: { configured: boolean; available: boolean };
      filesystem: { rootPath: string; totalFiles?: number; totalSize?: number };
    };
  }> {
    // Get hybrid storage stats
    const hybridStats = await this.hybridStorage.getStorageStats();
    
    const stats = {
      totalFiles: hybridStats.filesystem.totalFiles || 0,
      totalSize: hybridStats.filesystem.totalSize || 0,
      byMonth: {} as Record<string, { count: number; size: number }>,
      storage: hybridStats,
    };
    
    // Get detailed monthly stats from filesystem (if needed)
    try {
      const years = await fs.readdir(this.root);
      
      for (const year of years) {
        const yearPath = join(this.root, year);
        const yearStat = await fs.stat(yearPath);
        
        if (!yearStat.isDirectory()) continue;
        
        const months = await fs.readdir(yearPath);
        
        for (const month of months) {
          const monthPath = join(yearPath, month);
          const monthStat = await fs.stat(monthPath);
          
          if (!monthStat.isDirectory()) continue;
          
          const monthKey = `${year}-${month}`;
          stats.byMonth[monthKey] = { count: 0, size: 0 };
          
          const files = await fs.readdir(monthPath);
          
          for (const file of files) {
            const filePath = join(monthPath, file);
            const fileStat = await fs.stat(filePath);
            
            if (fileStat.isFile()) {
              stats.byMonth[monthKey].count++;
              stats.byMonth[monthKey].size += fileStat.size;
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error getting detailed storage stats:', error);
    }
    
    return stats;
  }

  /**
   * Validate file against constraints
   */
  private validateFile(file: AttachmentFile, options: AttachmentValidationOptions): void {
    // Check file size
    if (options.maxSizeBytes && file.data.length > options.maxSizeBytes) {
      throw new BadRequestException(
        `File ${file.filename} exceeds maximum size of ${options.maxSizeBytes} bytes`,
      );
    }
    
    // Check extension
    const ext = extname(file.filename).toLowerCase();
    
    // Log warning for EMF/WMF files but don't reject them
    // They should be converted before reaching this point
    if (ext === '.emf' || ext === '.wmf') {
      this.logger.warn(`Processing ${ext} file: ${file.filename}. Note: EMF/WMF files should be converted to PNG before storage.`);
    }
    
    if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `File extension ${ext} is not allowed. Allowed: ${options.allowedExtensions.join(', ')}`,
      );
    }
    
    // Check MIME type if provided
    if (file.mimetype && options.allowedMimeTypes) {
      if (!options.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `File type ${file.mimetype} is not allowed. Allowed: ${options.allowedMimeTypes.join(', ')}`,
        );
      }
    }
    
    // Check for potential security issues in filename
    if (file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
      throw new BadRequestException('Invalid filename');
    }
  }

  /**
   * Sanitize filename to prevent security issues
   */
  private sanitizeFilename(filename: string): string {
    // Remove path components and special characters
    return basename(filename)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255); // Limit length
  }

  /**
   * Get MIME type from extension
   */
  private getMimeType(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.emf': 'image/x-emf',  // Keep for reference, but these should be converted to PNG
      '.wmf': 'image/x-wmf',  // Keep for reference, but these should be converted to PNG
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}