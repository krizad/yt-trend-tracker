# 🔥 YT Trend Tracker

> Open-source YouTube Trend Tracker — Track **VPH (Views Per Hour)** across multiple channels and see which videos are going viral right now.

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## Architecture

```
                    ┌─────────────────┐
                    │  YouTube Data   │
                    │    API v3       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  NestJS Worker  │
                    │  (Cron: 2hrs)   │
                    │  Fetch → VPH    │
                    │  POST /cron/track
                    └────────┬────────┘
                             │ Service Role Key (Write)
                    ┌────────▼────────┐
                    │    Supabase     │
                    │   PostgreSQL    │
                    └────────┬────────┘
                             │ Anon Key (Read-only)
                    ┌────────▼────────┐
                    │  Next.js 16     │
                    │  Dashboard      │
                    │  (SSR + ISR)    │
                    └─────────────────┘
```

| Component | Role |
|-----------|------|
| **NestJS** (`apps/api`) | Cron worker — fetches YouTube stats, records snapshots, calculates VPH & acceleration |
| **Next.js** (`apps/web`) | Dashboard — displays Leaderboard sorted by VPH with charts |
| **Supabase** | Managed PostgreSQL with RLS — public read, service_role write |

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9
- A free [Supabase](https://supabase.com) account
- A [YouTube Data API v3 key](https://console.cloud.google.com/apis/credentials)

### 1. Clone & Install

```bash
git clone https://github.com/krizad/yt-trend-tracker.git
cd yt-trend-tracker
pnpm install
```

### 2. Setup Supabase

1. Create a new project on [supabase.com](https://supabase.com/dashboard)
2. Go to **SQL Editor** and run **all** migration files from `supabase/migrations/` in order (starting with `001_initial_schema.sql`)
3. Copy your keys from **Project Settings → API**

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
YOUTUBE_API_KEY="AIzaSy..."
TARGET_CHANNEL_IDS="UCxxxxxx,@handle,https://www.youtube.com/@handle"
CRON_INTERVAL="0 */2 * * *"
```

### 4. Run

```bash
# Start both NestJS and Next.js
pnpm dev

# Or run individually:
pnpm dev:api   # NestJS on port 8080
pnpm dev:web   # Next.js on port 3000
```

## Project Structure

```
yt-trend-tracker/
├── apps/
│   ├── api/                          # NestJS Backend
│   │   └── src/
│   │       ├── supabase/             # Supabase client module (DI)
│   │       ├── youtube/              # YouTube API service
│   │       └── tracker/              # Cron job + VPH calculation
│   └── web/                          # Next.js Frontend
│       └── src/
│           ├── app/                  # App Router (SSR + ISR)
│           ├── components/
│           │   ├── leaderboard/      # Leaderboard cards & list
│           │   └── ui/               # Shadcn/ui v4 components
│           ├── lib/supabase/         # Server + Browser clients
│           └── types/                # TypeScript interfaces
├── supabase/
│   └── migrations/                   # SQL migrations (run in order)
├── .env.example
├── render.yaml                       # Render.com deploy config (API only)
├── pnpm-workspace.yaml
└── README.md
```

## How It Works

### VPH (Views Per Hour)

Measures how fast a video is gaining views right now:

```
VPH = (currentViews - historicalViews) / hoursDifference
```

### Acceleration

Tracks whether a video's momentum is increasing or decreasing:

```
Acceleration = VPH(today) - VPH(yesterday)
```

- Positive acceleration = video is gaining steam
- Negative acceleration = video is slowing down

### The Pipeline

- Every 2 hours, the NestJS cron fetches the latest view counts from YouTube
- Each fetch creates a **snapshot** in `video_snapshots`
- VPH is calculated by comparing the latest snapshot vs the one from ~2 hours ago
- Once per day, `vph_yesterday` is stored and `acceleration` is computed
- The cron also runs immediately on app bootstrap and exposes `POST /cron/track` for external triggers

## Database Schema

| Table | Key Columns |
|-------|-------------|
| `channels` | `id`, `name`, `custom_url`, `avatar_url`, `created_at` |
| `videos` | `id`, `channel_id`, `title`, `thumbnail_url`, `published_at`, `view_count`, `vph`, `vph_yesterday`, `acceleration`, `is_short`, `is_live`, `tags`, `updated_at` |
| `video_snapshots` | `id`, `video_id`, `view_count`, `tracked_at` |

## Multi-Channel Support

`TARGET_CHANNEL_IDS` accepts comma-separated channel IDs, YouTube URLs, or `@handles`:

```env
TARGET_CHANNEL_IDS="UCxxxxxx,@handle,https://www.youtube.com/@channelname"
```

The dashboard includes a channel filter so you can view trending videos per channel or across all channels.

## Deployment (Free Tier Architecture)

To host this project completely for free and ensure the background cron jobs run reliably, separate the frontend and backend deployments.

**Why not deploy the API on Vercel?**
Vercel's Hobby (Free) tier has a 10-second Serverless Function timeout and limits Cron Jobs to 1 execution per day. The YouTube tracking process typically takes ~15-20 seconds and needs to run every 2 hours, which will cause timeouts and fail on Vercel's free tier.

### Recommended Setup

1. **Frontend (`apps/web`)** 🌐
   - Deploy on **Vercel**
   - Ideal for Next.js, handles SSR seamlessly.

2. **Backend (`apps/api`)** ⚙️
   - Deploy on **Render.com** (Web Service) or **Railway** / **Koyeb**
   - *Note on Render's Free Tier*: The server sleeps after 15 minutes of inactivity. When it sleeps, internal NestJS cron jobs stop working.

3. **Database & Cron Trigger** 🐘
   - Use **Supabase** (PostgreSQL)
   - Supabase has built-in Cron Jobs via the `pg_cron` and `pg_net` extensions, which can wake up your Render API and trigger the tracking cycle asynchronously.

### Setting up Supabase Cron to Trigger the API

Since the API exposes a `POST /cron/track` endpoint, you can schedule Supabase to hit this endpoint. Run the following in your Supabase SQL Editor:

```sql
-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the HTTP trigger (e.g., every 2 hours)
SELECT cron.schedule(
  'trigger-youtube-tracker',
  '0 */2 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<your-api-url>/cron/track',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

*This guarantees the tracking process runs perfectly on schedule, bypassing any 10-second timeout limits while waking up your backend if it was asleep.*

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16 | SSR Dashboard (App Router) |
| NestJS | 11 | Cron Worker + REST API |
| Supabase | Latest | PostgreSQL + Auth + RLS |
| Tailwind CSS | 4 | Styling |
| Shadcn/ui | 4 | UI Components (`base-nova` theme) |
| Recharts | 3 | Data Visualization |
| Framer Motion | 12 | Animations |
| Lucide React | 1 | Icons |
| pnpm | 10 | Package Manager |

## License

MIT © 2024
