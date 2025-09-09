import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from '@kedge/auth';
import { KnowledgePointModule } from '@kedge/knowledge-point';
import { QuizModule } from '@kedge/quiz';
import { QuizParserModule } from '@kedge/quiz-parser';
import { AuthController } from './controllers/auth.controller';
import { IndexController, HealthController } from './controllers/index.controller';
import { GptController } from './controllers/gpt.controller';
import { DocxController } from './controllers/docx.controller';
import { QuizController } from './controllers/quiz.controller';
import { AttachmentsController } from './controllers/attachments.controller';
import { PracticeController } from './controllers/practice.controller';
import { KnowledgePointController } from './controllers/knowledge-point.controller';
import { StatisticsController } from './controllers/statistics.controller';
import { SubjectsController } from './controllers/subjects.controller';
import { AdminController } from './controllers/admin.controller';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { SystemConfigController } from './controllers/system-config.controller';
import { PracticeModule } from '@kedge/practice';
import { PersistentModule } from '@kedge/persistent';
import { LeaderboardModule } from '@kedge/leaderboard';

@Module({
  imports: [
    AuthModule,
    KnowledgePointModule,
    QuizModule,
    QuizParserModule,
    PracticeModule,
    PersistentModule,
    LeaderboardModule,
  ],
  controllers: [
    AuthController,
    IndexController,
    HealthController,
    GptController,
    DocxController,
    QuizController,
    AttachmentsController,
    PracticeController,
    KnowledgePointController,
    StatisticsController,
    SubjectsController,
    AdminController,
    LeaderboardController,
    SystemConfigController,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    }
  ],
})
export class AppModule {}
