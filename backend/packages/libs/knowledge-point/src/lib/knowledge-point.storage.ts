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
      // Load knowledge points from database, ordered by sort_index for proper Chinese ordinal sorting
      const result = await this.persistentService.pgPool.query(
        sql.unsafe`
          SELECT
            id,
            topic,
            volume,
            unit,
            lesson,
            sub,
            subject_id,
            sort_index
          FROM kedge_practice.knowledge_points
          ORDER BY volume ASC, CAST(SUBSTRING(id FROM 4) AS INTEGER) ASC
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
        sort_index: row.sort_index ?? 0,
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
    // Preserve order from database (by sort_index) using first occurrence
    const volumeOrder: string[] = [];
    const seen = new Set<string>();
    this.knowledgePoints.forEach(point => {
      if (point.volume && point.volume.trim().length > 0 && !seen.has(point.volume)) {
        seen.add(point.volume);
        volumeOrder.push(point.volume);
      }
    });
    return volumeOrder;
  }

  getAllLessons(volume?: string, unit?: string): string[] {
    // Preserve order from database (by sort_index) using first occurrence
    const lessonOrder: string[] = [];
    const seen = new Set<string>();
    let points = this.knowledgePoints;

    if (volume) {
      points = points.filter(p => p.volume === volume);
    }
    if (unit) {
      points = points.filter(p => p.unit === unit);
    }

    points.forEach(point => {
      if (point.lesson && point.lesson.trim().length > 0 && !seen.has(point.lesson)) {
        seen.add(point.lesson);
        lessonOrder.push(point.lesson);
      }
    });
    return lessonOrder;
  }

  getAllSubs(volume?: string, unit?: string, lesson?: string): string[] {
    // Preserve order from database (by sort_index) using first occurrence
    const subOrder: string[] = [];
    const seen = new Set<string>();
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
      if (point.sub && point.sub.trim().length > 0 && !seen.has(point.sub)) {
        seen.add(point.sub);
        subOrder.push(point.sub);
      }
    });
    return subOrder;
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

    // Extract unique values at each level, preserving order from database (by sort_index)
    const volumeOrder: string[] = [];
    const unitOrder: string[] = [];
    const lessonOrder: string[] = [];
    const subOrder: string[] = [];
    const seenVolumes = new Set<string>();
    const seenUnits = new Set<string>();
    const seenLessons = new Set<string>();
    const seenSubs = new Set<string>();

    points.forEach(point => {
      if (point.volume && !seenVolumes.has(point.volume)) {
        seenVolumes.add(point.volume);
        volumeOrder.push(point.volume);
      }
      if (point.unit && !seenUnits.has(point.unit)) {
        seenUnits.add(point.unit);
        unitOrder.push(point.unit);
      }
      if (point.lesson && !seenLessons.has(point.lesson)) {
        seenLessons.add(point.lesson);
        lessonOrder.push(point.lesson);
      }
      if (point.sub && !seenSubs.has(point.sub)) {
        seenSubs.add(point.sub);
        subOrder.push(point.sub);
      }
    });

    return {
      volumes: volumeOrder,
      units: unitOrder,
      lessons: lessonOrder,
      subs: subOrder,
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
