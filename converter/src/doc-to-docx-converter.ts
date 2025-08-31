/**
 * DOC to DOCX Converter
 * Converts legacy DOC files to modern DOCX format using LibreOffice
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

export class DocToDocxConverter {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', `doc-conversion-${Date.now()}`);
  }

  /**
   * Check if LibreOffice is installed
   */
  async checkDependencies(): Promise<boolean> {
    const commands = [
      'libreoffice --version',
      'soffice --version',
      '/Applications/LibreOffice.app/Contents/MacOS/soffice --version' // macOS
    ];

    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command);
        if (stdout.includes('LibreOffice')) {
          console.log(chalk.green('✓ LibreOffice is installed'));
          return true;
        }
      } catch {
        // Try next command
      }
    }

    console.error(chalk.red('✗ LibreOffice is not installed'));
    console.log(chalk.yellow('LibreOffice is required for DOC to DOCX conversion'));
    console.log(chalk.gray('Installation instructions:'));
    console.log(chalk.gray('  macOS: brew install --cask libreoffice'));
    console.log(chalk.gray('  Ubuntu: sudo apt-get install libreoffice'));
    console.log(chalk.gray('  Windows: Download from https://www.libreoffice.org'));
    return false;
  }

  /**
   * Get the LibreOffice command based on the platform
   */
  private async getLibreOfficeCommand(): Promise<string> {
    const commands = [
      'libreoffice',
      'soffice',
      '/Applications/LibreOffice.app/Contents/MacOS/soffice' // macOS
    ];

    for (const command of commands) {
      try {
        await execAsync(`${command} --version`);
        return command;
      } catch {
        // Try next command
      }
    }

    throw new Error('LibreOffice not found');
  }

  /**
   * Convert DOC to DOCX using LibreOffice
   */
  async convert(inputPath: string, outputDir?: string): Promise<string> {
    const spinner = ora(`Converting ${path.basename(inputPath)} to DOCX`).start();

    try {
      // Validate input
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
      }

      if (!inputPath.toLowerCase().endsWith('.doc')) {
        throw new Error('Input file must be a .doc file');
      }

      // Setup directories
      await fs.ensureDir(this.tempDir);
      const targetDir = outputDir || this.tempDir;
      await fs.ensureDir(targetDir);

      // Get LibreOffice command
      const loCommand = await this.getLibreOfficeCommand();

      // Copy file to temp directory to avoid conflicts
      const tempInputPath = path.join(this.tempDir, path.basename(inputPath));
      await fs.copy(inputPath, tempInputPath);

      // Convert using LibreOffice
      spinner.text = 'Converting with LibreOffice...';
      const command = `${loCommand} --headless --convert-to docx --outdir "${targetDir}" "${tempInputPath}"`;
      
      const { stderr } = await execAsync(command, {
        env: { ...process.env, HOME: process.env.HOME || '/tmp' }
      });

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(stderr);
      }

      // Find output file
      const baseName = path.basename(inputPath, '.doc');
      const outputPath = path.join(targetDir, `${baseName}.docx`);

      if (!await fs.pathExists(outputPath)) {
        throw new Error('Conversion failed - output file not created');
      }

      // Cleanup temp input
      await fs.remove(tempInputPath);

      spinner.succeed(`Converted to DOCX: ${path.basename(outputPath)}`);
      return outputPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(`Failed to convert: ${errorMessage}`);
      throw error;
    } finally {
      // Cleanup temp directory
      try {
        await fs.remove(this.tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Batch convert multiple DOC files
   */
  async batchConvert(files: string[], outputDir?: string): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    console.log(chalk.blue(`Converting ${files.length} DOC files to DOCX...\n`));

    for (const file of files) {
      try {
        const outputPath = await this.convert(file, outputDir);
        results.set(file, outputPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(chalk.red(`Failed to convert ${file}: ${errorMessage}`));
        results.set(file, '');
      }
    }

    return results;
  }

  /**
   * Convert using alternative method (Python with python-docx if available)
   */
  async convertWithPython(inputPath: string, outputPath: string): Promise<void> {
    const pythonScript = `
import sys
try:
    from docx import Document
    import mammoth
    
    with open("${inputPath}", "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        html = result.value
    
    # Convert HTML back to DOCX (simplified)
    doc = Document()
    # This is a simplified conversion - real implementation would parse HTML properly
    doc.add_paragraph(html)
    doc.save("${outputPath}")
    
except ImportError:
    print("Required Python packages not installed", file=sys.stderr)
    sys.exit(1)
`;

    try {
      await execAsync(`python3 -c "${pythonScript}"`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Python conversion failed: ${errorMessage}`);
    }
  }
}