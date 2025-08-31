import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { KnowledgePointModule } from '@kedge/knowledge-point';
import { QuizRepository } from './quiz.repository';
import { QuizServiceProvider } from './quiz.service';
import { QuizStorageService } from './quiz.storage';
import { EnhancedQuizStorageService } from './quiz.storage.enhanced';
import { ImageConverterService } from './converters/image-converter.service';

@Module({
  imports: [PersistentModule, KnowledgePointModule],
  providers: [
    QuizRepository,
    QuizStorageService,
    EnhancedQuizStorageService,
    QuizServiceProvider,
    ImageConverterService,
  ],
  exports: [QuizServiceProvider, EnhancedQuizStorageService, QuizRepository, ImageConverterService],
})
export class QuizModule {}
