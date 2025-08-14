import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { StrategyService } from './strategy.service';
import { PersistentModule } from '@kedge/persistent';

@Module({
  imports: [PersistentModule],
  providers: [PracticeService, PracticeRepository, StrategyService],
  exports: [PracticeService, StrategyService],
})
export class PracticeModule {}