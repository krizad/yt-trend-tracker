'use client';

import { useState } from 'react';
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
      {/* Channel Filter */}
      {channels.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveChannel('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
              activeChannel === 'all'
                ? 'bg-accent text-accent-foreground glow-cyan'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            All Channels
          </button>
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                activeChannel === ch.id
                  ? 'bg-accent text-accent-foreground glow-cyan'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {ch.name}
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
