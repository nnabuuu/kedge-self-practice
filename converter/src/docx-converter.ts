/**
 * DOCX/EMF Converter
 * Converts DOCX files with EMF/WMF images to DOCX with PNG images
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

export interface ConversionOptions {
  outputDir?: string;
  keepOriginal?: boolean;
  verbose?: boolean;
  quality?: number;
  background?: string;
  dpi?: number;
}

export class DocxConverter {
  private tempDir: string;
  private convertedImages: Map<string, string> = new Map();
  private imageCommand: string = 'magick'; // Default to v7 syntax

  constructor(private options: ConversionOptions = {}) {
    this.tempDir = path.join(process.cwd(), 'temp', `conversion-${Date.now()}`);
  }

  /**
   * Check if ImageMagick is installed and get the command to use
   */
  async checkDependencies(): Promise<boolean> {
    // Try magick first (v7), then convert (v6)
    const commands = ['magick -version', 'convert -version'];
    
    for (const command of commands) {
      try {
        const { stdout } = await execAsync(command);
        if (stdout.includes('ImageMagick')) {
          console.log(chalk.green('✓ ImageMagick is installed'));
          // Store which command works
          this.imageCommand = command.split(' ')[0];
          return true;
        }
      } catch {
        // Try next command
      }
    }
    
    console.error(chalk.red('✗ ImageMagick is not installed'));
    console.log(chalk.yellow('Please install ImageMagick:'));
    console.log(chalk.gray('  macOS: brew install imagemagick'));
    console.log(chalk.gray('  Ubuntu: sudo apt-get install imagemagick'));
    console.log(chalk.gray('  Windows: Download from https://imagemagick.org'));
    return false;
  }

  /**
   * Convert a single DOCX file
   */
  async convertDocx(inputPath: string): Promise<string> {
    const spinner = ora(`Processing ${path.basename(inputPath)}`).start();

    try {
      // Validate input file
      if (!await fs.pathExists(inputPath)) {
        throw new Error(`File not found: ${inputPath}`);
      }

      if (!inputPath.toLowerCase().endsWith('.docx')) {
        throw new Error('Input file must be a .docx file');
      }

      // Setup directories
      await this.setupDirectories();

      // Extract DOCX
      spinner.text = 'Extracting DOCX contents...';
      const extractPath = path.join(this.tempDir, 'extracted');
      await this.extractDocx(inputPath, extractPath);

      // Find and convert EMF/WMF images
      spinner.text = 'Converting EMF/WMF images to PNG...';
      const mediaPath = path.join(extractPath, 'word', 'media');
      if (await fs.pathExists(mediaPath)) {
        await this.convertImagesInDirectory(mediaPath);
      }

      // Update document relationships
      spinner.text = 'Updating document references...';
      await this.updateDocumentReferences(extractPath);

      // Repackage DOCX
      spinner.text = 'Creating new DOCX file...';
      const outputPath = this.getOutputPath(inputPath);
      await this.packageDocx(extractPath, outputPath);

      // Cleanup
      if (!this.options.keepOriginal) {
        await this.cleanup();
      }

      spinner.succeed(`Converted successfully: ${path.basename(outputPath)}`);
      return outputPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      spinner.fail(`Failed to convert: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Extract DOCX file
   */
  private async extractDocx(docxPath: string, outputDir: string): Promise<void> {
    const zip = new AdmZip(docxPath);
    zip.extractAllTo(outputDir, true);
  }

  /**
   * Convert EMF/WMF images in a directory
   */
  private async convertImagesInDirectory(mediaPath: string): Promise<void> {
    const files = await fs.readdir(mediaPath);
    const emfWmfFiles = files.filter(f => /\.(emf|wmf)$/i.test(f));

    if (emfWmfFiles.length === 0) {
      if (this.options.verbose) {
        console.log(chalk.gray('No EMF/WMF files found'));
      }
      return;
    }

    console.log(chalk.blue(`Found ${emfWmfFiles.length} EMF/WMF files to convert`));

    for (const file of emfWmfFiles) {
      const inputPath = path.join(mediaPath, file);
      const outputName = file.replace(/\.(emf|wmf)$/i, '.png');
      const outputPath = path.join(mediaPath, outputName);

      try {
        await this.convertImage(inputPath, outputPath);
        this.convertedImages.set(file, outputName);
        
        // Delete original EMF/WMF file
        await fs.unlink(inputPath);
        
        if (this.options.verbose) {
          console.log(chalk.green(`  ✓ ${file} → ${outputName}`));
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (this.options.verbose) {
          console.error(chalk.red(`  ✗ Failed to convert ${file}: ${errorMessage}`));
        }
      }
    }
  }

  /**
   * Convert a single EMF/WMF image to PNG using ImageMagick
   */
  private async convertImage(inputPath: string, outputPath: string): Promise<void> {
    // For EMF/WMF, we might need to try different approaches
    const isEmfWmf = inputPath.toLowerCase().endsWith('.emf') || inputPath.toLowerCase().endsWith('.wmf');
    
    // For EMF/WMF, try LibreOffice first if available, as it has better support
    if (isEmfWmf) {
      // Try alternative methods directly for EMF/WMF
      await this.convertEmfWmfAlternative(inputPath, outputPath);
      return;
    }
    
    // For other formats, use ImageMagick
    const command = this.imageCommand === 'magick'
      ? `magick "${inputPath}" -density ${this.options.dpi || 150} -background ${this.options.background || 'white'} -flatten -quality ${this.options.quality || 95} "${outputPath}"`
      : `convert "${inputPath}" -density ${this.options.dpi || 150} -background ${this.options.background || 'white'} -flatten -quality ${this.options.quality || 95} "${outputPath}"`;
    
    if (this.options.verbose) {
      console.log(chalk.gray(`  Running: ${command}`));
    }

    const { stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('Warning') && !stderr.includes('deprecated')) {
      throw new Error(stderr);
    }
  }

  /**
   * Alternative EMF/WMF conversion using various methods
   */
  private async convertEmfWmfAlternative(inputPath: string, outputPath: string): Promise<void> {
    if (this.options.verbose) {
      console.log(chalk.yellow(`  Trying alternative conversion for ${path.basename(inputPath)}...`));
    }
    
    // Method 1: Try using LibreOffice first (most reliable for EMF/WMF)
    const libreOfficeSuccess = await this.tryLibreOfficeConversion(inputPath, outputPath);
    if (libreOfficeSuccess) return;
    
    // Method 2: Skip Inkscape for now due to crashes with certain WMF files
    // const inkscapeSuccess = await this.tryInkscapeConversion(inputPath, outputPath);
    // if (inkscapeSuccess) return;
    
    // Method 3: Try converting through SVG as intermediate format
    const svgPath = inputPath.replace(/\.(emf|wmf)$/i, '.svg');
    
    try {
      // First try to convert to SVG
      const svgCommand = this.imageCommand === 'magick' 
        ? `magick "${inputPath}" "${svgPath}"`
        : `convert "${inputPath}" "${svgPath}"`;
      
      await execAsync(svgCommand);
      
      // Then convert SVG to PNG
      const pngCommand = this.imageCommand === 'magick'
        ? `magick "${svgPath}" -density ${this.options.dpi || 150} -background ${this.options.background || 'white'} -flatten -quality ${this.options.quality || 95} "${outputPath}"`
        : `convert "${svgPath}" -density ${this.options.dpi || 150} -background ${this.options.background || 'white'} -flatten -quality ${this.options.quality || 95} "${outputPath}"`;
      
      await execAsync(pngCommand);
      
      // Clean up intermediate SVG
      await fs.unlink(svgPath);
      
      if (this.options.verbose) {
        console.log(chalk.green(`    ✓ Alternative conversion successful`));
      }
    } catch (error) {
      // If all methods fail, create a placeholder image
      console.warn(chalk.yellow(`    ⚠ Could not convert ${path.basename(inputPath)}, creating placeholder`));
      await this.createPlaceholderImage(outputPath, path.basename(inputPath));
    }
  }

  /**
   * Try to convert using LibreOffice
   */
  private async tryLibreOfficeConversion(inputPath: string, outputPath: string): Promise<boolean> {
    const commands = [
      'soffice',
      'libreoffice',
      '/Applications/LibreOffice.app/Contents/MacOS/soffice'
    ];
    
    if (this.options.verbose) {
      console.log(chalk.gray(`    Trying LibreOffice conversion...`));
    }
    
    for (const cmd of commands) {
      try {
        // Check if command exists first
        await execAsync(`${cmd} --version`, { timeout: 2000 });
        
        if (this.options.verbose) {
          console.log(chalk.gray(`    Found LibreOffice at: ${cmd}`));
        }
        
        // Convert EMF/WMF to PNG directly (LibreOffice 7+ supports this)
        const convertCmd = `${cmd} --headless --convert-to png --outdir "${path.dirname(outputPath)}" "${inputPath}"`;
        
        if (this.options.verbose) {
          console.log(chalk.gray(`    Running: ${convertCmd}`));
        }
        
        const { stderr } = await execAsync(convertCmd, { timeout: 10000 });
        
        // LibreOffice creates output with original name but .png extension
        const expectedOutput = inputPath.replace(/\.(emf|wmf)$/i, '.png');
        
        if (await fs.pathExists(expectedOutput)) {
          // Move to desired output path if different
          if (expectedOutput !== outputPath) {
            await fs.move(expectedOutput, outputPath, { overwrite: true });
          }
          
          if (this.options.verbose) {
            console.log(chalk.green(`    ✓ LibreOffice conversion successful`));
          }
          return true;
        } else if (this.options.verbose) {
          console.log(chalk.yellow(`    LibreOffice conversion produced no output`));
          if (stderr) console.log(chalk.gray(`    stderr: ${stderr}`));
        }
      } catch (error) {
        // Try next command
        if (this.options.verbose) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('command not found')) {
            console.log(chalk.gray(`    LibreOffice error: ${errorMessage.split('\n')[0]}`));
          }
        }
      }
    }
    
    if (this.options.verbose) {
      console.log(chalk.yellow(`    LibreOffice not available or conversion failed`));
    }
    
    return false;
  }

  // /**
  //  * Try to convert using Inkscape (with crash protection)
  //  * Currently disabled due to crashes with certain WMF files
  //  */
  // private async tryInkscapeConversion(inputPath: string, outputPath: string): Promise<boolean> {
  //   try {
  //     // Check if Inkscape is available
  //     await execAsync('inkscape --version', { timeout: 2000 });
      
  //     // Convert EMF/WMF to PNG using Inkscape with timeout to handle crashes
  //     const command = `inkscape "${inputPath}" --export-type=png --export-filename="${outputPath}" --export-dpi=${this.options.dpi || 150}`;
      
  //     if (this.options.verbose) {
  //       console.log(chalk.gray(`    Trying Inkscape conversion...`));
  //     }
      
  //     // Use shorter timeout and catch crashes
  //     await execAsync(command, { timeout: 5000 });
      
  //     if (await fs.pathExists(outputPath)) {
  //       if (this.options.verbose) {
  //         console.log(chalk.green(`    ✓ Inkscape conversion successful`));
  //       }
  //       return true;
  //     }
  //   } catch (error) {
  //     // Inkscape not available, crashed, or conversion failed
  //     if (this.options.verbose) {
  //       const errorMessage = error instanceof Error ? error.message : String(error);
  //       if (errorMessage.includes('timeout') || errorMessage.includes('signal')) {
  //         console.log(chalk.yellow(`    ⚠ Inkscape crashed or timed out`));
  //       }
  //     }
  //   }
    
  //   return false;
  // }

  /**
   * Create a placeholder image when conversion fails
   */
  private async createPlaceholderImage(outputPath: string, originalName: string): Promise<void> {
    // Create a simple placeholder using ImageMagick
    const command = this.imageCommand === 'magick'
      ? `magick -size 400x300 xc:lightgray -gravity center -pointsize 20 -annotate +0+0 "EMF/WMF Image\n${originalName}\n(Conversion Failed)" "${outputPath}"`
      : `convert -size 400x300 xc:lightgray -gravity center -pointsize 20 -annotate +0+0 "EMF/WMF Image\n${originalName}\n(Conversion Failed)" "${outputPath}"`;
    
    try {
      await execAsync(command);
    } catch (error) {
      // If even placeholder fails, create empty file
      await fs.writeFile(outputPath, '');
    }
  }

  /**
   * Update document references from EMF/WMF to PNG
   */
  private async updateDocumentReferences(extractPath: string): Promise<void> {
    // Update relationships files
    const relsPath = path.join(extractPath, 'word', '_rels', 'document.xml.rels');
    if (await fs.pathExists(relsPath)) {
      await this.updateRelationships(relsPath);
    }

    // Update content types
    const contentTypesPath = path.join(extractPath, '[Content_Types].xml');
    if (await fs.pathExists(contentTypesPath)) {
      await this.updateContentTypes(contentTypesPath);
    }

    // Update document.xml
    const documentPath = path.join(extractPath, 'word', 'document.xml');
    if (await fs.pathExists(documentPath)) {
      await this.updateDocument(documentPath);
    }
  }

  /**
   * Update relationships file
   */
  private async updateRelationships(relsPath: string): Promise<void> {
    let content = await fs.readFile(relsPath, 'utf-8');
    
    for (const [oldName, newName] of this.convertedImages.entries()) {
      const oldRef = `media/${oldName}`;
      const newRef = `media/${newName}`;
      content = content.replace(new RegExp(this.escapeRegExp(oldRef), 'g'), newRef);
    }
    
    await fs.writeFile(relsPath, content);
  }

  /**
   * Update content types file
   */
  private async updateContentTypes(contentTypesPath: string): Promise<void> {
    let content = await fs.readFile(contentTypesPath, 'utf-8');
    
    // Remove EMF/WMF content type declarations
    content = content.replace(/<Default Extension="emf"[^>]*\/>/g, '');
    content = content.replace(/<Default Extension="wmf"[^>]*\/>/g, '');
    
    // Add PNG content type if not present
    if (!content.includes('Extension="png"')) {
      const defaultsEnd = content.lastIndexOf('</Default>');
      if (defaultsEnd !== -1) {
        const insertion = '</Default>\n<Default Extension="png" ContentType="image/png"/>';
        content = content.substring(0, defaultsEnd + 10) + 
                 insertion.substring(10) + 
                 content.substring(defaultsEnd + 10);
      }
    }
    
    // Update specific overrides
    for (const [oldName, newName] of this.convertedImages.entries()) {
      const oldPath = `/word/media/${oldName}`;
      const newPath = `/word/media/${newName}`;
      content = content.replace(
        new RegExp(`PartName="${this.escapeRegExp(oldPath)}"[^>]*>`, 'g'),
        `PartName="${newPath}" ContentType="image/png">`
      );
    }
    
    await fs.writeFile(contentTypesPath, content);
  }

  /**
   * Update document.xml
   */
  private async updateDocument(documentPath: string): Promise<void> {
    let content = await fs.readFile(documentPath, 'utf-8');
    
    // Update image references in drawing elements
    for (const [oldName, _newName] of this.convertedImages.entries()) {
      // Update r:embed references
      const embedPattern = new RegExp(
        `r:embed="([^"]*${this.escapeRegExp(oldName.replace(/\.(emf|wmf)$/i, ''))}[^"]*)"`,
        'g'
      );
      content = content.replace(embedPattern, (_match, id) => {
        return `r:embed="${id}"`;
      });
      
      // Update a:blip references
      const blipPattern = new RegExp(
        `<a:blip[^>]*r:embed="([^"]*)"[^>]*/>`,
        'g'
      );
      content = content.replace(blipPattern, (match) => {
        return match; // Keep as is, relationships handle the actual mapping
      });
    }
    
    await fs.writeFile(documentPath, content);
  }

  /**
   * Package directory back into DOCX
   */
  private async packageDocx(sourcePath: string, outputPath: string): Promise<void> {
    const zip = new AdmZip();
    
    const addToZip = async (dir: string, zipPath: string = '') => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          await addToZip(itemPath, path.join(zipPath, item));
        } else {
          const content = await fs.readFile(itemPath);
          zip.addFile(path.join(zipPath, item), content);
        }
      }
    };
    
    await addToZip(sourcePath);
    zip.writeZip(outputPath);
  }

  /**
   * Get output file path
   */
  private getOutputPath(inputPath: string): string {
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'output');
    const baseName = path.basename(inputPath, '.docx');
    const outputName = `${baseName}_converted.docx`;
    return path.join(outputDir, outputName);
  }

  /**
   * Setup required directories
   */
  private async setupDirectories(): Promise<void> {
    await fs.ensureDir(this.tempDir);
    const outputDir = this.options.outputDir || path.join(process.cwd(), 'output');
    await fs.ensureDir(outputDir);
  }

  /**
   * Cleanup temporary files
   */
  private async cleanup(): Promise<void> {
    try {
      await fs.remove(this.tempDir);
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not clean up temp files'));
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}