'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Flame, Zap, PlayCircle } from 'lucide-react';
import type { VideoWithChannel } from '@/types/database';

interface LeaderboardCardProps {
  video: VideoWithChannel;
  rank: number;
  onClick: () => void;
}

export function LeaderboardCard({
  video,
  rank,
  onClick,
}: LeaderboardCardProps) {
  const isTop3 = rank <= 3;
  const displayVph = Math.max(0, video.vph);
  const isHot = displayVph >= 10000;
  const isMild = displayVph >= 1000;

  const getRankBadge = () => {
    switch (rank) {
      case 1:
        return (
          <span className="text-3xl drop-shadow-md" title="Rank 1">
            🥇
          </span>
        );
      case 2:
        return (
          <span className="text-3xl drop-shadow-md opacity-90" title="Rank 2">
            🥈
          </span>
        );
      case 3:
        return (
          <span className="text-3xl drop-shadow-md opacity-80" title="Rank 3">
            🥉
          </span>
        );
      default:
        return (
          <span className="text-lg font-bold text-muted-foreground/60">
            #{rank}
          </span>
        );
    }
  };

  const getVphBadge = () => {
    if (isHot) {
      return (
        <Badge className="glow-fire bg-gradient-to-r from-orange-500 to-red-500 text-white border-none gap-1 font-bold">
          <Flame className="w-3 h-3" />
          {formatVPH(displayVph)}
        </Badge>
      );
    }
    if (isMild) {
      return (
        <Badge className="glow-cyan bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-none gap-1 font-semibold">
          <TrendingUp className="w-3 h-3" />
          {formatVPH(displayVph)}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 font-medium">
        <Zap className="w-3 h-3" />
        {formatVPH(displayVph)}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.04 }}
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-300 border hover:border-accent/50 ${
          isTop3 
            ? 'glass hover:glow-purple border-accent/30 shadow-lg shadow-purple-900/20' 
            : 'bg-card/60 backdrop-blur-xl border-white/10 hover:bg-card/80 hover:border-white/20 shadow-md'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            {/* Rank */}
            <div className="flex-shrink-0 w-10 text-center">
              {getRankBadge()}
            </div>

            {/* Thumbnail */}
            <div className="flex-shrink-0 w-24 sm:w-32">
              <div className="relative aspect-video rounded-md overflow-hidden">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-xs">
                      No thumb
                    </span>
                  </div>
                )}
                {isHot && (
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent" />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 mb-1">
                {video.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {video.channels?.name ?? 'Unknown Channel'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground/60 mt-0.5">
                <span>
                  {new Date(video.published_at).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'Asia/Bangkok',
                  })}
                </span>
                {video.view_count !== undefined && (
                  <>
                    <span>•</span>
                    <span>{formatVPH(video.view_count)} views</span>
                  </>
                )}
                {video.updated_at && (
                  <>
                    <span>•</span>
                    <span>
                      อัปเดต{' '}
                      {new Date(video.updated_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Bangkok',
                      })}
                    </span>
                  </>
                )}
              </div>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {video.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded-sm bg-accent/10 text-accent text-[10px] whitespace-nowrap"
                    >
                      #{tag}
                    </span>
                  ))}
                  {video.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      +{video.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex flex-col items-end gap-3">
              <div className="flex flex-col items-end gap-1">
                {getVphBadge()}
                {video.acceleration !== undefined &&
                video.acceleration !== 0 ? (
                  <span
                    className={`text-[10px] font-bold ${video.acceleration > 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {video.acceleration > 0 ? '▲ ' : '▼ '}
                    {formatVPH(Math.abs(video.acceleration))} / 24h
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                    views/hr
                  </span>
                )}
              </div>
              <a
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[11px] font-semibold transition-all duration-200"
                title="Watch on YouTube"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Watch</span>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function formatVPH(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) return `${(absValue / 1_000_000).toFixed(1)}M`;
  if (absValue >= 1_000) return `${(absValue / 1_000).toFixed(1)}K`;
  return absValue.toFixed(0);
}
