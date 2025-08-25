import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KnowledgePoint } from '@kedge/models';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';

@Injectable()
export class KnowledgePointStorage implements OnModuleInit {
  private readonly logger = new Logger(KnowledgePointStorage.name);
  private knowledgePoints: KnowledgePoint[] = [];

  constructor(private readonly persistentService: PersistentService) {}

  async onModuleInit() {
    await this.loadKnowledgePoints();
  }

  async loadKnowledgePoints(): Promise<void> {
    try {
      // Load knowledge points from database
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT 
            id,
            topic,
            volume,
            unit,
            lesson,
            sub
          FROM kedge_practice.knowledge_points
          ORDER BY id
        `
      );

      this.knowledgePoints = result.rows.map(row => ({
        id: row.id,
        topic: row.topic,
        volume: row.volume || '',
        unit: row.unit || '',
        lesson: row.lesson || '',
        sub: row.sub || '',
      }));

      this.logger.log(`Loaded ${this.knowledgePoints.length} knowledge points from database`);

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
      this.logger.error('Failed to load knowledge points from database', error);
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
