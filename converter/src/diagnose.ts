#!/usr/bin/env node

/**
 * Diagnostic tool for EMF/WMF files
 * Helps identify why certain files fail to convert
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

async function diagnoseFile(filePath: string) {
  console.log(chalk.bold(`\nDiagnosing: ${path.basename(filePath)}`));
  console.log('='.repeat(50));

  // Check file exists
  if (!await fs.pathExists(filePath)) {
    console.error(chalk.red('File not found!'));
    return;
  }

  // File stats
  const stats = await fs.stat(filePath);
  console.log(chalk.cyan('File Information:'));
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  Modified: ${stats.mtime.toLocaleString()}`);

  // Read file header
  const buffer = await fs.readFile(filePath);
  const header = buffer.slice(0, 40);
  
  console.log(chalk.cyan('\nFile Header (hex):'));
  console.log(`  ${header.toString('hex').match(/.{1,2}/g)?.slice(0, 20).join(' ')}`);

  // Identify format
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.wmf') {
    // Check WMF signature
    const magic = buffer.readUInt32LE(0);
    if (magic === 0x9AC6CDD7) {
      console.log(chalk.green('  ✓ Valid Placeable WMF header detected'));
      
      // Read WMF dimensions
      if (buffer.length > 18) {
        const left = buffer.readInt16LE(6);
        const top = buffer.readInt16LE(8);
        const right = buffer.readInt16LE(10);
        const bottom = buffer.readInt16LE(12);
        console.log(`  Dimensions: ${Math.abs(right - left)} x ${Math.abs(bottom - top)}`);
      }
    } else if (buffer.readUInt16LE(0) === 0xCDD7) {
      console.log(chalk.yellow('  ⚠ APM (Aldus Placeable Metafile) header detected'));
    } else {
      console.log(chalk.yellow('  ⚠ Non-standard WMF format or corrupted header'));
      console.log(`  Magic: 0x${magic.toString(16)}`);
    }
  } else if (ext === '.emf') {
    if (buffer.readUInt32LE(0) === 0x00000001) {
      console.log(chalk.green('  ✓ Valid EMF header detected'));
      
      // Read EMF dimensions
      if (buffer.length > 24) {
        const left = buffer.readInt32LE(8);
        const top = buffer.readInt32LE(12);
        const right = buffer.readInt32LE(16);
        const bottom = buffer.readInt32LE(20);
        console.log(`  Dimensions: ${Math.abs(right - left)} x ${Math.abs(bottom - top)}`);
      }
    } else {
      console.log(chalk.yellow('  ⚠ Invalid or corrupted EMF header'));
    }
  }

  // Test various conversion methods
  console.log(chalk.cyan('\nTesting Conversion Methods:'));
  
  // Test ImageMagick
  console.log('\n1. ImageMagick:');
  await testImageMagick(filePath);
  
  // Test LibreOffice
  console.log('\n2. LibreOffice:');
  await testLibreOffice(filePath);
  
  // Test Inkscape
  console.log('\n3. Inkscape:');
  await testInkscape(filePath);

  // Try identify command
  console.log(chalk.cyan('\nImageMagick Identify:'));
  try {
    const { stdout } = await execAsync(`magick identify -verbose "${filePath}" | head -20`);
    console.log(chalk.gray(stdout));
  } catch (error) {
    console.log(chalk.red('  Failed to identify file'));
  }
}

async function testImageMagick(filePath: string) {
  const testOutput = `/tmp/test-magick-${Date.now()}.png`;
  
  try {
    // Try direct conversion
    await execAsync(`magick "${filePath}" "${testOutput}"`, { timeout: 5000 });
    const exists = await fs.pathExists(testOutput);
    if (exists) {
      const stats = await fs.stat(testOutput);
      console.log(chalk.green(`  ✓ Direct conversion succeeded (${(stats.size / 1024).toFixed(2)} KB)`));
      await fs.unlink(testOutput);
    } else {
      console.log(chalk.red('  ✗ Direct conversion failed - no output'));
    }
  } catch (error: any) {
    console.log(chalk.red('  ✗ Direct conversion failed'));
    if (error.message) {
      console.log(chalk.gray(`    ${error.message.split('\n')[0]}`));
    }
  }

  // Try with explicit format
  try {
    await execAsync(`magick "${filePath}" -background white -flatten PNG:"${testOutput}"`, { timeout: 5000 });
    if (await fs.pathExists(testOutput)) {
      console.log(chalk.green('  ✓ Conversion with explicit PNG format succeeded'));
      await fs.unlink(testOutput);
    }
  } catch {
    console.log(chalk.red('  ✗ Explicit format conversion failed'));
  }
}

async function testLibreOffice(filePath: string) {
  const commands = [
    'soffice',
    'libreoffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ];

  let found = false;
  for (const cmd of commands) {
    try {
      await execAsync(`${cmd} --version`, { timeout: 2000 });
      console.log(chalk.green(`  ✓ LibreOffice found at: ${cmd}`));
      found = true;
      
      // Try conversion
      const testDir = `/tmp/lo-test-${Date.now()}`;
      await fs.ensureDir(testDir);
      
      try {
        await execAsync(`${cmd} --headless --convert-to png --outdir "${testDir}" "${filePath}"`, { timeout: 10000 });
        const files = await fs.readdir(testDir);
        if (files.length > 0) {
          console.log(chalk.green(`  ✓ Conversion succeeded: ${files.join(', ')}`));
        } else {
          console.log(chalk.red('  ✗ Conversion produced no output'));
        }
      } catch (error: any) {
        console.log(chalk.red('  ✗ Conversion failed'));
        if (error.message) {
          console.log(chalk.gray(`    ${error.message.split('\n')[0]}`));
        }
      }
      
      await fs.remove(testDir);
      break;
    } catch {
      // Try next command
    }
  }
  
  if (!found) {
    console.log(chalk.yellow('  ⚠ LibreOffice not found'));
  }
}

async function testInkscape(filePath: string) {
  try {
    await execAsync('inkscape --version', { timeout: 2000 });
    console.log(chalk.green('  ✓ Inkscape found'));
    
    const testOutput = `/tmp/test-inkscape-${Date.now()}.png`;
    try {
      await execAsync(`inkscape "${filePath}" --export-type=png --export-filename="${testOutput}"`, { timeout: 10000 });
      if (await fs.pathExists(testOutput)) {
        const stats = await fs.stat(testOutput);
        console.log(chalk.green(`  ✓ Conversion succeeded (${(stats.size / 1024).toFixed(2)} KB)`));
        await fs.unlink(testOutput);
      } else {
        console.log(chalk.red('  ✗ Conversion produced no output'));
      }
    } catch (error: any) {
      console.log(chalk.red('  ✗ Conversion failed'));
      if (error.message) {
        console.log(chalk.gray(`    ${error.message.split('\n')[0]}`));
      }
    }
  } catch {
    console.log(chalk.yellow('  ⚠ Inkscape not found'));
  }
}

// Main
const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: npm run diagnose <emf-or-wmf-file>');
  console.log('Example: npm run diagnose image16.wmf');
  process.exit(1);
}

diagnoseFile(filePath).catch(console.error);