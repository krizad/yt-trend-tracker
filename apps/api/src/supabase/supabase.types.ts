/**
 * Database type definitions matching Supabase schema.
 * These types mirror the tables defined in supabase/migrations/001_initial_schema.sql
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

/** Supabase Database schema for type-safe queries */
export interface Database {
  public: {
    Tables: {
      channels: {
        Row: Channel;
        Insert: Omit<Channel, 'created_at'> & { created_at?: string };
        Update: Partial<Omit<Channel, 'id'>>;
      };
      videos: {
        Row: Video;
        Insert: Omit<Video, 'created_at' | 'vph'> & {
          created_at?: string;
          vph?: number;
        };
        Update: Partial<Omit<Video, 'id'>>;
      };
      video_snapshots: {
        Row: VideoSnapshot;
        Insert: Omit<VideoSnapshot, 'id' | 'tracked_at'> & {
          id?: string;
          tracked_at?: string;
        };
        Update: Partial<Omit<VideoSnapshot, 'id'>>;
      };
    };
  };
}
