import { Injectable } from '@nestjs/common';
import { KnowledgePointService } from './knowledge-point.interface';
import { KnowledgePointRepository } from './knowledge-point.repository';
import { KnowledgePoint } from '@kedge/models';

@Injectable()
export class DefaultKnowledgePointService implements KnowledgePointService {
  constructor(private readonly repository: KnowledgePointRepository) {}

  createKnowledgePoint(
    data: Omit<KnowledgePoint, 'id'>,
  ): Promise<KnowledgePoint> {
    return this.repository.createKnowledgePoint(data);
  }

  findKnowledgePointById(id: string): Promise<KnowledgePoint | null> {
    return this.repository.findKnowledgePointById(id);
  }

  listKnowledgePoints(): Promise<KnowledgePoint[]> {
    return this.repository.listKnowledgePoints();
  }
}

export const KnowledgePointServiceProvider = {
  provide: KnowledgePointService,
  useClass: DefaultKnowledgePointService,
};
