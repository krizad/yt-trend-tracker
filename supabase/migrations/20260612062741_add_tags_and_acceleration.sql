-- Add tags array
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add vph_yesterday to track VPH from exactly 24 hours ago
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS vph_yesterday DOUBLE PRECISION DEFAULT 0;

-- Add acceleration to track difference between current VPH and yesterday's VPH
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS acceleration DOUBLE PRECISION DEFAULT 0;
