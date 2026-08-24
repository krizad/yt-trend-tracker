# YT Trend Tracker — Agent Instructions

## Monorepo

pnpm workspace with two packages under `apps/`, orchestrated by **Turborepo** (`turbo.json` at root, TUI mode enabled). Use `pnpm --filter <name>` for package-scoped commands; root scripts run through `turbo`.

```bash
pnpm install            # install all
pnpm dev                # both apps via turbo TUI (api :8080, web :3000) — press 1/2 to toggle task logs, ctrl+z to suspend
pnpm dev:api            # NestJS only
pnpm dev:web            # Next.js only (Turbopack)
pnpm lint               # ESLint across all packages (turbo)
pnpm lint:fix           # auto-fix
pnpm lint:format        # Prettier across all packages
pnpm build              # build both (cached by turbo)
pnpm --filter api test  # API unit tests (no spec files exist yet)
pnpm --filter api test:e2e  # API e2e tests
```

The `api` package exposes both `start:dev` and its `dev` alias (`nest start --watch`) so `turbo run dev` picks it up alongside web's `dev`.

## Env

`.env` lives at the **monorepo root** (not inside each app).

- `apps/web` loads it via `dotenv-cli -e ../../.env` (see `apps/web/package.json` scripts).
- `apps/api` loads it via NestJS `ConfigModule` with `envFilePath: ['.env', '../../.env']`.
- Both `SUPABASE_SERVICE_ROLE_KEY` (API, write) and `SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` (web, read) are required.
- `TARGET_CHANNEL_IDS` accepts comma-separated values: channel IDs (`UC...`), YouTube URLs, or `@handles`.
- App configuration uses `NEXT_PUBLIC_APP_TITLE` and `NEXT_PUBLIC_APP_DESCRIPTION` to set the branding for the project.

## Database & Migrations

Supabase (managed PostgreSQL). No ORM — both apps use `@supabase/supabase-js` directly.

**Migrations** are in `supabase/migrations/` and must be run in the Supabase SQL Editor. There is no migration tooling in the repo.

**Types are duplicated** — `apps/api/src/supabase/supabase.types.ts` and `apps/web/src/types/database.ts` each define their own `Channel`, `Video`, `VideoSnapshot` interfaces. Any schema change requires updating both files (the web version may have more fields reflecting newer migrations).

## Architecture

```text
YouTube API v3 → NestJS (cron every 2h, service_role key) → Supabase → Next.js (SSR + ISR, anon key)
```

- **API** (`apps/api`): NestJS 11, port 8080. Fetches video stats, records snapshots, computes `VPH = (currentViews - historicalViews) / hoursDifference`. Cron runs immediately on bootstrap in addition to the schedule. Exposes `POST /cron/track` for external triggers.
- **Web** (`apps/web`): Next.js 16 App Router, port 3000. SSR leaderboard with `export const revalidate = 300` (5-min ISR). Supabase clients: `lib/supabase/server.ts` (server components) and `lib/supabase/client.ts` (browser).

## Security

- API uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS, full write access).
- Web uses `SUPABASE_ANON_KEY` (RLS-enforced, read-only on public tables).
- Never commit `.env`. The `.env.example` shows the required variables.

## Conventions

- **Formatting**: Prettier with `singleQuote: true`, `trailingComma: "all"` (configured independently in each app's `.prettierrc`).
- **Linting**: ESLint flat config. API uses `typescript-eslint`; web uses `eslint-config-next` with `core-web-vitals` + TypeScript presets.
- **No shared packages** — each app has independent tsconfig, ESLint, and type definitions.
- **No CI/CD** — no GitHub Actions, no pre-commit hooks.
- **No tests written yet** — Jest is configured for the API but no `*.spec.ts` files exist. Web has no test framework.
- **render.yaml** at root deploys the API to Render.com.

## Quirks

- **Next.js 16 has breaking changes.** The existing `apps/web/AGENTS.md` warns to check `node_modules/next/dist/docs/` before writing Next.js code.
- **NestJS requires `experimentalDecorators: true` and `emitDecoratorMetadata: true`** in tsconfig. Module is `nodenext`.
- **Tailwind CSS v4** — config is in CSS, not `tailwind.config.ts`.
- **Shadcn/ui v4** — styled with `base-nova` theme. Component config is in `apps/web/components.json`.
