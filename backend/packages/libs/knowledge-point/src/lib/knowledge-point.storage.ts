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
            sub,
            subject_id
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
        subject_id: row.subject_id || '',
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

  getAllVolumes(): string[] {
    const volumes = new Set<string>();
    this.knowledgePoints.forEach(point => {
      if (point.volume && point.volume.trim().length > 0) {
        volumes.add(point.volume);
      }
    });
    return Array.from(volumes).sort();
  }

  getAllLessons(volume?: string, unit?: string): string[] {
    const lessons = new Set<string>();
    let points = this.knowledgePoints;
    
    if (volume) {
      points = points.filter(p => p.volume === volume);
    }
    if (unit) {
      points = points.filter(p => p.unit === unit);
    }
    
    points.forEach(point => {
      if (point.lesson && point.lesson.trim().length > 0) {
        lessons.add(point.lesson);
      }
    });
    return Array.from(lessons).sort();
  }

  getAllSubs(volume?: string, unit?: string, lesson?: string): string[] {
    const subs = new Set<string>();
    let points = this.knowledgePoints;
    
    if (volume) {
      points = points.filter(p => p.volume === volume);
    }
    if (unit) {
      points = points.filter(p => p.unit === unit);
    }
    if (lesson) {
      points = points.filter(p => p.lesson === lesson);
    }
    
    points.forEach(point => {
      if (point.sub && point.sub.trim().length > 0) {
        subs.add(point.sub);
      }
    });
    return Array.from(subs).sort();
  }

  getHierarchyOptions(filters?: {
    volume?: string;
    unit?: string;
    lesson?: string;
  }): {
    volumes: string[];
    units: string[];
    lessons: string[];
    subs: string[];
  } {
    let points = this.knowledgePoints;
    
    // Apply filters progressively
    if (filters?.volume) {
      points = points.filter(p => p.volume === filters.volume);
    }
    if (filters?.unit) {
      points = points.filter(p => p.unit === filters.unit);
    }
    if (filters?.lesson) {
      points = points.filter(p => p.lesson === filters.lesson);
    }
    
    // Extract unique values at each level
    const volumes = new Set<string>();
    const units = new Set<string>();
    const lessons = new Set<string>();
    const subs = new Set<string>();
    
    points.forEach(point => {
      if (point.volume) volumes.add(point.volume);
      if (point.unit) units.add(point.unit);
      if (point.lesson) lessons.add(point.lesson);
      if (point.sub) subs.add(point.sub);
    });
    
    return {
      volumes: Array.from(volumes).sort(),
      units: Array.from(units).sort(),
      lessons: Array.from(lessons).sort(),
      subs: Array.from(subs).sort(),
    };
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
