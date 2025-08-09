import { KnowledgePoint } from '@kedge/models';

export abstract class KnowledgePointService {
  abstract createKnowledgePoint(
    data: Omit<KnowledgePoint, 'id'>,
  ): Promise<KnowledgePoint>;

  abstract findKnowledgePointById(id: string): Promise<KnowledgePoint | null>;

  abstract listKnowledgePoints(): Promise<KnowledgePoint[]>;
}
