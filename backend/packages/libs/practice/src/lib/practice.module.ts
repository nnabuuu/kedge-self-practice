import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';
import { StrategyService } from './strategy.service';
import { PersistentModule } from '@kedge/persistent';
import { QuizModule } from '@kedge/quiz';
import { QuizParserModule } from '@kedge/quiz-parser';

@Module({
  imports: [PersistentModule, QuizModule, QuizParserModule],
  providers: [PracticeService, PracticeRepository, AnalyticsRepository, AnalyticsService, StrategyService],
  exports: [PracticeService, AnalyticsRepository, AnalyticsService, StrategyService],
})
export class PracticeModule {}