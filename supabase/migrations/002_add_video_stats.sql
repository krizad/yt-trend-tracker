-- 002_add_video_stats.sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Also update existing videos with the latest view_count from video_snapshots if possible
UPDATE videos v
SET view_count = (
  SELECT view_count 
  FROM video_snapshots vs 
  WHERE vs.video_id = v.id 
  ORDER BY tracked_at DESC 
  LIMIT 1
)
WHERE view_count = 0 OR view_count IS NULL;
