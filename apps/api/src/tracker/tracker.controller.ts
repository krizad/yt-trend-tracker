import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { TrackerService } from './tracker.service';

@Controller('cron')
export class TrackerController {
  private readonly logger = new Logger(TrackerController.name);

  constructor(private readonly trackerService: TrackerService) {}

  @Post('track')
  @HttpCode(HttpStatus.OK)
  async triggerTracking(): Promise<{
    status: string;
    message: string;
    durationMs: number;
  }> {
    this.logger.log('🌐 HTTP endpoint triggered — starting tracking cycle');
    const startTime = Date.now();

    try {
      await this.trackerService.runTrackingCycle();
      const durationMs = Date.now() - startTime;
      const durationSecs = (durationMs / 1000).toFixed(1);

      this.logger.log(`⏱️ HTTP Tracking cycle completed in ${durationSecs}s`);

      return {
        status: 'success',
        message: 'Tracking cycle completed successfully',
        durationMs,
      };
    } catch (error) {
      this.logger.error('💥 HTTP Tracking cycle failed', error);
      throw new InternalServerErrorException('Tracking cycle failed');
    }
  }
}
