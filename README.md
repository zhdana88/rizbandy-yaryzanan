# Rizbandy

A public React/TypeScript application built with Vite and Bun. Public visitors
can view the league data; the owner signs in with an emailed magic link to edit
it. Supabase provides authentication, PostgreSQL storage, row-level security,
and realtime updates. Vercel can host the frontend and deploy it from GitHub.

## Run locally

**Prerequisite:** [Bun](https://bun.sh/)

```powershell
bun install
Copy-Item .env.example .env.local
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` after
creating the Supabase project (see setup below), then run:

```powershell
bun run dev
bun run typecheck
bun run build
```

The Supabase URL and publishable/anon key are public browser configuration.
Never add a service-role key, password, or other secret to a `VITE_` variable.
The app's anonymous read access makes all data in its shared `app_state` row
public, including finance records. Do not put private information in that row.
The deployment also sets browser security headers through `vercel.json`; these
do not replace Supabase row-level security or safe handling of public data.

## PWA, offline use, and delivery performance

The app includes a web manifest and a small service worker. The production
build script precaches the versioned entry JavaScript/CSS graph and app shell;
visited lazy-loaded chunks are cached as they are requested. Navigations use
the network first with a four-second timeout and fall back to the cached app
shell. Supabase, `/api/` endpoints, and cross-origin requests are never cached,
so offline mode cannot present cached API responses as live data. The service
worker updates its cache version when the entry asset graph changes.

Offline mode requires at least one successful online load to cache the app.
Previously saved browser data may be displayed offline; live updates and cloud
saves require connectivity. Admin edits made offline are only in that browser's
local storage and are **not queued or automatically synchronized**. Reconnect
and check the live data before making further changes. This static PWA improves
resilience but cannot guarantee 24/7 availability or replace Supabase uptime.

Vercel's global CDN serves the static Vite output; `vercel.json` gives hashed
`/assets/` files a one-year immutable cache policy while keeping the app shell
and service worker revalidatable. Cloudflare Pages reads `public/_headers` for
the corresponding asset and shell policies. Both platforms provide edge
delivery/compression automatically; keep API/database traffic uncached. For
availability, monitor both the hosting deployment and Supabase project status.

## Configure Supabase

1. Create a Supabase project under your account.
2. In **SQL Editor**, run these migrations in timestamp order:
   [`supabase/migrations/20261029000000_app_state.sql`](./supabase/migrations/20261029000000_app_state.sql),
   [`supabase/migrations/20261029010000_harden_app_state_writes.sql`](./supabase/migrations/20261029010000_harden_app_state_writes.sql)
   The first creates a single shared state row table, an owner membership
   table, RLS policies, and enables Realtime. The second explicitly revokes
   table writes except authenticated insert/update and re-applies the allowlisted
   policies. Public clients can only read app state.
3. In **Authentication → Providers → Email**, enable email magic links. Disable
   public sign-ups. Invite your own email from **Authentication → Users**; do
   not enable self-service account creation. For production delivery, configure
   a trusted SMTP provider in Supabase.
4. After the owner account exists, add its Supabase user UUID to the private
   admin allowlist using the SQL Editor. Replace the sample email; do not commit
   your actual email in a public repo:

   ```sql
   insert into public.app_admins (user_id)
   select id
   from auth.users
   where lower(email) = lower('you@example.com')
   on conflict (user_id) do nothing;
   ```

   Check that exactly one row was added:

   ```sql
   select a.user_id, u.email
   from public.app_admins a
   join auth.users u on u.id = a.user_id;
   ```

   The allowlist stores the account UUID, and clients cannot add or change
   memberships. Keep only your own UUID in this table for single-admin access.
   The app checks membership before exposing admin controls and before cloud
   writes; PostgreSQL privileges and RLS independently enforce the permission.
5. In **Project Settings → API**, copy the Project URL and the publishable key
   (or legacy anon key) into local `.env.local`:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-publishable-or-anon-key
   ```

6. Configure the Supabase Auth **Site URL** and allowed redirect URLs for
   `http://localhost:3000` and your eventual Vercel production URL. Add Vercel
   preview URLs if you want to test magic-link sign-in on preview deployments.
7. Start the app and sign in once as the allowlisted owner. If the cloud row is
   empty, that first admin session publishes the data currently stored in that
   browser's local storage. Check it before initializing if you have multiple
   local copies of the data.

Do not expose a Supabase service-role key. It bypasses RLS and is not needed by
this browser-only app.

## Cloudflare AI Gateway (Workers AI)

The optional AI endpoint routes a fixed Workers AI chat model through AI
Gateway. The browser calls the same-origin `/api/ai` endpoint; the server
verifies the Supabase session and checks `app_admins` before sending a request
to Cloudflare. No Cloudflare credential is sent to the browser. The AI helper
is available at `src/lib/aiGateway.ts`; import `askAI` in a UI feature when you
want to expose it.

See Cloudflare's [AI Gateway setup](https://developers.cloudflare.com/ai-gateway/get-started/),
[Workers AI routing](https://developers.cloudflare.com/ai-gateway/usage/providers/workersai/),
and [gateway authentication](https://developers.cloudflare.com/ai-gateway/configuration/authentication/)
docs, plus the [Vercel Functions](https://vercel.com/docs/functions) or
[Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
docs for your deployment target.

1. In Cloudflare, create an AI Gateway and note its **Gateway ID** and account
   ID. This implementation uses Workers AI; the gateway is the observability,
   caching, and control layer, not a model by itself.
2. Create a Cloudflare API token with only the required account-level AI
   Gateway and Workers AI permissions. Do not use a global API key. Keep in
   mind Cloudflare documents AI Gateway Run permission as account-scoped,
   rather than restricted to one gateway.
3. Add these server values to local `.env.local` for local serverless testing:

   ```env
   CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
   CLOUDFLARE_AI_GATEWAY_ID=your-gateway-id
   CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
   ```

   Continue to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as
   described above. These two Supabase values are public client configuration;
   the Cloudflare token must never have a `VITE_` prefix.
4. For Vercel, the API adapter is `api/ai.ts`; add all three Cloudflare values
   under **Project → Settings → Environment Variables** for Preview/Production
   as appropriate. For Cloudflare Pages, the adapter is
   `functions/api/ai.ts`; add the same values under **Settings → Variables and
   Secrets**. Add the Supabase URL and anon/publishable key to the runtime
   environment too. Redeploy after changing variables.
5. Local frontend-only `bun run dev` does not run either serverless adapter.
   Use `vercel dev` when testing the Vercel adapter or Wrangler Pages
   development with the Pages Functions directory when testing Cloudflare.

The endpoint currently allows only users who are signed in and listed in
`public.app_admins`; other visitors receive 403. Prompt size and output length
are bounded and the model is selected server-side. Add platform-level rate
limits and monitor AI Gateway usage before enabling higher-volume use. This
endpoint is an optional integration and does not add an AI button or UI to the
app.

## GitHub and Vercel deployment

The workspace may not yet be a Git repository and there is no remote URL
configured. Create a repository under your own GitHub account, then run these
commands from the project directory, replacing the URL with your repository's
HTTPS or SSH URL:

```powershell
git init
git add .
git commit -m "Prepare Rizbandy for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Before `git add`, confirm `.env.local` is not staged (`git status --short`); the
repository ignores `.env` and `.env.*` except `.env.example`.

1. Sign in to Vercel with the account you want to own the deployment.
2. Choose **Add New → Project**, import the repository from GitHub, and select
   the project root.
3. Use the Vite framework preset, build command `npm run build`, and output
   directory `dist`. Vercel can install dependencies with `npm install`.
4. Add these environment variables in Vercel project settings for Production
   (and Preview if you use it):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy, then add the resulting Vercel domain to Supabase's Site URL and
   allowed redirect URLs. Trigger a redeploy after changing Vercel environment
   variables; Vite embeds them at build time.
6. Push future commits to `main` for automatic production deployments. Pull
   requests/other branches can use Vercel Preview deployments.

### Final pre-deploy checklist

- [ ] Run `npm run typecheck` and `npm run build` successfully.
- [ ] Confirm `.env.local` and all real credentials are absent from Git; only
  the Supabase URL and public anon/publishable key belong in Vercel `VITE_`
  variables. Never add a service-role key.
- [ ] Apply both Supabase migrations, disable public sign-ups, and verify that
  only the intended owner UUID is in `app_admins`.
- [ ] Test as a signed-out visitor that reads work and edits are unavailable;
  test as the owner that edits persist. RLS must reject writes by other users.
- [ ] Keep finance records and notes non-sensitive: the entire app-state row,
  including finance data, is intentionally publicly readable.
- [ ] Configure the Supabase production Site URL, redirect allowlist, and
  trusted SMTP; configure Preview URLs only if using preview sign-in.
- [ ] Set the two required Vercel environment variables for every environment
  you deploy, then redeploy after changing them.
- [ ] Verify the production URL on mobile and desktop, confirm browser security
  headers are present, and export a backup before the first live edit.

## Realtime and admin behavior

The app listens for changes to `public.app_state` and applies them without a
page refresh. Admin edits are debounced and written to Supabase; RLS rejects
writes from every account not listed in `app_admins`. Visitors have read-only
controls and receive database changes through Supabase Realtime.

The admin login is an emailed Supabase magic link, not a local password. The
user must already exist in Supabase Auth and their UUID must be allowlisted.
Do not enable public sign-ups. The browser hides/disables mutating controls and
guards app mutation handlers, but these client checks are usability controls;
the database grants and RLS policies are the security boundary. Do not add a
service-role key to the browser or a `VITE_` variable.

The first admin login initializes an empty database from that browser's saved
state. Back up or review that data first. Keep regular exports as a backup;
this is a lightweight single-row data model, suitable for this app's current
scale, not a replacement for a normalized database if its data volume or
concurrency grows substantially.
