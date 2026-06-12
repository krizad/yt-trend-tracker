import { Module } from '@nestjs/common';
import { YouTubeModule } from '../youtube/youtube.module';
import { TrackerService } from './tracker.service';
import { TrackerCron } from './tracker.cron';
import { TrackerController } from './tracker.controller';

@Module({
  imports: [YouTubeModule],
  controllers: [TrackerController],
  providers: [TrackerService, TrackerCron],
})
export class TrackerModule {}
