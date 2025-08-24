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
import { PracticeModule } from '@kedge/practice';
import { PersistentModule } from '@kedge/persistent';

@Module({
  imports: [
    AuthModule,
    KnowledgePointModule,
    QuizModule,
    QuizParserModule,
    PracticeModule,
    PersistentModule,
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
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    }
  ],
})
export class AppModule {}
