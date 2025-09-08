import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { AliyunOSSService } from './oss.service';
import { AttachmentFile, AttachmentMetadata } from '../quiz.storage.enhanced';

/**
 * Hybrid storage service that uses OSS when available, with automatic fallback to filesystem
 */
@Injectable()
export class HybridStorageService {
  private readonly logger = new Logger(HybridStorageService.name);

  constructor(
    private readonly ossService: AliyunOSSService,
    private readonly rootPath: string,
  ) {}

  /**
   * Save file to storage (OSS first, fallback to filesystem)
   */
  async saveFile(
    relativePath: string,
    buffer: Buffer,
    options?: {
      mimetype?: string;
      metadata?: Partial<AttachmentMetadata>;
    }
  ): Promise<{ success: boolean; url?: string; storageType: 'oss' | 'filesystem' }> {
    // Try OSS first if configured
    if (this.ossService.isConfigured()) {
      try {
        const ossResult = await this.ossService.uploadFile(relativePath, buffer, {
          mimetype: options?.mimetype,
        });

        if (ossResult) {
          this.logger.debug(`File saved to OSS: ${relativePath}`);
          return {
            success: true,
            url: ossResult.url,
            storageType: 'oss',
          };
        }
      } catch (error) {
        this.logger.warn(`OSS upload failed for ${relativePath}, falling back to filesystem`, error);
      }
    }

    // Fallback to filesystem
    try {
      const fullPath = join(this.rootPath, relativePath);
      const dir = join(this.rootPath, relativePath.substring(0, relativePath.lastIndexOf('/')));
      
      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });
      
      // Save file
      await fs.writeFile(fullPath, buffer);
      
      this.logger.debug(`File saved to filesystem: ${relativePath}`);
      
      return {
        success: true,
        url: `/attachments/quiz/${relativePath}`, // Relative URL for filesystem
        storageType: 'filesystem',
      };
    } catch (error) {
      this.logger.error(`Failed to save file to filesystem: ${relativePath}`, error);
      throw error;
    }
  }

  /**
   * Retrieve file from storage (OSS first, fallback to filesystem)
   */
  async getFile(relativePath: string): Promise<Buffer | null> {
    // Try OSS first if configured
    if (this.ossService.isConfigured()) {
      try {
        const ossBuffer = await this.ossService.downloadFile(relativePath);
        if (ossBuffer) {
          this.logger.debug(`File retrieved from OSS: ${relativePath}`);
          return ossBuffer;
        }
      } catch (error) {
        this.logger.warn(`OSS download failed for ${relativePath}, falling back to filesystem`, error);
      }
    }

    // Fallback to filesystem
    try {
      const fullPath = join(this.rootPath, relativePath);
      const buffer = await fs.readFile(fullPath);
      
      this.logger.debug(`File retrieved from filesystem: ${relativePath}`);
      return buffer;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        this.logger.debug(`File not found in filesystem: ${relativePath}`);
        return null;
      }
      this.logger.error(`Failed to read file from filesystem: ${relativePath}`, error);
      throw error;
    }
  }

  /**
   * Delete file from storage (both OSS and filesystem)
   */
  async deleteFile(relativePath: string): Promise<boolean> {
    let ossDeleted = false;
    let fsDeleted = false;

    // Try to delete from OSS
    if (this.ossService.isConfigured()) {
      try {
        ossDeleted = await this.ossService.deleteFile(relativePath);
        if (ossDeleted) {
          this.logger.debug(`File deleted from OSS: ${relativePath}`);
        }
      } catch (error) {
        this.logger.warn(`Failed to delete from OSS: ${relativePath}`, error);
      }
    }

    // Also try to delete from filesystem (file might exist in both)
    try {
      const fullPath = join(this.rootPath, relativePath);
      await fs.unlink(fullPath);
      fsDeleted = true;
      this.logger.debug(`File deleted from filesystem: ${relativePath}`);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        this.logger.warn(`Failed to delete from filesystem: ${relativePath}`, error);
      }
    }

    return ossDeleted || fsDeleted;
  }

  /**
   * Check if file exists in storage
   */
  async fileExists(relativePath: string): Promise<boolean> {
    // Check OSS first
    if (this.ossService.isConfigured()) {
      const existsInOSS = await this.ossService.fileExists(relativePath);
      if (existsInOSS) {
        return true;
      }
    }

    // Check filesystem
    try {
      const fullPath = join(this.rootPath, relativePath);
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
    oss: {
      configured: boolean;
      available: boolean;
    };
    filesystem: {
      rootPath: string;
      totalFiles?: number;
      totalSize?: number;
    };
  }> {
    const stats = {
      oss: {
        configured: this.ossService.isConfigured(),
        available: false,
      },
      filesystem: {
        rootPath: this.rootPath,
      },
    };

    // Check OSS availability
    if (stats.oss.configured) {
      try {
        // Try to list files with limit 1 to check connectivity
        await this.ossService.listFiles('', 1);
        stats.oss.available = true;
      } catch {
        stats.oss.available = false;
      }
    }

    // Get filesystem stats
    try {
      const getAllFiles = async (dir: string): Promise<string[]> => {
        const files: string[] = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...await getAllFiles(fullPath));
          } else {
            files.push(fullPath);
          }
        }
        
        return files;
      };

      const allFiles = await getAllFiles(this.rootPath);
      let totalSize = 0;
      
      for (const file of allFiles) {
        const stat = await fs.stat(file);
        totalSize += stat.size;
      }
      
      (stats.filesystem as any).totalFiles = allFiles.length;
      (stats.filesystem as any).totalSize = totalSize;
    } catch (error) {
      this.logger.warn('Failed to get filesystem stats', error);
    }

    return stats;
  }

  /**
   * Migrate files from filesystem to OSS (utility method)
   */
  async migrateToOSS(relativePath: string): Promise<boolean> {
    if (!this.ossService.isConfigured()) {
      this.logger.warn('Cannot migrate to OSS: OSS not configured');
      return false;
    }

    try {
      // Read from filesystem
      const fullPath = join(this.rootPath, relativePath);
      const buffer = await fs.readFile(fullPath);
      
      // Upload to OSS
      const result = await this.ossService.uploadFile(relativePath, buffer);
      
      if (result) {
        this.logger.log(`Successfully migrated to OSS: ${relativePath}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to migrate to OSS: ${relativePath}`, error);
      return false;
    }
  }
}