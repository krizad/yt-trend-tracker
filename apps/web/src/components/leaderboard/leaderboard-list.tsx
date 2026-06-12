'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardCard } from './leaderboard-card';
import { VideoDetailModal } from '../video-detail-modal';
import type { VideoWithChannel } from '@/types/database';

interface LeaderboardListProps {
  videos: VideoWithChannel[];
  channels: { id: string; name: string }[];
}

export function LeaderboardList({ videos, channels }: LeaderboardListProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoWithChannel | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string>('all');

  const filteredVideos =
    activeChannel === 'all'
      ? videos
      : videos.filter((v) => v.channel_id === activeChannel);

  const handleVideoClick = (video: VideoWithChannel) => {
    setSelectedVideo(video);
    setModalOpen(true);
  };

  return (
    <div>
      {/* Channel Filter Tabs */}
      {channels.length > 0 && (
        <div className="flex items-center gap-1 mb-6 p-1.5 bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl w-full sm:w-fit max-w-full overflow-x-auto no-scrollbar shadow-sm">
          <button
            onClick={() => setActiveChannel('all')}
            className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              activeChannel === 'all'
                ? 'text-white'
                : 'text-muted-foreground hover:text-white/80'
            }`}
          >
            {activeChannel === 'all' && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="text-base leading-none">🔥</span> All
            </span>
          </button>
          
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
                activeChannel === ch.id
                  ? 'text-white'
                  : 'text-muted-foreground hover:text-white/80'
              }`}
            >
              {activeChannel === ch.id && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{ch.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Video List */}
      <div className="space-y-2">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video, index) => (
            <LeaderboardCard
              key={video.id}
              video={video}
              rank={index + 1}
              onClick={() => handleVideoClick(video)}
            />
          ))
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-medium mb-2">No videos tracked yet</p>
            <p className="text-sm">
              Videos will appear here after the first cron cycle runs.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
