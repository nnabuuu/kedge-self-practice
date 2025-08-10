import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { KnowledgePointRepository } from './knowledge-point.repository';
import { KnowledgePointServiceProvider } from './knowledge-point.service';

@Module({
  imports: [PersistentModule],
  providers: [KnowledgePointRepository, KnowledgePointServiceProvider],
  exports: [KnowledgePointServiceProvider],
})
export class KnowledgePointModule {}
