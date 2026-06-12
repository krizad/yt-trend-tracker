import { Flame, TrendingUp, BarChart3, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/server';
import { LeaderboardList } from '@/components/leaderboard/leaderboard-list';
import { InfoTooltip } from '@/components/ui/info-tooltip';
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
        timeZone: 'Asia/Bangkok',
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
      <header className="border-b border-white/5 bg-background/40 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-900/20 border border-white/10 bg-card">
              <img
                src="/icon.png"
                alt="YT Trend Tracker Icon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gradient-cyan">
                YT Trend Tracker
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Views Per Hour Leaderboard
              </p>
            </div>
          </div>

          <a
            href="https://github.com/krizad/yt-trend-tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white text-xs font-medium transition-all duration-300 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Source</span>
          </a>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-xl glass p-4 text-center border-t border-white/10 shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-gradient-fire">
              {formatNumber(topVPH)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center">
              Top VPH
              <InfoTooltip content="VPH (Views Per Hour) คือความเร็วในการเพิ่มขึ้นของยอดวิว คำนวณจากการนำยอดวิวล่าสุด ลบกับยอดวิวรอบที่แล้ว แล้วหารด้วยระยะเวลาที่ห่างกัน (ชั่วโมง)" />
            </p>
          </div>
          <div className="rounded-xl glass p-4 text-center border-t border-white/10 shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-gradient-cyan">
              {totalVideos}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              Videos Tracked
              <InfoTooltip content="ระบบดึงวิดีโอปกติ (ไม่รวม Shorts/Live) จำนวนอย่างน้อย 50 คลิปล่าสุดต่อช่อง และนำมาแสดงผล 50 อันดับแรกที่มีความแรงสูงสุด" />
            </p>
          </div>
          <div className="rounded-xl glass p-4 text-center border-t border-white/10 shadow-lg">
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
          <h2 className="text-xl font-bold flex items-center">
            Trending Now
            <InfoTooltip
              side="right"
              content="ระบบจะดึงข้อมูลยอดวิวล่าสุดผ่าน YouTube API อัตโนมัติทุกๆ 2 ชั่วโมง เพื่อนำมาวิเคราะห์และจัดอันดับความแรง (Trend) ของวิดีโอแต่ละคลิป"
            />
          </h2>
          <span className="text-xs text-muted-foreground ml-auto bg-black/20 px-2.5 py-1 rounded-full border border-white/5">
            {latestUpdate !== 'N/A'
              ? `Updated: ${latestUpdate}`
              : 'Updated every 2 hours'}
          </span>
        </div>

        {/* Leaderboard */}
        <LeaderboardList videos={videos} channels={channelList} />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto bg-background/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 rounded-lg overflow-hidden opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <img
              src="/icon.png"
              alt="Icon"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground/80">
            Built with{' '}
            <span className="text-gradient-cyan font-semibold">
              NestJS + Next.js + Supabase
            </span>
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span>© {new Date().getFullYear()} KriZad</span>
            <span>•</span>
            <a
              href="https://github.com/krizad/yt-trend-tracker"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-white transition-colors"
            >
              Open Source
            </a>
          </div>
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
