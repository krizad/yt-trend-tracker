import { Flame, TrendingUp, BarChart3, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardList } from '@/components/leaderboard/leaderboard-list';
import type { VideoWithChannel, Channel } from '@/types/database';

// Revalidate every 5 minutes for near-real-time data
export const revalidate = 300;

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch trending videos with channel info, ordered by VPH
  const { data: trendingVideos } = await supabase
    .from('videos')
    .select('*, channels(*), video_snapshots(view_count, tracked_at)')
    .eq('is_short', false)
    .eq('is_live', false)
    .order('vph', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(50);

  // Fetch all channels for the filter
  const { data: channels } = await supabase
    .from('channels')
    .select('id, name')
    .order('name');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = (trendingVideos ?? []).map((video: any) => {
    const snapshots = video.video_snapshots || [];
    const latestSnapshot = snapshots.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) =>
        new Date(b.tracked_at).getTime() - new Date(a.tracked_at).getTime(),
    )[0];

    return {
      ...video,
      view_count: latestSnapshot?.view_count,
      updated_at: latestSnapshot?.tracked_at,
    };
  }) as VideoWithChannel[];

  const channelList = (channels ?? []) as Pick<Channel, 'id' | 'name'>[];

  let latestUpdate = 'N/A';
  if (videos.length > 0) {
    const dates = videos
      .map((v) => v.updated_at)
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime());
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates));
      latestUpdate = maxDate.toLocaleString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }

  // Summary stats
  const totalVideos = videos.length;
  const topVPH = videos[0]?.vph ?? 0;
  const totalChannels = channelList.length;

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="border-b border-border/30 glass sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                YT Trend Tracker
              </h1>
              <p className="text-xs text-muted-foreground">
                Views Per Hour Leaderboard
              </p>
            </div>
          </div>

          <a
            href="https://github.com/krizad/yt-trend-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Source</span>
          </a>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl glass p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-gradient-fire">
              {formatNumber(topVPH)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Top VPH</p>
          </div>
          <div className="rounded-xl glass p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-gradient-cyan">
              {totalVideos}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Videos Tracked</p>
          </div>
          <div className="rounded-xl glass p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-gradient-cyan">
              {totalChannels}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Channels</p>
          </div>
        </div>

        <Separator className="bg-border/20 mb-6" />

        {/* Leaderboard Title */}
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold">Trending Now</h2>
          <span className="text-xs text-muted-foreground ml-auto">
            {latestUpdate !== 'N/A'
              ? `Updated: ${latestUpdate}`
              : 'Updated every 2 hours'}
          </span>
        </div>

        {/* Leaderboard */}
        <LeaderboardList videos={videos} channels={channelList} />
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Built with{' '}
            <span className="text-gradient-cyan font-medium">
              NestJS + Next.js + Supabase
            </span>{' '}
            • Open Source • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}
