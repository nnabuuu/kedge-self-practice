import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { StrategyService } from './strategy.service';
import { PersistentModule } from '@kedge/persistent';
import { QuizModule } from '@kedge/quiz';
import { QuizParserModule } from '@kedge/quiz-parser';

@Module({
  imports: [PersistentModule, QuizModule, QuizParserModule],
  providers: [PracticeService, PracticeRepository, StrategyService],
  exports: [PracticeService, StrategyService],
})
export class PracticeModule {}