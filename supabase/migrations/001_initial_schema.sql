-- ============================================
-- YouTube Trend Tracker — Initial Schema
-- ============================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor

-- 1. ตารางเก็บข้อมูลช่อง
CREATE TABLE channels (
  id TEXT PRIMARY KEY,                              -- YouTube Channel ID
  name TEXT NOT NULL,
  custom_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางเก็บข้อมูลวิดีโอ
CREATE TABLE videos (
  id TEXT PRIMARY KEY,                              -- YouTube Video ID
  channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  vph FLOAT DEFAULT 0.0,                            -- Views Per Hour (ค่าล่าสุด)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางเก็บ Snapshot ยอดวิวเพื่อคำนวณสถิติย้อนหลัง
CREATE TABLE video_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT REFERENCES videos(id) ON DELETE CASCADE,
  view_count INT NOT NULL,
  tracked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index เพื่อให้ดึงข้อมูลย้อนหลังได้เร็ว
CREATE INDEX idx_snapshots_video_tracked
  ON video_snapshots(video_id, tracked_at DESC);

-- Index สำหรับ Leaderboard query (เรียงตาม VPH)
CREATE INDEX idx_videos_vph
  ON videos(vph DESC);

-- Index สำหรับ filter ตาม channel
CREATE INDEX idx_videos_channel
  ON videos(channel_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- เปิด RLS แต่ allow public read (ไม่มี Auth)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read channels"
  ON channels FOR SELECT
  USING (true);

CREATE POLICY "Allow public read videos"
  ON videos FOR SELECT
  USING (true);

CREATE POLICY "Allow public read snapshots"
  ON video_snapshots FOR SELECT
  USING (true);

-- Service role can do everything (NestJS backend)
CREATE POLICY "Service role full access channels"
  ON channels FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access videos"
  ON videos FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access snapshots"
  ON video_snapshots FOR ALL
  USING (auth.role() = 'service_role');
