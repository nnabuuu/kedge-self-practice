import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KnowledgePoint } from '@kedge/models';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class KnowledgePointStorage implements OnModuleInit {
  private readonly logger = new Logger(KnowledgePointStorage.name);
  private knowledgePoints: KnowledgePoint[] = [];
  private readonly dataFilePath = path.join(
    __dirname,
    '../../../../../data/历史知识点.xlsx',
  );

  async onModuleInit() {
    await this.loadKnowledgePoints();
  }

  async loadKnowledgePoints(): Promise<void> {
    try {
      if (!fs.existsSync(this.dataFilePath)) {
        this.logger.warn(`Knowledge point data file not found: ${this.dataFilePath}`);
        return;
      }

      const workbook = XLSX.readFile(this.dataFilePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON, skipping header row
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip header row and process data
      const dataRows = rawData.slice(1) as string[][];
      
      this.knowledgePoints = dataRows
        .filter(row => row.length >= 5 && row.some(cell => cell && cell.toString().trim()))
        .map((row, index) => ({
          id: `kp_${index + 1}`,
          volume: this.sanitizeCell(row[0]) || '',
          unit: this.sanitizeCell(row[1]) || '',
          lesson: this.sanitizeCell(row[2]) || '',
          sub: this.sanitizeCell(row[3]) || '',
          topic: this.sanitizeCell(row[4]) || '',
        }))
        .filter(point => point.topic.trim().length > 0);

      this.logger.log(`Loaded ${this.knowledgePoints.length} knowledge points from Excel file`);
      
      // Log sample data for debugging
      if (this.knowledgePoints.length > 0) {
        this.logger.debug(`Sample knowledge point: ${JSON.stringify(this.knowledgePoints[0])}`);
      }
    } catch (error) {
      this.logger.error('Failed to load knowledge points from Excel file', error);
    }
  }

  private sanitizeCell(cell: any): string {
    if (cell === null || cell === undefined) {
      return '';
    }
    return cell.toString().trim();
  }

  getAllKnowledgePoints(): KnowledgePoint[] {
    return [...this.knowledgePoints];
  }

  findKnowledgePointById(id: string): KnowledgePoint | null {
    return this.knowledgePoints.find(point => point.id === id) || null;
  }

  searchKnowledgePoints(query: string, limit: number = 50): KnowledgePoint[] {
    if (!query || query.trim().length === 0) {
      return this.knowledgePoints.slice(0, limit);
    }

    const searchTerm = query.toLowerCase().trim();
    
    return this.knowledgePoints
      .filter(point => 
        point.topic.toLowerCase().includes(searchTerm) ||
        point.unit.toLowerCase().includes(searchTerm) ||
        point.lesson.toLowerCase().includes(searchTerm) ||
        point.sub.toLowerCase().includes(searchTerm) ||
        point.volume.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  }

  getKnowledgePointsByVolume(volume: string): KnowledgePoint[] {
    return this.knowledgePoints.filter(point => 
      point.volume.toLowerCase().includes(volume.toLowerCase())
    );
  }

  getKnowledgePointsByUnit(unit: string): KnowledgePoint[] {
    return this.knowledgePoints.filter(point => 
      point.unit.toLowerCase().includes(unit.toLowerCase())
    );
  }

  getKnowledgePointStats(): {
    total: number;
    byVolume: Record<string, number>;
    byUnit: Record<string, number>;
  } {
    const stats = {
      total: this.knowledgePoints.length,
      byVolume: {} as Record<string, number>,
      byUnit: {} as Record<string, number>,
    };

    this.knowledgePoints.forEach(point => {
      // Count by volume
      if (point.volume) {
        stats.byVolume[point.volume] = (stats.byVolume[point.volume] || 0) + 1;
      }

      // Count by unit
      if (point.unit) {
        stats.byUnit[point.unit] = (stats.byUnit[point.unit] || 0) + 1;
      }
    });

    return stats;
  }

  async reloadKnowledgePoints(): Promise<void> {
    this.knowledgePoints = [];
    await this.loadKnowledgePoints();
  }
}