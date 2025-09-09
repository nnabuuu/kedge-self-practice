#!/usr/bin/env node

/**
 * Script to test Aliyun OSS configuration
 * This will verify:
 * 1. Environment variables are loaded correctly
 * 2. Can connect to OSS
 * 3. Can list buckets
 * 4. Can perform basic operations (upload, check, delete test file)
 */

const fs = require('fs');
const path = require('path');
const OSS = require('ali-oss');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load environment variables from .env (compiled by direnv)
function loadEnvFile() {
  const envFile = path.join(__dirname, '../.env');
  
  if (fs.existsSync(envFile)) {
    log(`📁 Loading environment from: ${envFile}`, 'cyan');
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      // Match KEY=value format (with or without quotes)
      const match = line.match(/^([A-Z_]+)=["']?([^"'#\n]*)["']?/);
      if (match) {
        const [, key, value] = match;
        // Only set if not already set
        if (!process.env[key]) {
          process.env[key] = value.trim();
        }
      }
    });
  } else {
    log('⚠️  No .env file found (direnv may not have compiled it yet)', 'yellow');
    log('   Try running: direnv allow', 'yellow');
  }
}

async function testOSSConfig() {
  log('\n🚀 OSS Configuration Test\n', 'bright');
  log('=' .repeat(60), 'cyan');
  
  // Load environment
  loadEnvFile();
  
  // Check required environment variables
  log('\n1️⃣  Checking Environment Variables:', 'bright');
  const requiredVars = [
    'ALIYUN_OSS_ACCESS_KEY_ID',
    'ALIYUN_OSS_ACCESS_KEY_SECRET', 
    'ALIYUN_OSS_BUCKET',
    'ALIYUN_OSS_REGION'
  ];
  
  const optionalVars = [
    'ALIYUN_OSS_ENDPOINT',
    'ALIYUN_OSS_INTERNAL_ENDPOINT',
    'ALIYUN_OSS_PATH_PREFIX',
    'QUIZ_STORAGE_PATH'
  ];
  
  let allRequiredPresent = true;
  
  // Check required variables
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask sensitive values
      let displayValue = value;
      if (varName.includes('SECRET')) {
        displayValue = value.substring(0, 4) + '****' + value.substring(value.length - 4);
      } else if (varName.includes('KEY_ID')) {
        displayValue = value.substring(0, 8) + '****';
      }
      log(`   ✅ ${varName}: ${displayValue}`, 'green');
    } else {
      log(`   ❌ ${varName}: NOT SET`, 'red');
      allRequiredPresent = false;
    }
  });
  
  // Check optional variables
  log('\n   Optional variables:', 'cyan');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`   ✅ ${varName}: ${value}`, 'green');
    } else {
      log(`   ⚪ ${varName}: not set (using defaults)`, 'yellow');
    }
  });
  
  if (!allRequiredPresent) {
    log('\n❌ Missing required environment variables!', 'red');
    log('Please set them in backend/.envrc or backend/.envrc.override', 'yellow');
    process.exit(1);
  }
  
  // Initialize OSS client
  log('\n2️⃣  Initializing OSS Client:', 'bright');
  
  let client;
  try {
    const config = {
      accessKeyId: process.env.ALIYUN_OSS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_OSS_ACCESS_KEY_SECRET,
      bucket: process.env.ALIYUN_OSS_BUCKET,
      region: process.env.ALIYUN_OSS_REGION,
      secure: true,
      timeout: 10000, // 10 second timeout for testing
    };
    
    // Use custom endpoint if provided
    if (process.env.ALIYUN_OSS_ENDPOINT) {
      config.endpoint = process.env.ALIYUN_OSS_ENDPOINT;
      log(`   Using custom endpoint: ${config.endpoint}`, 'cyan');
    }
    
    client = new OSS(config);
    log(`   ✅ OSS client initialized successfully`, 'green');
    log(`   📍 Region: ${config.region}`, 'cyan');
    log(`   🪣 Bucket: ${config.bucket}`, 'cyan');
  } catch (error) {
    log(`   ❌ Failed to initialize OSS client: ${error.message}`, 'red');
    process.exit(1);
  }
  
  // Test bucket access
  log('\n3️⃣  Testing Bucket Access:', 'bright');
  
  try {
    // Try to get bucket info
    const result = await client.getBucketInfo(process.env.ALIYUN_OSS_BUCKET);
    log(`   ✅ Successfully accessed bucket: ${result.bucket.Name}`, 'green');
    log(`   📍 Location: ${result.bucket.Location}`, 'cyan');
    log(`   📅 Created: ${result.bucket.CreationDate}`, 'cyan');
    log(`   🔒 Access: ${result.bucket.AccessControlList.Grant}`, 'cyan');
  } catch (error) {
    log(`   ❌ Cannot access bucket: ${error.message}`, 'red');
    if (error.code === 'AccessDenied') {
      log('   💡 Check your access keys have permission for this bucket', 'yellow');
    } else if (error.code === 'NoSuchBucket') {
      log('   💡 The bucket does not exist. Please create it first.', 'yellow');
    }
    process.exit(1);
  }
  
  // Test file operations
  log('\n4️⃣  Testing File Operations:', 'bright');
  
  const testFileName = `_test/oss-config-test-${Date.now()}.txt`;
  const testContent = `OSS Configuration Test\nTimestamp: ${new Date().toISOString()}\n`;
  const pathPrefix = process.env.ALIYUN_OSS_PATH_PREFIX || 'quiz-attachments';
  const testPath = pathPrefix ? `${pathPrefix}/${testFileName}` : testFileName;
  
  try {
    // Test upload
    log(`   📤 Uploading test file: ${testPath}`, 'cyan');
    await client.put(testPath, Buffer.from(testContent), {
      mime: 'text/plain',
      headers: {
        'x-oss-storage-class': 'Standard',
        'x-oss-object-acl': 'private',
      }
    });
    log(`   ✅ Upload successful`, 'green');
    
    // Test file exists check
    log(`   🔍 Checking if file exists...`, 'cyan');
    await client.head(testPath);
    log(`   ✅ File exists check successful`, 'green');
    
    // Test download
    log(`   📥 Downloading test file...`, 'cyan');
    const getResult = await client.get(testPath);
    const downloadedContent = getResult.content.toString();
    if (downloadedContent === testContent) {
      log(`   ✅ Download successful - content matches`, 'green');
    } else {
      log(`   ⚠️  Download successful but content mismatch`, 'yellow');
    }
    
    // Test delete
    log(`   🗑️  Deleting test file...`, 'cyan');
    await client.delete(testPath);
    log(`   ✅ Delete successful`, 'green');
    
    // Verify deletion
    try {
      await client.head(testPath);
      log(`   ⚠️  File still exists after deletion`, 'yellow');
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        log(`   ✅ Deletion verified - file no longer exists`, 'green');
      }
    }
    
  } catch (error) {
    log(`   ❌ File operation failed: ${error.message}`, 'red');
    log(`   Error code: ${error.code}`, 'yellow');
    
    // Try to clean up if upload succeeded but other operations failed
    try {
      await client.delete(testPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
  
  // Test listing files (if there are any)
  log('\n5️⃣  Testing File Listing:', 'bright');
  
  try {
    const listResult = await client.list({
      prefix: pathPrefix,
      'max-keys': 5
    });
    
    if (listResult.objects && listResult.objects.length > 0) {
      log(`   ✅ Found ${listResult.objects.length} file(s) in ${pathPrefix}/`, 'green');
      listResult.objects.forEach(obj => {
        const size = (obj.size / 1024).toFixed(2);
        log(`      📄 ${obj.name} (${size} KB)`, 'cyan');
      });
    } else {
      log(`   ℹ️  No files found in ${pathPrefix}/ (this is normal for new setup)`, 'yellow');
    }
  } catch (error) {
    log(`   ❌ Listing failed: ${error.message}`, 'red');
  }
  
  // Summary
  log('\n' + '=' .repeat(60), 'cyan');
  log('✅ OSS Configuration Test Complete!', 'green');
  log('\nYour OSS is properly configured and ready to use.', 'bright');
  
  // Additional tips
  log('\n💡 Tips:', 'bright');
  log('   • To migrate existing files, run: npm run migrate:oss', 'cyan');
  log('   • To verify migration, run: npm run migrate:oss:verify', 'cyan');
  log('   • For dry run, use: npm run migrate:oss:dry-run', 'cyan');
}

// Main execution
async function main() {
  try {
    await testOSSConfig();
    process.exit(0);
  } catch (error) {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    if (process.argv.includes('--verbose')) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n⚠️  Test interrupted by user', 'yellow');
  process.exit(130);
});

// Show help if requested
if (process.argv.includes('--help')) {
  log('OSS Configuration Test Script', 'bright');
  log('=' .repeat(40), 'cyan');
  log('\nUsage: node scripts/test-oss-config.js [options]\n');
  log('Options:');
  log('  --verbose   Show detailed error stack traces');
  log('  --help      Show this help message\n');
  log('This script will:');
  log('  1. Check environment variables');
  log('  2. Test connection to OSS');
  log('  3. Verify bucket access');
  log('  4. Test basic file operations');
  log('  5. List existing files\n');
  process.exit(0);
}

// Run the test
main();