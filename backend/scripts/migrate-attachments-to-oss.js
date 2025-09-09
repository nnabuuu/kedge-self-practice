#!/usr/bin/env node

/**
 * Script to migrate local filesystem attachments to Aliyun OSS
 * 
 * Usage:
 *   node scripts/migrate-attachments-to-oss.js [options]
 * 
 * Options:
 *   --dry-run       Simulate migration without uploading files
 *   --verbose       Show detailed progress for each file
 *   --force         Skip duplicate check and re-upload all files
 *   --parallel=N    Number of parallel uploads (default: 3)
 *   --verify        Verify that all files exist in OSS
 *   --help          Show help message
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OSS = require('ali-oss');

// Load environment variables from .envrc
const envrcPath = path.join(__dirname, '../../.envrc');
if (fs.existsSync(envrcPath)) {
  const envContent = fs.readFileSync(envrcPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const match = line.match(/^export\s+([A-Z_]+)="?([^"]*)"?$/);
    if (match) {
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

// Configuration
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
  force: process.argv.includes('--force'),
  verify: process.argv.includes('--verify'),
  help: process.argv.includes('--help'),
  parallel: parseInt(process.argv.find(arg => arg.startsWith('--parallel='))?.split('=')[1] || '3'),
};

class AttachmentMigrator {
  constructor() {
    this.client = null;
    this.stats = {
      totalFiles: 0,
      totalSize: 0,
      uploaded: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
    this.existingFiles = new Map();
    
    if (this.validateConfig()) {
      this.initializeOSS();
    }
  }

  validateConfig() {
    if (!config.accessKeyId || !config.bucket) {
      console.error('❌ OSS configuration missing. Please set the following environment variables:');
      console.error('   ALIYUN_OSS_ACCESS_KEY_ID');
      console.error('   ALIYUN_OSS_ACCESS_KEY_SECRET');
      console.error('   ALIYUN_OSS_BUCKET');
      console.error('   ALIYUN_OSS_REGION');
      console.error('');
      console.error('You can set these in backend/.envrc or backend/.envrc.override');
      return false;
    }

    const fullPath = path.resolve(config.localStoragePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Local storage path not found: ${fullPath}`);
      console.error(`   Current directory: ${process.cwd()}`);
      return false;
    }

    return true;
  }

  initializeOSS() {
    try {
      this.client = new OSS({
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint || undefined,
        secure: true,
        timeout: 60000,
      });
      
      console.log(`✅ Connected to OSS bucket: ${config.bucket}`);
      if (config.endpoint) {
        console.log(`   Endpoint: ${config.endpoint}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize OSS client:', error.message);
      process.exit(1);
    }
  }

  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  async fileExistsInOSS(ossPath) {
    if (!this.client) return false;
    
    if (this.existingFiles.has(ossPath)) {
      return this.existingFiles.get(ossPath);
    }

    try {
      await this.client.head(ossPath);
      this.existingFiles.set(ossPath, true);
      return true;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        this.existingFiles.set(ossPath, false);
        return false;
      }
      throw error;
    }
  }

  async getAllFiles(dir, baseDir = dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...await this.getAllFiles(fullPath, baseDir));
      } else if (entry.isFile()) {
        const stats = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        
        // Skip hidden files and system files
        if (entry.name.startsWith('.')) continue;
        
        // Skip .emf and .wmf files (Enhanced Metafile/Windows Metafile formats)
        // These should have been converted to PNG during upload
        const lowerName = entry.name.toLowerCase();
        if (lowerName.endsWith('.emf') || lowerName.endsWith('.wmf')) {
          if (config.verbose) {
            console.log(`⏭️  Skipping ${lowerName.endsWith('.emf') ? 'EMF' : 'WMF'} file: ${relativePath} (should have been converted during upload)`);
          }
          continue;
        }
        
        files.push({
          localPath: fullPath,
          relativePath: relativePath.replace(/\\/g, '/'),
          size: stats.size,
        });
      }
    }

    return files;
  }

  async uploadFile(file) {
    if (!this.client) return false;

    const ossPath = config.pathPrefix 
      ? `${config.pathPrefix}/${file.relativePath}`
      : file.relativePath;

    try {
      // Check if file already exists
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

      if (config.dryRun) {
        console.log(`🔍 [DRY RUN] Would upload: ${file.relativePath} -> ${ossPath}`);
        this.stats.uploaded++;
        return true;
      }

      // Read file
      const fileBuffer = fs.readFileSync(file.localPath);
      
      // Determine MIME type
      const ext = path.extname(file.localPath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.emf': 'image/x-emf',
        '.wmf': 'image/x-wmf',
      };
      
      const mimeType = mimeTypes[ext] || 'application/octet-stream';
      
      // Upload to OSS
      await this.client.put(ossPath, fileBuffer, {
        mime: mimeType,
        headers: {
          'x-oss-storage-class': 'Standard',
          'x-oss-object-acl': 'private',
          'x-oss-meta-original-path': file.relativePath,
          'x-oss-meta-migration-date': new Date().toISOString(),
        },
      });

      if (config.verbose) {
        console.log(`✅ Uploaded: ${file.relativePath} (${this.formatSize(file.size)})`);
      }
      
      this.stats.uploaded++;
      return true;
    } catch (error) {
      console.error(`❌ Failed to upload ${file.relativePath}:`, error.message);
      this.stats.failed++;
      this.stats.errors.push({
        file: file.relativePath,
        error: error.message,
      });
      return false;
    }
  }

  async processFilesInBatches(files) {
    const batchSize = config.parallel;
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, Math.min(i + batchSize, files.length));
      const promises = batch.map(file => this.uploadFile(file));
      
      await Promise.all(promises);
      
      // Show progress
      const progress = Math.min(i + batchSize, files.length);
      const percentage = Math.round((progress / files.length) * 100);
      
      if (!config.verbose) {
        process.stdout.write(`\r📊 Progress: ${progress}/${files.length} (${percentage}%)`);
      } else {
        console.log(`📊 Progress: ${progress}/${files.length} (${percentage}%)`);
      }
    }
    
    if (!config.verbose) {
      console.log(''); // New line after progress
    }
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  async migrate() {
    console.log('🚀 Starting attachment migration to OSS...');
    console.log(`📁 Local storage: ${path.resolve(config.localStoragePath)}`);
    console.log(`☁️  OSS bucket: ${config.bucket}`);
    console.log(`📝 Path prefix: ${config.pathPrefix}`);
    console.log(`🔄 Parallel uploads: ${config.parallel}`);
    
    if (config.dryRun) {
      console.log('🔍 DRY RUN MODE - No files will be uploaded');
    }
    if (config.force) {
      console.log('⚠️  FORCE MODE - Will re-upload existing files');
    }
    
    console.log('');

    // Get all files
    console.log('🔍 Scanning local files...');
    const files = await this.getAllFiles(path.resolve(config.localStoragePath));
    
    this.stats.totalFiles = files.length;
    this.stats.totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    console.log(`📊 Found ${this.stats.totalFiles} files (${this.formatSize(this.stats.totalSize)})`);
    console.log('');

    if (files.length === 0) {
      console.log('✅ No files to migrate');
      return;
    }

    // List some files if verbose
    if (config.verbose && files.length > 0) {
      console.log('Files to process:');
      files.slice(0, 5).forEach(f => {
        console.log(`  - ${f.relativePath} (${this.formatSize(f.size)})`);
      });
      if (files.length > 5) {
        console.log(`  ... and ${files.length - 5} more files`);
      }
      console.log('');
    }

    // Start migration
    const startTime = Date.now();
    await this.processFilesInBatches(files);
    const duration = (Date.now() - startTime) / 1000;

    // Print summary
    console.log('');
    console.log('═'.repeat(50));
    console.log('📊 Migration Summary');
    console.log('═'.repeat(50));
    console.log(`Total files:     ${this.stats.totalFiles}`);
    console.log(`Total size:      ${this.formatSize(this.stats.totalSize)}`);
    console.log(`✅ Uploaded:     ${this.stats.uploaded} files`);
    console.log(`⏭️  Skipped:      ${this.stats.skipped} files (already exist)`);
    console.log(`❌ Failed:       ${this.stats.failed} files`);
    console.log(`⏱️  Duration:     ${duration.toFixed(2)} seconds`);
    
    if (duration > 0) {
      const uploadedSize = files
        .filter((_, i) => i < this.stats.uploaded)
        .reduce((sum, f) => sum + f.size, 0);
      console.log(`📈 Upload speed: ${this.formatSize(uploadedSize / duration)}/s`);
    }
    
    if (this.stats.errors.length > 0) {
      console.log('');
      console.log('❌ Errors:');
      this.stats.errors.slice(0, 10).forEach(err => {
        console.log(`   - ${err.file}: ${err.error}`);
      });
      if (this.stats.errors.length > 10) {
        console.log(`   ... and ${this.stats.errors.length - 10} more errors`);
      }
    }

    if (config.dryRun) {
      console.log('');
      console.log('🔍 This was a DRY RUN - no files were actually uploaded');
      console.log('Remove --dry-run flag to perform actual migration');
    }

    console.log('═'.repeat(50));
  }

  async verify() {
    console.log('🔍 Verifying migration...');
    console.log(`📁 Local storage: ${path.resolve(config.localStoragePath)}`);
    console.log(`☁️  OSS bucket: ${config.bucket}`);
    console.log('');
    
    const localFiles = await this.getAllFiles(path.resolve(config.localStoragePath));
    let matched = 0;
    let missing = 0;
    const missingFiles = [];
    
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
        missingFiles.push(file.relativePath);
        if (!config.verbose) {
          process.stdout.write(`\r🔍 Checking: ${matched + missing}/${localFiles.length}`);
        } else {
          console.log(`❌ Missing: ${file.relativePath}`);
        }
      }
    }
    
    if (!config.verbose) {
      console.log(''); // New line after progress
    }
    
    console.log('');
    console.log('═'.repeat(50));
    console.log('📊 Verification Results');
    console.log('═'.repeat(50));
    console.log(`Total files:      ${localFiles.length}`);
    console.log(`✅ In OSS:        ${matched} files`);
    console.log(`❌ Missing:       ${missing} files`);
    
    if (missing > 0 && !config.verbose) {
      console.log('');
      console.log('Missing files:');
      missingFiles.slice(0, 10).forEach(f => {
        console.log(`  - ${f}`);
      });
      if (missingFiles.length > 10) {
        console.log(`  ... and ${missingFiles.length - 10} more files`);
      }
    }
    
    console.log('═'.repeat(50));
    
    if (missing === 0) {
      console.log('✅ All files successfully exist in OSS!');
    } else {
      console.log('⚠️  Some files are missing. Run migration to upload them.');
    }
  }
}

function showHelp() {
  console.log('Aliyun OSS Attachment Migration Tool');
  console.log('=====================================');
  console.log('');
  console.log('Usage: node scripts/migrate-attachments-to-oss.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run       Simulate migration without uploading files');
  console.log('  --verbose       Show detailed progress for each file');
  console.log('  --force         Skip duplicate check and re-upload all files');
  console.log('  --parallel=N    Number of parallel uploads (default: 3, max: 10)');
  console.log('  --verify        Verify that all files exist in OSS');
  console.log('  --help          Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  # Dry run to see what would be uploaded');
  console.log('  node scripts/migrate-attachments-to-oss.js --dry-run');
  console.log('');
  console.log('  # Perform actual migration');
  console.log('  node scripts/migrate-attachments-to-oss.js');
  console.log('');
  console.log('  # Migrate with detailed output');
  console.log('  node scripts/migrate-attachments-to-oss.js --verbose');
  console.log('');
  console.log('  # Verify all files exist in OSS');
  console.log('  node scripts/migrate-attachments-to-oss.js --verify');
  console.log('');
  console.log('  # Force re-upload all files');
  console.log('  node scripts/migrate-attachments-to-oss.js --force');
  console.log('');
  console.log('Environment variables (set in backend/.envrc):');
  console.log('  ALIYUN_OSS_ACCESS_KEY_ID      - OSS access key ID');
  console.log('  ALIYUN_OSS_ACCESS_KEY_SECRET  - OSS access key secret');
  console.log('  ALIYUN_OSS_BUCKET             - OSS bucket name');
  console.log('  ALIYUN_OSS_REGION             - OSS region (e.g., oss-cn-hangzhou)');
  console.log('  ALIYUN_OSS_ENDPOINT           - OSS endpoint (optional)');
  console.log('  ALIYUN_OSS_PATH_PREFIX        - Path prefix in OSS (default: quiz-attachments)');
  console.log('  QUIZ_STORAGE_PATH             - Local storage path (default: ./quiz-storage)');
}

// Main execution
async function main() {
  if (config.help) {
    showHelp();
    process.exit(0);
  }

  const migrator = new AttachmentMigrator();
  
  if (!migrator.client) {
    process.exit(1);
  }

  try {
    if (config.verify) {
      await migrator.verify();
    } else {
      await migrator.migrate();
    }
    
    process.exit(migrator.stats.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('');
    console.error('❌ Fatal error:', error.message);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Migration interrupted by user');
  process.exit(130);
});

// Run the script
main();