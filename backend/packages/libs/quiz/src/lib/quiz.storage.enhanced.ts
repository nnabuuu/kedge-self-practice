import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { env } from '../env';

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
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'],
  };

  /**
   * Save a single attachment with validation and metadata tracking
   */
  async saveAttachment(
    file: AttachmentFile,
    options: AttachmentValidationOptions = {},
  ): Promise<AttachmentMetadata> {
    const validation = { ...this.defaultValidation, ...options };
    
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
    
    // Save file
    await fs.writeFile(fullPath, file.data);
    
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
    
    this.logger.log(`Saved attachment: ${metadata.id} (${metadata.originalName})`);
    
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
    return Promise.all(savePromises);
  }

  /**
   * Get attachment by ID (relative path)
   */
  async getAttachment(relativePath: string): Promise<Buffer> {
    // Prevent path traversal attacks
    if (relativePath.includes('..') || relativePath.includes('~')) {
      throw new BadRequestException('Invalid file path');
    }
    
    const fullPath = join(this.root, relativePath);
    
    try {
      return await fs.readFile(fullPath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        throw new BadRequestException('Attachment not found');
      }
      throw error;
    }
  }

  /**
   * Get attachment by UUID and extension (new simplified format)
   */
  async getAttachmentByUuid(uuid: string, extension: string): Promise<{ buffer: Buffer; metadata?: AttachmentMetadata }> {
    // For now, we'll search for the file in the directory structure
    // In production, this should query the attachments table for the file path
    
    try {
      // Try common year/month combinations (this is temporary)
      // In production, query the database for the exact path
      const possiblePaths = [
        `2025/08/${uuid}.${extension}`,
        `2025/07/${uuid}.${extension}`,
        `2024/12/${uuid}.${extension}`,
        `2024/11/${uuid}.${extension}`,
      ];
      
      for (const path of possiblePaths) {
        try {
          const fullPath = join(this.root, path);
          const buffer = await fs.readFile(fullPath);
          
          // Get file stats for metadata
          const stats = await fs.stat(fullPath);
          
          const metadata: AttachmentMetadata = {
            id: uuid,
            originalName: `${uuid}.${extension}`,
            storedName: `${uuid}.${extension}`,
            relativePath: path,
            mimetype: this.getMimeType(`.${extension}`),
            size: stats.size,
            hash: '',
            uploadedAt: stats.birthtime,
          };
          
          return { buffer, metadata };
        } catch (error) {
          // File not found in this path, try next
          continue;
        }
      }
      
      // If we get here, file wasn't found in any expected location
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
    
    const fullPath = join(this.root, relativePath);
    
    try {
      await fs.unlink(fullPath);
      this.logger.log(`Deleted attachment: ${relativePath}`);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File doesn't exist, consider it already deleted
        return;
      }
      throw error;
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
    
    const fullPath = join(this.root, relativePath);
    
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byMonth: Record<string, { count: number; size: number }>;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byMonth: {} as Record<string, { count: number; size: number }>,
    };
    
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
              stats.totalFiles++;
              stats.totalSize += fileStat.size;
              stats.byMonth[monthKey].count++;
              stats.byMonth[monthKey].size += fileStat.size;
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('Error getting storage stats:', error);
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
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
  }
}