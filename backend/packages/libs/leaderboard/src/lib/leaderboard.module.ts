import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { PersistentModule } from '@kedge/persistent';

@Module({
  imports: [PersistentModule],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}