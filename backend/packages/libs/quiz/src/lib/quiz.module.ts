import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { QuizRepository } from './quiz.repository';
import { QuizServiceProvider } from './quiz.service';
import { QuizStorageService } from './quiz.storage';

@Module({
  imports: [PersistentModule],
  providers: [QuizRepository, QuizStorageService, QuizServiceProvider],
  exports: [QuizServiceProvider],
})
export class QuizModule {}
