<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

Living Eamon is a single Next.js 16 app (App Router, TypeScript, Tailwind CSS v4, React 19). There is no separate backend — API routes live under `app/api/`. The AI narrator "Jane" uses the Anthropic Claude API; player persistence uses Supabase.

### Running the app

- **Dev server:** `npm run dev` (port 3000)
- **Lint:** `npm run lint` (ESLint)
- **Build:** `npm run build` (requires Supabase env vars to be set; build collects page data at build time and the Supabase client initialization will throw if `NEXT_PUBLIC_SUPABASE_URL` is missing)

### Environment variables

Four secrets are required for full functionality (set in `.env.local`):

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |

Without these, the app still starts and the landing page renders. The static game engine (movement, combat, banking, inventory) works without external services. Only AI narration (NPC conversations, moral choices, object examinations) and player persistence fail gracefully.

### Gotchas

- `npm run build` **fails** without valid Supabase env vars because `lib/supabase.ts` eagerly calls `createClient()` at module scope. The dev server handles this gracefully; production build does not.
- The ESLint config uses `eslint/config` imports (flat config) specific to ESLint v9+. The repo has pre-existing lint warnings (unused vars in `gameEngine.ts`) and errors (unescaped entities in `page.tsx`).
- `.env*` files are gitignored. Use `.env.local` for local secrets.
- No test framework is configured — there are no automated tests in this repo.
- When secrets are injected as environment variables (e.g. via Cursor Secrets), you must write them to `.env.local` before starting the dev server. Next.js loads env vars from `.env.local` at startup; shell-level exports alone are not picked up by the Next.js runtime for `NEXT_PUBLIC_*` vars.
