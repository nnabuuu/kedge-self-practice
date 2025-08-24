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
    '../../../../../data/knowledge-points-history.xlsx',
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

      // Convert to JSON with default values for empty cells
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, string>[];

      // Variables to track last non-empty values for inheritance
      let lastVolume = '未知册';
      let lastUnit = '未知单元';
      let lastLesson = '未知单课';
      let lastSub = '未知子目';
      let idCounter = 1;

      const result: KnowledgePoint[] = [];

      rows.forEach((row) => {
        // Get raw values, using the column headers from the Excel file
        const rawVolume = row['分册']?.trim();
        const rawUnit = row['单元名称']?.trim();
        const rawLesson = row['单课名称']?.trim();
        const rawSub = row['子目']?.trim();
        let topic = row['知识点']?.trim();

        // Inherit from previous row if current cell is empty
        if (rawVolume) lastVolume = rawVolume;
        if (rawUnit) lastUnit = rawUnit;
        if (rawLesson) lastLesson = rawLesson;
        if (rawSub) lastSub = rawSub;

        // If topic is empty but sub exists, use sub as topic
        if (!topic && rawSub) {
          topic = rawSub;
        }

        // Skip rows without a topic
        if (!topic) {
          this.logger.debug(`Skipping row without topic`);
          return;
        }

        const newKnowledgePoint: KnowledgePoint = {
          id: `kp_${idCounter++}`,
          topic,
          volume: lastVolume,
          unit: lastUnit,
          lesson: lastLesson,
          sub: lastSub,
        };

        result.push(newKnowledgePoint);
      });

      this.knowledgePoints = result;

      this.logger.log(`Loaded ${this.knowledgePoints.length} knowledge points from Excel file`);

      // Log sample data for debugging
      if (this.knowledgePoints.length > 0) {
        this.logger.log(`First knowledge point: ${JSON.stringify(this.knowledgePoints[0])}`);
        this.logger.log(`Last knowledge point: ${JSON.stringify(this.knowledgePoints[this.knowledgePoints.length - 1])}`);

        // Log unique units to verify variety
        const uniqueUnits = new Set(this.knowledgePoints.map(kp => kp.unit));
        this.logger.log(`Unique units loaded: ${uniqueUnits.size}`);
        this.logger.log(`Sample units: ${Array.from(uniqueUnits).slice(0, 5).join(', ')}`);
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

  getAllUnits(): string[] {
    const units = new Set<string>();
    this.knowledgePoints.forEach(point => {
      if (point.unit && point.unit.trim().length > 0) {
        units.add(point.unit);
      }
    });
    return Array.from(units);
  }

  getKnowledgePointsByUnits(units: string[]): KnowledgePoint[] {
    return this.knowledgePoints.filter(point =>
      units.some(unit => point.unit.includes(unit))
    );
  }

  getKnowledgePointById(id: string): KnowledgePoint | null {
    return this.knowledgePoints.find(point => point.id === id) || null;
  }

  getKnowledgePointsByIds(ids: string[]): KnowledgePoint[] {
    return ids.map(id => this.getKnowledgePointById(id)).filter(Boolean) as KnowledgePoint[];
  }
}
