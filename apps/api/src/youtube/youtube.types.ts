/** Types for YouTube Data API v3 responses */

export interface YouTubeChannelInfo {
  id: string;
  name: string;
  customUrl: string | null;
  avatarUrl: string | null;
  uploadsPlaylistId: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  viewCount: number;
  isShort: boolean;
  isLive: boolean;
  tags: string[];
}
