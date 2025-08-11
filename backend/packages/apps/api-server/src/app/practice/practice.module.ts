import { Module } from '@nestjs/common';
import { SubjectService, KnowledgePointService, PracticeSessionService } from '@kedge/practice';
import { SubjectsController } from './subjects.controller';
import { KnowledgePointsController } from './knowledge-points.controller';
import { PracticeSessionsController } from './practice-sessions.controller';
import { PracticeAnalyticsController } from './practice-analytics.controller';

@Module({
  controllers: [
    SubjectsController,
    KnowledgePointsController, 
    PracticeSessionsController,
    PracticeAnalyticsController
  ],
  providers: [
    SubjectService,
    KnowledgePointService,
    PracticeSessionService
  ],
  exports: [
    SubjectService,
    KnowledgePointService,
    PracticeSessionService
  ]
})
export class PracticeModule {}