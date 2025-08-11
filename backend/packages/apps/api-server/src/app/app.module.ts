import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AuthModule } from '@kedge/auth';
import { KnowledgePointModule } from '@kedge/knowledge-point';
import { QuizModule } from '@kedge/quiz';
import { QuizParserModule } from '@kedge/quiz-parser';
import { AuthController } from './auth.controller';
import { IndexController } from './index.controller';
import { GptController } from './gpt.controller';
import { DocxController } from './docx.controller';
import { QuizController } from './quiz.controller';
import { AttachmentsController } from './attachments.controller';
import { PracticeController } from './controllers/practice.controller';
import { PracticeModule } from '@kedge/practice';

@Module({
  imports: [
    AuthModule,
    KnowledgePointModule,
    QuizModule,
    QuizParserModule,
    PracticeModule,
  ],
  controllers: [
    AuthController,
    IndexController,
    GptController,
    DocxController,
    QuizController,
    AttachmentsController,
    PracticeController,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    }
  ],
})
export class AppModule {}
