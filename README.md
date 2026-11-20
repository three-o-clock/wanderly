# Wanderly – trip planner (React + Vite, Tailwind, Supabase, Vercel)

1. Create a Supabase project. In SQL Editor, run `supabase/schema.sql`.
2. Copy `.env.example` to `.env` and paste your Project URL and anon key (Project Settings → API).
3. `npm install` then `npm run dev`.
4. For quick demos, turn off "Confirm email" in Supabase → Authentication → Providers → Email.
5. Deploy: push to GitHub, import in Vercel, add the same two env vars. `vercel.json` handles page refreshes.

## Upgrading from v1
Run `supabase/migration_v2.sql` once (after `schema.sql`). It adds covers, itineraries, group trips, expenses and the `covers` storage bucket.

## AI itineraries (Gemini via a Supabase Edge Function)
1. Create a key at https://aistudio.google.com/apikey
2. In the project folder:
   ```
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   npx supabase secrets set GEMINI_API_KEY=your-key
   npx supabase functions deploy plan-trip
   ```
3. Model names change. If plans stop coming back, set the list: `npx supabase secrets set GEMINI_MODELS=gemini-3.5-flash,gemini-3.5-flash-lite`
Never put the Gemini key in `.env` with a `VITE_` prefix: it would be public in the browser bundle.
