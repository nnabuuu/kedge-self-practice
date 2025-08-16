import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { KnowledgePointModule } from '@kedge/knowledge-point';
import { QuizRepository } from './quiz.repository';
import { QuizServiceProvider } from './quiz.service';
import { QuizStorageService } from './quiz.storage';
import { EnhancedQuizStorageService } from './quiz.storage.enhanced';

@Module({
  imports: [PersistentModule, KnowledgePointModule],
  providers: [
    QuizRepository,
    QuizStorageService,
    EnhancedQuizStorageService,
    QuizServiceProvider,
  ],
  exports: [QuizServiceProvider, EnhancedQuizStorageService],
})
export class QuizModule {}
