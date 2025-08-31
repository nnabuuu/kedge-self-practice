/**
 * Generate conversion reports in various formats
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export interface ConversionResult {
  inputFile: string;
  outputFile?: string;
  success: boolean;
  error?: string;
  images?: {
    total: number;
    converted: number;
    placeholders: number;
    details: Array<{
      name: string;
      status: 'converted' | 'placeholder' | 'failed';
      originalFormat: string;
      newFormat?: string;
      size?: number;
    }>;
  };
  processingTime?: number;
}

export class ReportGenerator {
  private results: ConversionResult[] = [];
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  addResult(result: ConversionResult): void {
    this.results.push(result);
  }

  async generateReport(format: 'json' | 'html' | 'csv' = 'json'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportName = `conversion-report-${timestamp}`;
    
    await fs.ensureDir(path.join(this.outputDir, 'reports'));
    
    switch (format) {
      case 'json':
        return this.generateJsonReport(reportName);
      case 'html':
        return this.generateHtmlReport(reportName);
      case 'csv':
        return this.generateCsvReport(reportName);
      default:
        return this.generateJsonReport(reportName);
    }
  }

  private async generateJsonReport(name: string): Promise<string> {
    const reportPath = path.join(this.outputDir, 'reports', `${name}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.length,
        successCount: this.results.filter(r => r.success).length,
        failCount: this.results.filter(r => !r.success).length,
        totalImages: this.results.reduce((sum, r) => sum + (r.images?.total || 0), 0),
        convertedImages: this.results.reduce((sum, r) => sum + (r.images?.converted || 0), 0),
        placeholderImages: this.results.reduce((sum, r) => sum + (r.images?.placeholders || 0), 0)
      },
      results: this.results
    };
    
    await fs.writeJson(reportPath, report, { spaces: 2 });
    console.log(chalk.green(`Report saved to: ${reportPath}`));
    return reportPath;
  }

  private async generateHtmlReport(name: string): Promise<string> {
    const reportPath = path.join(this.outputDir, 'reports', `${name}.html`);
    
    const successCount = this.results.filter(r => r.success).length;
    const failCount = this.results.filter(r => !r.success).length;
    
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>DOCX Conversion Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .success { color: green; }
        .failed { color: red; }
        .warning { color: orange; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
        th { background: #4CAF50; color: white; }
        tr:nth-child(even) { background: #f2f2f2; }
        .status-success { background: #d4edda; }
        .status-failed { background: #f8d7da; }
    </style>
</head>
<body>
    <h1>DOCX/EMF Conversion Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Files: ${this.results.length}</p>
        <p class="success">Successful: ${successCount}</p>
        <p class="failed">Failed: ${failCount}</p>
    </div>
    
    <h2>Conversion Details</h2>
    <table>
        <thead>
            <tr>
                <th>Input File</th>
                <th>Status</th>
                <th>Images</th>
                <th>Output File</th>
                <th>Error</th>
            </tr>
        </thead>
        <tbody>
            ${this.results.map(r => `
            <tr class="${r.success ? 'status-success' : 'status-failed'}">
                <td>${path.basename(r.inputFile)}</td>
                <td>${r.success ? '✓ Success' : '✗ Failed'}</td>
                <td>${r.images ? `${r.images.converted}/${r.images.total} converted` : 'N/A'}</td>
                <td>${r.outputFile ? path.basename(r.outputFile) : 'N/A'}</td>
                <td>${r.error || '-'}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
    
    <h2>Image Conversion Details</h2>
    ${this.generateImageDetailsHtml()}
</body>
</html>`;
    
    await fs.writeFile(reportPath, html);
    console.log(chalk.green(`HTML report saved to: ${reportPath}`));
    return reportPath;
  }

  private generateImageDetailsHtml(): string {
    const imageResults = this.results.filter(r => r.images && r.images.total > 0);
    
    if (imageResults.length === 0) {
      return '<p>No EMF/WMF images found in processed files.</p>';
    }
    
    return `<table>
        <thead>
            <tr>
                <th>File</th>
                <th>Image Name</th>
                <th>Original Format</th>
                <th>Status</th>
                <th>New Format</th>
            </tr>
        </thead>
        <tbody>
            ${imageResults.map(r => 
              r.images!.details.map(img => `
                <tr>
                    <td>${path.basename(r.inputFile)}</td>
                    <td>${img.name}</td>
                    <td>${img.originalFormat.toUpperCase()}</td>
                    <td class="${img.status === 'converted' ? 'success' : 'warning'}">${img.status}</td>
                    <td>${img.newFormat || 'N/A'}</td>
                </tr>
              `).join('')
            ).join('')}
        </tbody>
    </table>`;
  }

  private async generateCsvReport(name: string): Promise<string> {
    const reportPath = path.join(this.outputDir, 'reports', `${name}.csv`);
    
    const headers = ['Input File', 'Status', 'Images Total', 'Images Converted', 'Output File', 'Error'];
    const rows = this.results.map(r => [
      r.inputFile,
      r.success ? 'Success' : 'Failed',
      r.images?.total || 0,
      r.images?.converted || 0,
      r.outputFile || '',
      r.error || ''
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    await fs.writeFile(reportPath, csv);
    console.log(chalk.green(`CSV report saved to: ${reportPath}`));
    return reportPath;
  }
}