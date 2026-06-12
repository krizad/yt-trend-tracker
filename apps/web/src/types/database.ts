/**
 * Database type definitions matching Supabase schema.
 * Shared between server and client components.
 */

export interface Channel {
  id: string;
  name: string;
  custom_url: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Video {
  id: string;
  channel_id: string;
  title: string;
  thumbnail_url: string | null;
  published_at: string;
  vph: number;
  view_count: number;
  updated_at?: string;
  is_short?: boolean;
  is_live?: boolean;
  tags?: string[];
  vph_yesterday?: number;
  acceleration?: number;
  created_at: string;
}

export interface VideoSnapshot {
  id: string;
  video_id: string;
  view_count: number;
  tracked_at: string;
}

/** Video with joined channel data */
export interface VideoWithChannel extends Video {
  channels: Channel;
}
