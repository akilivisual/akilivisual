# AkiliVisual 2.0 — Claude Code Context

## Project Identity
This is the **AkiliVisual** project. Not bEMG, not Victory Designs — AkiliVisual.

## Supabase
- Project: AkiliVisual
- Project ID: `zpdumcfqihpskailwcah`
- URL: `https://zpdumcfqihpskailwcah.supabase.co`
- **NOTE:** The Supabase MCP is connected to a different account (bEMG). Do not use the Supabase MCP for this project — use SQL scripts and give them to Bryan to run directly in the Supabase dashboard.

## Environment Variables Required
`.env.local` must contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://zpdumcfqihpskailwcah.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
```
The service role key is at: supabase.com/dashboard/project/zpdumcfqihpskailwcah/settings/api

## Architecture
Stage → Canvas → Modules → Actors (hierarchical cinematic runtime)
- Admin UI: `/admin` — canvas management, module/actor editing, media library
- Runtime: `/` — StageCarousel (scroll-snap, all canvases)
- Preview: `/preview/[slug]` — single canvas preview (used in admin split-screen)

## Server Actions
All writes use `getAdminSupabase()` (service role key, bypasses RLS).
All reads also use `getAdminSupabase()`.
Client-side media uploads use the anon key directly.

## Key Files
- `app/admin/components/ModuleEditPanel.tsx` — actor/module editing panel
- `app/admin/components/ModuleList.tsx` — module list with drag-to-reorder
- `app/admin/components/MediaLibrary.tsx` — media upload and grid
- `app/admin/actions/modules.ts` — server actions: updateModule, updateActor, addActor, addModule, deleteActor, deleteModule
- `app/admin/actions/media.ts` — server actions: createMediaAsset, deleteMediaAsset
- `lib/supabase/admin.ts` — admin fetch functions
- `lib/schema/types.ts` — all TypeScript types

## Deployment
GitHub repo: akilivisual/akilivisual → auto-deploys to Vercel.
The Vercel MCP may not have access to this project — check the Vercel dashboard directly if needed.
