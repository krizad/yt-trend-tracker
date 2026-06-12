import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { YouTubeService } from '../youtube/youtube.service';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);
  private readonly channelInputs: string[];

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly youtubeService: YouTubeService,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<string>('TARGET_CHANNEL_IDS', '');
    this.channelInputs = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (this.channelInputs.length === 0) {
      this.logger.warn(
        'No TARGET_CHANNEL_IDS configured. Tracker will not fetch any data.',
      );
    } else {
      this.logger.log(
        `📋 Configured ${this.channelInputs.length} channel input(s): ${this.channelInputs.join(', ')}`,
      );
    }
  }

  /**
   * Main tracking cycle — called by the cron job
   * Loops through all configured channels
   */
  async runTrackingCycle(): Promise<void> {
    this.logger.log(
      `🔄 Starting tracking cycle for ${this.channelInputs.length} channel(s)...`,
    );

    for (const input of this.channelInputs) {
      try {
        // Resolve URL/handle/@username to actual channel ID
        const channelId = await this.youtubeService.resolveChannelId(input);

        if (!channelId) {
          this.logger.warn(`⚠️ Could not resolve: "${input}" — skipping`);
          continue;
        }

        await this.trackChannel(channelId);
      } catch (error) {
        this.logger.error(`Failed to track channel: ${input}`, error);
      }
    }

    this.logger.log('✅ Tracking cycle complete.');
  }

  /**
   * Track a single channel:
   * 1. Fetch channel info → upsert to channels table
   * 2. Fetch latest videos → upsert to videos table
   * 3. Take view count snapshots → insert to video_snapshots table
   * 4. Calculate VPH → update videos table
   */
  private async trackChannel(channelId: string): Promise<void> {
    this.logger.log(`📡 Tracking channel: ${channelId}`);

    // Step 1: Get channel info from YouTube
    const channelInfo = await this.youtubeService.getChannelInfo(channelId);
    if (!channelInfo) {
      this.logger.warn(`Skipping channel ${channelId} — not found on YouTube`);
      return;
    }

    // Upsert channel
    const { error: channelError } = await this.supabase.from('channels').upsert(
      {
        id: channelInfo.id,
        name: channelInfo.name,
        custom_url: channelInfo.customUrl,
        avatar_url: channelInfo.avatarUrl,
      },
      { onConflict: 'id' },
    );

    if (channelError) {
      this.logger.error(`Failed to upsert channel: ${channelId}`, channelError);
      return;
    }

    // Step 2: Get latest videos from uploads playlist
    const videos = await this.youtubeService.getLatestVideos(
      channelInfo.uploadsPlaylistId,
      50,
    );

    this.logger.log(
      `📹 Found ${videos.length} videos for channel: ${channelInfo.name}`,
    );

    // Step 3: Upsert videos & take snapshots
    for (const video of videos) {
      // Upsert video (don't overwrite VPH here — that's done in step 4)
      const { error: videoError } = await this.supabase.from('videos').upsert(
        {
          id: video.id,
          channel_id: channelInfo.id,
          title: video.title,
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishedAt,
          view_count: video.viewCount,
          is_short: video.isShort,
          is_live: video.isLive,
          tags: video.tags,
        },
        { onConflict: 'id', ignoreDuplicates: false },
      );

      if (videoError) {
        this.logger.error(`Failed to upsert video: ${video.id}`, videoError);
        continue;
      }

      // Insert snapshot
      const { error: snapshotError } = await this.supabase
        .from('video_snapshots')
        .insert({
          video_id: video.id,
          view_count: video.viewCount,
        });

      if (snapshotError) {
        this.logger.error(
          `Failed to insert snapshot for video: ${video.id}`,
          snapshotError,
        );
      }
    }

    // Step 4: Calculate VPH for each video
    await this.calculateVPH(videos.map((v) => v.id));
  }

  /**
   * Calculate Views Per Hour (VPH) for given videos.
   * Formula: VPH = (latestViewCount - previousViewCount) / hoursDifference
   *
   * "Previous" is the snapshot closest to 2 hours ago.
   */
  private async calculateVPH(videoIds: string[]): Promise<void> {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    for (const videoId of videoIds) {
      try {
        // Get the latest snapshot (just inserted)
        const { data: latestSnapshot } = await this.supabase
          .from('video_snapshots')
          .select('view_count, tracked_at')
          .eq('video_id', videoId)
          .order('tracked_at', { ascending: false })
          .limit(1)
          .single();

        // Get the snapshot closest to 2 hours ago
        const { data: previousSnapshot } = await this.supabase
          .from('video_snapshots')
          .select('view_count, tracked_at')
          .eq('video_id', videoId)
          .lte('tracked_at', twoHoursAgo)
          .order('tracked_at', { ascending: false })
          .limit(1)
          .single();

        if (!latestSnapshot || !previousSnapshot) {
          // Not enough data to calculate VPH yet (need at least 2 snapshots)
          continue;
        }

        const viewDiff =
          latestSnapshot.view_count - previousSnapshot.view_count;
        const timeDiffMs =
          new Date(latestSnapshot.tracked_at).getTime() -
          new Date(previousSnapshot.tracked_at).getTime();
        const hoursDiff = timeDiffMs / (1000 * 60 * 60);

        if (hoursDiff <= 0) continue;

        const vph = Math.round((viewDiff / hoursDiff) * 100) / 100;

        // Calculate VPH Yesterday and Acceleration
        let vphYesterday = 0;
        const twentyFourHoursAgo = new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString();

        const { data: yesterdaySnapshot } = await this.supabase
          .from('video_snapshots')
          .select('view_count, tracked_at')
          .eq('video_id', videoId)
          .lte('tracked_at', twentyFourHoursAgo)
          .order('tracked_at', { ascending: false })
          .limit(1)
          .single();

        if (yesterdaySnapshot) {
          const viewDiff24h =
            latestSnapshot.view_count - yesterdaySnapshot.view_count;
          const timeDiff24hMs =
            new Date(latestSnapshot.tracked_at).getTime() -
            new Date(yesterdaySnapshot.tracked_at).getTime();
          const hoursDiff24h = timeDiff24hMs / (1000 * 60 * 60);

          if (hoursDiff24h > 0) {
            vphYesterday = Math.round((viewDiff24h / hoursDiff24h) * 100) / 100;
          }
        }

        const acceleration = Math.round((vph - vphYesterday) * 100) / 100;

        // Update VPH in videos table
        const { error: updateError } = await this.supabase
          .from('videos')
          .update({
            vph: Math.max(0, vph),
            vph_yesterday: Math.max(0, vphYesterday),
            acceleration: acceleration,
          })
          .eq('id', videoId);

        if (updateError) {
          this.logger.error(
            `Failed to update VPH for video: ${videoId}`,
            updateError,
          );
        }
      } catch (error) {
        this.logger.error(`Error calculating VPH for video: ${videoId}`, error);
      }
    }
  }
}
