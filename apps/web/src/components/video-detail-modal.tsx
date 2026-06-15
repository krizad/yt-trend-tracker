'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, TrendingUp, Eye, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { VideoWithChannel, VideoSnapshot } from '@/types/database';

interface VideoDetailModalProps {
  video: VideoWithChannel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoDetailModal({
  video,
  open,
  onOpenChange,
}: VideoDetailModalProps) {
  const [snapshots, setSnapshots] = useState<VideoSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSnapshots = async (videoId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('video_snapshots')
      .select('*')
      .eq('video_id', videoId)
      .order('tracked_at', { ascending: true })
      .limit(100);

    setSnapshots(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (open && video) {
      fetchSnapshots(video.id);
    } else if (!open) {
      setSnapshots([]);
    }
  }, [open, video]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const chartData =
    snapshots.map((s) => ({
      time: new Date(s.tracked_at).toLocaleString('th-TH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok',
      }),
      views: s.view_count,
    })) ?? [];

  const formatViews = (views: number): string => {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass bg-card/90! border-border/50 max-w-[95vw]! sm:max-w-3xl! md:max-w-4xl! lg:max-w-5xl! max-h-[85vh] overflow-y-auto">
        {video && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold leading-tight pr-6">
                {video.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Video Thumbnail */}
              <div className="relative overflow-hidden rounded-lg">
                {video.thumbnail_url && (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                )}
                <div className="absolute bottom-2 right-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-xs font-medium hover:bg-black/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Watch on YouTube
                  </a>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="w-4 h-4 mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground">VPH</span>
                  <span className="text-lg font-bold text-gradient-fire">
                    {video.vph.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <Eye className="w-4 h-4 mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground">
                    Total Views
                  </span>
                  <span className="text-lg font-bold text-gradient-cyan">
                    {video.view_count
                      ? video.view_count.toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 text-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    Channel
                  </span>
                  <span className="text-sm font-semibold truncate w-full">
                    {video.channels?.name ?? 'Unknown'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/50 text-center">
                  <Clock className="w-4 h-4 mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground mb-1">
                    Published
                  </span>
                  <span className="text-sm font-semibold">
                    {new Date(video.published_at).toLocaleDateString('th-TH', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'Asia/Bangkok',
                    })}
                  </span>
                </div>
              </div>

              <Separator className="bg-border/30" />

              {/* View Growth Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  View Growth Over Time
                </h3>

                {loading && (
                  <div className="h-72 flex items-center justify-center">
                    <div className="animate-pulse text-muted-foreground text-sm">
                      Loading chart data...
                    </div>
                  </div>
                )}
                {!loading && chartData.length > 1 && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient
                              id="viewGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="oklch(0.75 0.15 195)"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="50%"
                                stopColor="oklch(0.72 0.18 280)"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor="oklch(0.72 0.18 280)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="oklch(0.3 0.02 280 / 30%)"
                          />
                          <XAxis
                            dataKey="time"
                            tick={{
                              fontSize: 10,
                              fill: 'oklch(0.65 0.03 280)',
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tick={{
                              fontSize: 10,
                              fill: 'oklch(0.65 0.03 280)',
                            }}
                            tickFormatter={formatViews}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'oklch(0.17 0.025 280 / 90%)',
                              border: '1px solid oklch(0.4 0.04 280 / 30%)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(8px)',
                              color: 'oklch(0.96 0.01 280)',
                              fontSize: '12px',
                            }}
                            formatter={(value) => [
                              Number(value).toLocaleString(),
                              'Views',
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="oklch(0.75 0.15 195)"
                            strokeWidth={2}
                            fill="url(#viewGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  </AnimatePresence>
                )}
                {!loading && chartData.length <= 1 && (
                  <div className="h-72 flex items-center justify-center text-muted-foreground text-sm">
                    Not enough data yet. Need at least 2 snapshots.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
