import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { ConfigsModule } from '@kedge/configs';
import { KnowledgePointRepository } from './knowledge-point.repository';
import { KnowledgePointServiceProvider } from './knowledge-point.service';
import { KnowledgePointGPTService } from './knowledge-point-gpt.service';
import { KnowledgePointStorage } from './knowledge-point.storage';

@Module({
  imports: [PersistentModule, ConfigsModule],
  providers: [
    KnowledgePointRepository,
    KnowledgePointServiceProvider,
    KnowledgePointGPTService,
    KnowledgePointStorage,
  ],
  exports: [
    KnowledgePointServiceProvider,
    KnowledgePointGPTService,
    KnowledgePointStorage,
  ],
})
export class KnowledgePointModule {}
