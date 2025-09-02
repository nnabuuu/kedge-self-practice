#!/usr/bin/env node

/**
 * DOCX/EMF Converter CLI
 * Convert old DOC/DOCX files with EMF/WMF images to modern DOCX with PNG images
 */

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import { DocxConverter } from './docx-converter';
import { DocToDocxConverter } from './doc-to-docx-converter';

const program = new Command();

program
  .name('docx-converter')
  .description('Convert old DOC/DOCX files with EMF/WMF images to modern DOCX with PNG images')
  .version('1.0.0');

program
  .command('convert <input>')
  .description('Convert a single file or directory of files')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-r, --recursive', 'Process directories recursively', false)
  .option('-k, --keep-original', 'Keep temporary files for debugging', false)
  .option('-v, --verbose', 'Show detailed conversion logs', false)
  .option('-q, --quality <number>', 'PNG quality (1-100)', '95')
  .option('-d, --dpi <number>', 'Image DPI for conversion', '150')
  .option('-b, --background <color>', 'Background color for transparent images', 'white')
  .option('--doc-to-docx', 'Also convert DOC files to DOCX', false)
  .action(async (input: string, options) => {
    try {
      // Check dependencies
      const converter = new DocxConverter({
        outputDir: options.output,
        keepOriginal: options.keepOriginal,
        verbose: options.verbose,
        quality: parseInt(options.quality),
        dpi: parseInt(options.dpi),
        background: options.background,
      });

      const hasImageMagick = await converter.checkDependencies();
      if (!hasImageMagick) {
        process.exit(1);
      }

      // Check for LibreOffice if DOC conversion is requested
      if (options.docToDocx) {
        const docConverter = new DocToDocxConverter();
        const hasLibreOffice = await docConverter.checkDependencies();
        if (!hasLibreOffice) {
          process.exit(1);
        }
      }

      // Get list of files to process
      const files = await getFilesToProcess(input, options.recursive, options.docToDocx);
      
      if (files.length === 0) {
        console.log(chalk.yellow('No files found to process'));
        return;
      }

      console.log(chalk.blue(`Found ${files.length} file(s) to process\n`));

      // Process each file
      let successCount = 0;
      let failCount = 0;
      const results: Array<{ file: string; output?: string; error?: string }> = [];

      for (const file of files) {
        try {
          let fileToConvert = file;
          
          // Convert DOC to DOCX first if needed
          if (options.docToDocx && file.toLowerCase().endsWith('.doc') && !file.toLowerCase().endsWith('.docx')) {
            const docConverter = new DocToDocxConverter();
            console.log(chalk.cyan(`Converting DOC to DOCX: ${path.basename(file)}`));
            fileToConvert = await docConverter.convert(file, options.output);
          }
          
          // Convert DOCX with EMF/WMF to PNG
          if (fileToConvert.toLowerCase().endsWith('.docx')) {
            const outputPath = await converter.convertDocx(fileToConvert);
            successCount++;
            results.push({ file, output: outputPath });
          }
        } catch (error) {
          failCount++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({ file, error: errorMessage });
          if (options.verbose) {
            console.error(chalk.red(`Error processing ${file}:`), error);
          }
        }
      }

      // Print summary
      console.log('\n' + chalk.bold('Conversion Summary:'));
      console.log(chalk.green(`✓ Success: ${successCount} file(s)`));
      if (failCount > 0) {
        console.log(chalk.red(`✗ Failed: ${failCount} file(s)`));
      }

      // Show results details if verbose
      if (options.verbose && results.length > 0) {
        console.log('\nDetails:');
        results.forEach(result => {
          if (result.output) {
            console.log(chalk.green(`  ✓ ${result.file} → ${result.output}`));
          } else if (result.error) {
            console.log(chalk.red(`  ✗ ${result.file}: ${result.error}`));
          }
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('Check if all required dependencies are installed')
  .action(async () => {
    console.log(chalk.bold('Checking dependencies...\n'));
    
    const converter = new DocxConverter();
    const hasImageMagick = await converter.checkDependencies();
    
    const docConverter = new DocToDocxConverter();
    const hasLibreOffice = await docConverter.checkDependencies();
    
    console.log('\n' + chalk.bold('Summary:'));
    if (hasImageMagick && hasLibreOffice) {
      console.log(chalk.green('✓ All dependencies are installed'));
    } else {
      console.log(chalk.yellow('⚠ Some dependencies are missing'));
      console.log(chalk.gray('Install missing dependencies to use all features'));
    }
  });

program
  .command('batch <pattern>')
  .description('Batch convert files matching a glob pattern')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-p, --parallel <number>', 'Number of parallel conversions', '1')
  .option('-v, --verbose', 'Show detailed conversion logs', false)
  .option('--doc-to-docx', 'Also convert DOC files to DOCX', false)
  .action(async (pattern: string, options) => {
    try {
      const files = glob.sync(pattern);
      
      if (files.length === 0) {
        console.log(chalk.yellow(`No files matching pattern: ${pattern}`));
        return;
      }

      console.log(chalk.blue(`Found ${files.length} file(s) matching pattern\n`));

      // Create converter instances
      const converters: DocxConverter[] = [];
      const parallelCount = parseInt(options.parallel);
      
      for (let i = 0; i < parallelCount; i++) {
        converters.push(new DocxConverter({
          outputDir: options.output,
          verbose: options.verbose,
        }));
      }

      // Check dependencies
      const hasImageMagick = await converters[0].checkDependencies();
      if (!hasImageMagick) {
        process.exit(1);
      }

      // Process files in batches
      const batchSize = Math.ceil(files.length / parallelCount);
      const promises: Promise<void>[] = [];

      for (let i = 0; i < parallelCount; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, files.length);
        const batch = files.slice(start, end);
        
        if (batch.length > 0) {
          promises.push(processBatch(batch, converters[i], options));
        }
      }

      await Promise.all(promises);
      console.log(chalk.green('\n✓ Batch conversion completed'));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red('Error:'), errorMessage);
      process.exit(1);
    }
  });

async function getFilesToProcess(input: string, recursive: boolean, includeDoc: boolean): Promise<string[]> {
  const stats = await fs.stat(input);
  
  if (stats.isFile()) {
    const ext = path.extname(input).toLowerCase();
    if (ext === '.docx' || (includeDoc && ext === '.doc')) {
      return [path.resolve(input)];
    }
    return [];
  }
  
  if (stats.isDirectory()) {
    const patterns = ['*.docx'];
    if (includeDoc) {
      patterns.push('*.doc');
    }
    
    const globPattern = recursive 
      ? `${input}/**/{${patterns.join(',')}}` 
      : `${input}/${patterns.length > 1 ? `{${patterns.join(',')}}` : patterns[0]}`;
    
    return glob.sync(globPattern).map(f => path.resolve(f));
  }
  
  return [];
}

async function processBatch(
  files: string[], 
  converter: DocxConverter, 
  options: any
): Promise<void> {
  for (const file of files) {
    try {
      let fileToConvert = file;
      
      // Convert DOC to DOCX first if needed
      if (options.docToDocx && file.toLowerCase().endsWith('.doc') && !file.toLowerCase().endsWith('.docx')) {
        const docConverter = new DocToDocxConverter();
        fileToConvert = await docConverter.convert(file, options.output);
      }
      
      // Convert DOCX
      if (fileToConvert.toLowerCase().endsWith('.docx')) {
        await converter.convertDocx(fileToConvert);
      }
    } catch (error) {
      if (options.verbose) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`Failed: ${file} - ${errorMessage}`));
      }
    }
  }
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}