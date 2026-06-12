import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackerService } from './tracker.service';

@Injectable()
export class TrackerCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(TrackerCron.name);

  constructor(private readonly trackerService: TrackerService) {}

  onApplicationBootstrap() {
    this.logger.log('🚀 Application started — running initial tracking cycle');
    // Run initial cycle in the background without blocking app bootstrap
    void this.handleCron();
  }

  /**
   * Run tracking cycle on a schedule.
   * Default: every 2 hours (configurable via environment).
   *
   * Note: @Cron decorator requires a static expression at compile time.
   * For dynamic scheduling, we use the default and allow override via
   * CRON_INTERVAL env var in a production scheduler (e.g., Railway Cron).
   */
  @Cron(process.env.CRON_INTERVAL || CronExpression.EVERY_2_HOURS)
  async handleCron(): Promise<void> {
    this.logger.log('⏰ Cron triggered — starting tracking cycle');
    const startTime = Date.now();

    try {
      await this.trackerService.runTrackingCycle();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      this.logger.log(`⏱️ Tracking cycle completed in ${duration}s`);
    } catch (error) {
      this.logger.error('💥 Tracking cycle failed', error);
    }
  }
}
