import { Module } from '@nestjs/common';
import { PersistentModule } from '@kedge/persistent';
import { QuizRepository } from './quiz.repository';
import { QuizServiceProvider } from './quiz.service';

@Module({
  imports: [PersistentModule],
  providers: [QuizRepository, QuizServiceProvider],
  exports: [QuizServiceProvider],
})
export class QuizModule {}
