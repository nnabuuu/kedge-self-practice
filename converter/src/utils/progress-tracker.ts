/**
 * Progress tracking for batch conversions
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';

export interface ConversionStats {
  totalFiles: number;
  processedFiles: number;
  successCount: number;
  failCount: number;
  totalImages: number;
  convertedImages: number;
  placeholderImages: number;
  startTime: number;
  errors: Array<{ file: string; error: string }>;
}

export class ProgressTracker {
  private stats: ConversionStats;
  private spinner?: Ora;
  private verbose: boolean;

  constructor(totalFiles: number, verbose = false) {
    this.verbose = verbose;
    this.stats = {
      totalFiles,
      processedFiles: 0,
      successCount: 0,
      failCount: 0,
      totalImages: 0,
      convertedImages: 0,
      placeholderImages: 0,
      startTime: Date.now(),
      errors: []
    };
  }

  startFile(fileName: string): void {
    if (this.spinner) {
      this.spinner.stop();
    }
    this.spinner = ora({
      text: `Processing ${fileName} (${this.stats.processedFiles + 1}/${this.stats.totalFiles})`,
      prefixText: chalk.blue(`[${this.getProgress()}%]`)
    }).start();
  }

  updateImages(total: number, converted: number, placeholders: number): void {
    this.stats.totalImages += total;
    this.stats.convertedImages += converted;
    this.stats.placeholderImages += placeholders;
    
    if (this.spinner) {
      this.spinner.text = `Converting ${total} images...`;
    }
  }

  fileSuccess(fileName: string): void {
    this.stats.processedFiles++;
    this.stats.successCount++;
    
    if (this.spinner) {
      this.spinner.succeed(chalk.green(`✓ ${fileName}`));
    }
  }

  fileError(fileName: string, error: string): void {
    this.stats.processedFiles++;
    this.stats.failCount++;
    this.stats.errors.push({ file: fileName, error });
    
    if (this.spinner) {
      this.spinner.fail(chalk.red(`✗ ${fileName}: ${error}`));
    }
  }

  private getProgress(): number {
    return Math.round((this.stats.processedFiles / this.stats.totalFiles) * 100);
  }

  private getElapsedTime(): string {
    const elapsed = Date.now() - this.stats.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  // Commented out for future use
  // private getEstimatedTime(): string {
  //   if (this.stats.processedFiles === 0) return 'calculating...';
    
  //   const elapsed = Date.now() - this.stats.startTime;
  //   const avgTimePerFile = elapsed / this.stats.processedFiles;
  //   const remainingFiles = this.stats.totalFiles - this.stats.processedFiles;
  //   const estimatedRemaining = avgTimePerFile * remainingFiles;
    
  //   const seconds = Math.floor(estimatedRemaining / 1000);
  //   const minutes = Math.floor(seconds / 60);
    
  //   if (minutes > 0) {
  //     return `${minutes}m ${seconds % 60}s`;
  //   }
  //   return `${seconds}s`;
  // }

  printSummary(): void {
    console.log('\n' + chalk.bold('═'.repeat(50)));
    console.log(chalk.bold.cyan('Conversion Summary'));
    console.log(chalk.bold('═'.repeat(50)));
    
    // Files
    console.log(chalk.bold('\nFiles:'));
    console.log(`  Total:      ${this.stats.totalFiles}`);
    console.log(chalk.green(`  Success:    ${this.stats.successCount}`));
    if (this.stats.failCount > 0) {
      console.log(chalk.red(`  Failed:     ${this.stats.failCount}`));
    }
    
    // Images
    if (this.stats.totalImages > 0) {
      console.log(chalk.bold('\nImages:'));
      console.log(`  Total EMF/WMF:  ${this.stats.totalImages}`);
      console.log(chalk.green(`  Converted:      ${this.stats.convertedImages}`));
      if (this.stats.placeholderImages > 0) {
        console.log(chalk.yellow(`  Placeholders:   ${this.stats.placeholderImages}`));
      }
    }
    
    // Time
    console.log(chalk.bold('\nTime:'));
    console.log(`  Elapsed:    ${this.getElapsedTime()}`);
    console.log(`  Avg/file:   ${Math.round((Date.now() - this.stats.startTime) / this.stats.processedFiles)}ms`);
    
    // Errors
    if (this.stats.errors.length > 0 && this.verbose) {
      console.log(chalk.bold.red('\nErrors:'));
      this.stats.errors.forEach(({ file, error }) => {
        console.log(chalk.red(`  ${file}:`));
        console.log(chalk.gray(`    ${error}`));
      });
    }
    
    console.log(chalk.bold('═'.repeat(50)) + '\n');
    
    // Final status
    if (this.stats.failCount === 0) {
      console.log(chalk.bold.green('✓ All conversions completed successfully!'));
    } else if (this.stats.successCount > 0) {
      console.log(chalk.bold.yellow(`⚠ Completed with ${this.stats.failCount} error(s)`));
    } else {
      console.log(chalk.bold.red('✗ All conversions failed'));
    }
  }

  getStats(): ConversionStats {
    return { ...this.stats };
  }
}