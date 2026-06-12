-- 004_add_view_count.sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
