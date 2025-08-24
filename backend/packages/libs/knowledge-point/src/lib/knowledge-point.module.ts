import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { ConfigsModule } from '@kedge/configs';
import { KnowledgePointRepository } from './knowledge-point.repository';
import { KnowledgePointServiceProvider } from './knowledge-point.service';
import { KnowledgePointGPTService } from './knowledge-point-gpt.service';
import { KnowledgePointStorage } from './knowledge-point.storage';
import { KnowledgePointBootstrapService } from './knowledge-point-bootstrap.service';
import { KnowledgePointSuggestionService } from './knowledge-point-suggestion.service';

@Module({
  imports: [PersistentModule, ConfigsModule],
  providers: [
    KnowledgePointRepository,
    KnowledgePointServiceProvider,
    KnowledgePointGPTService,
    KnowledgePointStorage,
    KnowledgePointBootstrapService,
    KnowledgePointSuggestionService,
  ],
  exports: [
    KnowledgePointServiceProvider,
    KnowledgePointGPTService,
    KnowledgePointStorage,
    KnowledgePointBootstrapService,
    KnowledgePointSuggestionService,
  ],
})
export class KnowledgePointModule {}
