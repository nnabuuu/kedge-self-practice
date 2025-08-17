import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { StrategyService } from './strategy.service';
import { PersistentModule } from '@kedge/persistent';
import { QuizModule } from '@kedge/quiz';

@Module({
  imports: [PersistentModule, QuizModule],
  providers: [PracticeService, PracticeRepository, StrategyService],
  exports: [PracticeService, StrategyService],
})
export class PracticeModule {}