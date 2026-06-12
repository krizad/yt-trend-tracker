import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { YouTubeChannelInfo, YouTubeVideoInfo } from './youtube.types';

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly yt: youtube_v3.Youtube;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('YOUTUBE_API_KEY');
    if (!apiKey) {
      throw new Error('Missing YOUTUBE_API_KEY in environment');
    }

    this.yt = youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * Resolve a channel input (URL, handle, or ID) to a real YouTube Channel ID.
   *
   * Supported formats:
   * - https://www.youtube.com/@Theghostradio
   * - https://youtube.com/channel/UCxxxxxxxx
   * - https://www.youtube.com/c/ChannelName
   * - @Theghostradio
   * - UCxxxxxxxx (raw channel ID)
   */
  async resolveChannelId(input: string): Promise<string | null> {
    // 1. Already a channel ID (starts with UC)
    if (/^UC[\w-]{22}$/.test(input)) {
      return input;
    }

    // 2. Extract handle or channel ID from URL
    let handle: string | null = null;

    try {
      const url = new URL(input);
      const pathname = url.pathname;

      // https://youtube.com/@Handle
      const handleMatch = pathname.match(/^\/@([^/]+)/);
      if (handleMatch) {
        handle = `@${handleMatch[1]}`;
      }

      // https://youtube.com/channel/UCxxxxxxxx
      const channelIdMatch = pathname.match(/^\/channel\/(UC[\w-]{22})/);
      if (channelIdMatch) {
        return channelIdMatch[1];
      }

      // https://youtube.com/c/CustomName → treat as handle
      const customMatch = pathname.match(/^\/c\/([^/]+)/);
      if (customMatch) {
        handle = `@${customMatch[1]}`;
      }
    } catch {
      // Not a URL — check if it's a handle like @Theghostradio
      if (input.startsWith('@')) {
        handle = input;
      }
    }

    // 3. Resolve handle to channel ID via YouTube API
    if (handle) {
      const channelInfo = await this.getChannelInfoByHandle(handle);
      if (channelInfo) {
        this.logger.log(
          `🔗 Resolved "${input}" → ${channelInfo.id} (${channelInfo.name})`,
        );
        return channelInfo.id;
      }
      this.logger.warn(`Could not resolve handle: ${handle}`);
      return null;
    }

    // 4. Fallback — treat as raw ID
    this.logger.warn(
      `Unrecognized channel input format: "${input}", treating as channel ID`,
    );
    return input;
  }

  /**
   * Fetch channel info by channel ID
   */
  async getChannelInfo(channelId: string): Promise<YouTubeChannelInfo | null> {
    try {
      const res = await this.yt.channels.list({
        part: ['snippet', 'contentDetails'],
        id: [channelId],
      });

      return this.parseChannelResponse(res.data.items, channelId);
    } catch (error) {
      this.logger.error(`Failed to fetch channel info: ${channelId}`, error);
      throw error;
    }
  }

  /**
   * Fetch channel info by @handle (e.g. @Theghostradio)
   */
  async getChannelInfoByHandle(
    handle: string,
  ): Promise<YouTubeChannelInfo | null> {
    try {
      // Strip leading @ for the API parameter
      const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

      const res = await this.yt.channels.list({
        part: ['snippet', 'contentDetails'],
        forHandle: cleanHandle,
      });

      return this.parseChannelResponse(res.data.items, handle);
    } catch (error) {
      this.logger.error(
        `Failed to fetch channel info by handle: ${handle}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Parse YouTube channels.list response into our type
   */
  private parseChannelResponse(
    items: youtube_v3.Schema$Channel[] | undefined,
    identifier: string,
  ): YouTubeChannelInfo | null {
    const channel = items?.[0];
    if (!channel) {
      this.logger.warn(`Channel not found: ${identifier}`);
      return null;
    }

    return {
      id: channel.id!,
      name: channel.snippet?.title ?? 'Unknown',
      customUrl: channel.snippet?.customUrl ?? null,
      avatarUrl: channel.snippet?.thumbnails?.default?.url ?? null,
      uploadsPlaylistId:
        channel.contentDetails?.relatedPlaylists?.uploads ?? '',
    };
  }

  /**
   * Fetch latest videos from a channel's uploads playlist with statistics.
   * Uses a 2-step process:
   * 1. playlistItems.list → get video IDs
   * 2. videos.list → get snippet + statistics
   */
  async getLatestVideos(
    uploadsPlaylistId: string,
    maxResults = 20,
  ): Promise<YouTubeVideoInfo[]> {
    try {
      // Step 1: Get video IDs from uploads playlist
      const playlistRes = await this.yt.playlistItems.list({
        part: ['contentDetails'],
        playlistId: uploadsPlaylistId,
        maxResults,
      });

      const videoIds =
        playlistRes.data.items
          ?.map((item) => item.contentDetails?.videoId)
          .filter((id): id is string => !!id) ?? [];

      if (videoIds.length === 0) {
        this.logger.warn(`No videos found in playlist: ${uploadsPlaylistId}`);
        return [];
      }

      // Step 2: Get video details with statistics and content details
      const videosRes = await this.yt.videos.list({
        part: [
          'snippet',
          'statistics',
          'contentDetails',
          'liveStreamingDetails',
        ],
        id: videoIds,
      });

      return (
        videosRes.data.items?.map((video) => {
          const durationStr = video.contentDetails?.duration || 'PT0M';
          const isLive =
            video.snippet?.liveBroadcastContent === 'live' ||
            video.snippet?.liveBroadcastContent === 'upcoming' ||
            !!video.liveStreamingDetails;

          let durationSeconds = 0;
          const match = durationStr.match(
            /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
          );
          if (match) {
            const h = parseInt(match[1] || '0', 10);
            const m = parseInt(match[2] || '0', 10);
            const s = parseInt(match[3] || '0', 10);
            durationSeconds = h * 3600 + m * 60 + s;
          }
          const isShort =
            (durationSeconds > 0 && durationSeconds <= 61 && !isLive) ||
            (video.snippet?.title?.toLowerCase().includes('#shorts') ?? false);

          return {
            id: video.id!,
            title: video.snippet?.title ?? 'Untitled',
            thumbnailUrl:
              video.snippet?.thumbnails?.high?.url ??
              video.snippet?.thumbnails?.default?.url ??
              null,
            publishedAt: video.snippet?.publishedAt ?? new Date().toISOString(),
            viewCount: parseInt(video.statistics?.viewCount ?? '0', 10),
            isShort,
            isLive,
            tags: video.snippet?.tags ?? [],
          };
        }) ?? []
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch videos from playlist: ${uploadsPlaylistId}`,
        error,
      );
      throw error;
    }
  }
}
