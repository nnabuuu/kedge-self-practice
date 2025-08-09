import { Injectable, Logger } from '@nestjs/common';
import { PersistentService } from '@kedge/persistent';
import { sql } from 'slonik';
import { KnowledgePointSchema, KnowledgePoint } from '@kedge/models';

@Injectable()
export class KnowledgePointRepository {
  private readonly logger = new Logger(KnowledgePointRepository.name);

  constructor(private readonly persistentService: PersistentService) {}

  async createKnowledgePoint(
    data: Omit<KnowledgePoint, 'id'>,
  ): Promise<KnowledgePoint> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(KnowledgePointSchema)`
          INSERT INTO kedge_practice.knowledge_points (
            topic,
            volume,
            unit,
            lesson,
            sub
          )
          VALUES (
            ${data.topic},
            ${data.volume},
            ${data.unit},
            ${data.lesson},
            ${data.sub}
          )
          RETURNING id, topic, volume, unit, lesson, sub
        `,
      );
      return result.rows[0];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating knowledge point: ${errorMessage}`);
      throw new Error('Failed to create knowledge point');
    }
  }

  async findKnowledgePointById(id: string): Promise<KnowledgePoint | null> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(KnowledgePointSchema)`
          SELECT id, topic, volume, unit, lesson, sub
          FROM kedge_practice.knowledge_points
          WHERE id = ${id}
        `,
      );
      return result.rows[0] ?? null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error finding knowledge point by id: ${errorMessage}`);
      throw new Error('Failed to find knowledge point');
    }
  }

  async listKnowledgePoints(): Promise<KnowledgePoint[]> {
    try {
      const result = await this.persistentService.pgPool.query(
        sql.type(KnowledgePointSchema)`
          SELECT id, topic, volume, unit, lesson, sub
          FROM kedge_practice.knowledge_points
        `,
      );
      return [...result.rows];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error listing knowledge points: ${errorMessage}`);
      throw new Error('Failed to list knowledge points');
    }
  }
}
