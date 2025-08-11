import { Module } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { PracticeRepository } from './practice.repository';
import { PersistentModule } from '@kedge/persistent';

@Module({
  imports: [PersistentModule],
  providers: [PracticeService, PracticeRepository],
  exports: [PracticeService],
})
export class PracticeModule {}