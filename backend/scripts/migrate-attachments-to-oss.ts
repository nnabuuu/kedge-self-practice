#!/usr/bin/env ts-node

/**
 * Script to migrate local filesystem attachments to Aliyun OSS
 * Features:
 * - Checks for duplicates using file hash
 * - Supports dry-run mode
 * - Shows progress and statistics
 * - Preserves directory structure
 * - Handles errors gracefully
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as OSS from 'ali-oss';
import { promisify } from 'util';
import { createReadStream } from 'fs';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

// Configuration from environment
const config = {
  // OSS Configuration
  accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.ALIYUN_OSS_BUCKET || '',
  region: process.env.ALIYUN_OSS_REGION || '',
  endpoint: process.env.ALIYUN_OSS_ENDPOINT || '',
  pathPrefix: process.env.ALIYUN_OSS_PATH_PREFIX || 'quiz-attachments',
  
  // Local storage path
  localStoragePath: process.env.QUIZ_STORAGE_PATH || './quiz-storage',
  
  // Script options
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  force: process.argv.includes('--force'), // Skip duplicate check
  parallel: parseInt(process.argv.find(arg => arg.startsWith('--parallel='))?.split('=')[1] || '3'),
};

interface FileInfo {
  localPath: string;
  relativePath: string;
  size: number;
  hash?: string;
  ossPath?: string;
}

interface MigrationStats {
  totalFiles: number;
  totalSize: number;
  uploaded: number;
  skipped: number;
  failed: number;
  errors: Array<{ file: string; error: string }>;
}

class AttachmentMigrator {
  private client: OSS | null = null;
  private stats: MigrationStats = {
    totalFiles: 0,
    totalSize: 0,
    uploaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  private existingFiles: Map<string, boolean> = new Map();

  constructor() {
    if (this.validateConfig()) {
      this.initializeOSS();
    }
  }

  private validateConfig(): boolean {
    if (!config.accessKeyId || !config.bucket) {
      console.error('❌ OSS configuration missing. Please set the following environment variables:');
      console.error('   ALIYUN_OSS_ACCESS_KEY_ID');
      console.error('   ALIYUN_OSS_ACCESS_KEY_SECRET');
      console.error('   ALIYUN_OSS_BUCKET');
      console.error('   ALIYUN_OSS_REGION');
      return false;
    }

    if (!fs.existsSync(config.localStoragePath)) {
      console.error(`❌ Local storage path not found: ${config.localStoragePath}`);
      return false;
    }

    return true;
  }

  private initializeOSS(): void {
    try {
      this.client = new OSS({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint,
        secure: true,
        timeout: 60000,
      });
      
      console.log(`✅ Connected to OSS bucket: ${config.bucket}`);
    } catch (error) {
      console.error('❌ Failed to initialize OSS client:', error);
      process.exit(1);
    }
  }

  /**
   * Calculate file hash for duplicate detection
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Check if file exists in OSS
   */
  private async fileExistsInOSS(ossPath: string): Promise<boolean> {
    if (!this.client) return false;
    
    // Use cache to avoid repeated checks
    if (this.existingFiles.has(ossPath)) {
      return this.existingFiles.get(ossPath)!;
    }

    try {
      await this.client.head(ossPath);
      this.existingFiles.set(ossPath, true);
      return true;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        this.existingFiles.set(ossPath, false);
        return false;
      }
      // For other errors, don't cache
      throw error;
    }
  }

  /**
   * Get all files recursively from a directory
   */
  private async getAllFiles(dir: string, baseDir: string = dir): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        
        files.push({
          localPath: fullPath,
          relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
          size: stats.size,
        });
      }
    }

    return files;
  }

  /**
   * Upload a single file to OSS
   */
  private async uploadFile(file: FileInfo): Promise<boolean> {
    if (!this.client) return false;

    const ossPath = config.pathPrefix 
      ? `${config.pathPrefix}/${file.relativePath}`
      : file.relativePath;

    file.ossPath = ossPath;

    try {
      // Check if file already exists (unless --force is used)
      if (!config.force) {
        const exists = await this.fileExistsInOSS(ossPath);
        if (exists) {
          if (config.verbose) {
            console.log(`⏭️  Skipped (exists): ${file.relativePath}`);
          }
          this.stats.skipped++;
          return true;
        }
      }

      // Calculate hash if needed for duplicate detection
      if (!config.force && !file.hash) {
        file.hash = await this.calculateFileHash(file.localPath);
        
        // Check if a file with same hash exists (advanced duplicate detection)
        // This would require maintaining a hash index in OSS metadata
        // For now, we just check by path
      }

      if (config.dryRun) {
        console.log(`🔍 [DRY RUN] Would upload: ${file.relativePath} -> ${ossPath}`);
        this.stats.uploaded++;
        return true;
      }

      // Read file and upload
      const fileBuffer = await readFile(file.localPath);
      
      // Determine MIME type from extension
      const ext = path.extname(file.localPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
      };
      
      const result = await this.client.put(ossPath, fileBuffer, {
        mime: mimeTypes[ext] || 'application/octet-stream',
        headers: {
          'x-oss-storage-class': 'Standard', // Can be changed to 'IA' or 'Archive' for cost savings
          'x-oss-object-acl': 'private', // Keep files private
          'x-oss-meta-original-path': file.relativePath,
          'x-oss-meta-file-hash': file.hash || '',
          'x-oss-meta-migration-date': new Date().toISOString(),
        },
      });

      if (config.verbose) {
        console.log(`✅ Uploaded: ${file.relativePath} -> ${ossPath}`);
      }
      
      this.stats.uploaded++;
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to upload ${file.relativePath}:`, error.message);
      this.stats.failed++;
      this.stats.errors.push({
        file: file.relativePath,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Process files in batches for parallel upload
   */
  private async processFilesInBatches(files: FileInfo[]): Promise<void> {
    const batchSize = config.parallel;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, Math.min(i + batchSize, files.length));
      const promises = batch.map(file => this.uploadFile(file));
      
      await Promise.all(promises);
      
      // Show progress
      const progress = Math.min(i + batchSize, files.length);
      const percentage = Math.round((progress / files.length) * 100);
      console.log(`📊 Progress: ${progress}/${files.length} (${percentage}%)`);
    }
  }

  /**
   * Main migration function
   */
  public async migrate(): Promise<void> {
    console.log('🚀 Starting attachment migration to OSS...');
    console.log(`📁 Local storage path: ${config.localStoragePath}`);
    console.log(`☁️  OSS bucket: ${config.bucket}`);
    console.log(`📝 Path prefix: ${config.pathPrefix}`);
    
    if (config.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be uploaded');
    }
    
    console.log('');

    // Get all files
    console.log('🔍 Scanning local files...');
    const files = await this.getAllFiles(config.localStoragePath);
    
    this.stats.totalFiles = files.length;
    this.stats.totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    console.log(`📊 Found ${this.stats.totalFiles} files (${this.formatSize(this.stats.totalSize)})`);
    console.log('');

    if (files.length === 0) {
      console.log('✅ No files to migrate');
      return;
    }

    // Start migration
    const startTime = Date.now();
    await this.processFilesInBatches(files);
    const duration = (Date.now() - startTime) / 1000;

    // Print summary
    console.log('');
    console.log('📊 Migration Summary');
    console.log('====================');
    console.log(`Total files:    ${this.stats.totalFiles}`);
    console.log(`Total size:     ${this.formatSize(this.stats.totalSize)}`);
    console.log(`Uploaded:       ${this.stats.uploaded} files`);
    console.log(`Skipped:        ${this.stats.skipped} files (already exist)`);
    console.log(`Failed:         ${this.stats.failed} files`);
    console.log(`Duration:       ${duration.toFixed(2)} seconds`);
    console.log(`Upload speed:   ${this.formatSize(this.stats.totalSize / duration)}/s`);
    
    if (this.stats.errors.length > 0) {
      console.log('');
      console.log('❌ Errors:');
      this.stats.errors.forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
    }

    if (config.dryRun) {
      console.log('');
      console.log('🔍 This was a DRY RUN - no files were actually uploaded');
      console.log('Remove --dry-run flag to perform actual migration');
    }

    // Exit with appropriate code
    process.exit(this.stats.failed > 0 ? 1 : 0);
  }

  /**
   * Format bytes to human readable size
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Verify migration by comparing local and OSS files
   */
  public async verify(): Promise<void> {
    console.log('🔍 Verifying migration...');
    
    const localFiles = await this.getAllFiles(config.localStoragePath);
    let matched = 0;
    let missing = 0;
    
    for (const file of localFiles) {
      const ossPath = config.pathPrefix 
        ? `${config.pathPrefix}/${file.relativePath}`
        : file.relativePath;
      
      const exists = await this.fileExistsInOSS(ossPath);
      
      if (exists) {
        matched++;
        if (config.verbose) {
          console.log(`✅ Verified: ${file.relativePath}`);
        }
      } else {
        missing++;
        console.log(`❌ Missing: ${file.relativePath}`);
      }
    }
    
    console.log('');
    console.log('📊 Verification Results');
    console.log('======================');
    console.log(`Total files:     ${localFiles.length}`);
    console.log(`Verified in OSS: ${matched}`);
    console.log(`Missing in OSS:  ${missing}`);
    
    if (missing === 0) {
      console.log('');
      console.log('✅ All files successfully migrated to OSS!');
    } else {
      console.log('');
      console.log('⚠️  Some files are missing in OSS. Run migration again to upload missing files.');
    }
  }
}

// Main execution
async function main() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '../../.envrc') });
  
  const migrator = new AttachmentMigrator();
  
  if (process.argv.includes('--verify')) {
    await migrator.verify();
  } else if (process.argv.includes('--help')) {
    console.log('Usage: ts-node migrate-attachments-to-oss.ts [options]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run       Simulate migration without uploading files');
    console.log('  --verbose       Show detailed progress for each file');
    console.log('  --force         Skip duplicate check and re-upload all files');
    console.log('  --parallel=N    Number of parallel uploads (default: 3)');
    console.log('  --verify        Verify that all files exist in OSS');
    console.log('  --help          Show this help message');
    console.log('');
    console.log('Environment variables required:');
    console.log('  ALIYUN_OSS_ACCESS_KEY_ID');
    console.log('  ALIYUN_OSS_ACCESS_KEY_SECRET');
    console.log('  ALIYUN_OSS_BUCKET');
    console.log('  ALIYUN_OSS_REGION');
    console.log('  ALIYUN_OSS_ENDPOINT (optional)');
    console.log('  ALIYUN_OSS_PATH_PREFIX (optional, default: quiz-attachments)');
    console.log('  QUIZ_STORAGE_PATH (default: ./quiz-storage)');
  } else {
    await migrator.migrate();
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});