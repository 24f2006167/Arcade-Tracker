# Arcade Tracker

Apna khud ka Google Skills Arcade points/badges/leaderboard tracker —
public Skills Boost profile se data fetch karta hai, history store karta
hai, aur leaderboard banata hai. Built with Next.js 14 + Supabase, free
deploy hota hai Vercel pe.

## 1. Local setup

```bash
cd arcade-tracker
npm install
cp .env.example .env.local
```

## 2. Supabase (free database) setup

1. https://supabase.com pe free account banao, naya project create karo.
2. Project ke andar **SQL Editor** kholo, `supabase/schema.sql` file ka
   pura content paste karke run karo. Isse `profiles` aur `snapshots`
   tables ban jayenge.
3. **Settings -> API** mein jao, ye 3 values copy karke `.env.local` mein
   daalo:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (secret, server-only)

## 3. Run locally

```bash
npm run dev
```

http://localhost:3000 par jaake apna public profile URL daalo, e.g.
`https://www.skills.google/public_profiles/a5309058-2350-4efb-a138-c0140422ba21`

Profile ko track karne ke liye Skills Boost account settings mein
"Make profile public" ON hona chahiye (account settings page mein
checkbox milega).

## 4. Deploy free on Vercel

1. Is project ko GitHub repo mein push karo.
2. https://vercel.com pe jaake "Import Project" se us repo ko connect karo.
3. Deploy karte waqt Environment Variables mein wahi 3 keys daal do jo
   `.env.local` mein hain.
4. Deploy — bas, live ho jayega free tier pe.

## How the scraper works (important to know)

`lib/scraper.ts` Google Skills ka public profile page fetch karta hai aur
do tareeke se data nikalne ki koshish karta hai:

1. JSON extraction (primary): Page ke andar embedded JSON state
   (Next.js/Angular hydration data) dhoondta hai aur usmein se badge
   arrays nikalta hai — ye sabse reliable hai.
2. DOM/text fallback: Agar JSON nahi milta, to HTML elements aur text
   patterns (jaise "X points") se best-effort data nikalta hai.

Google apne site ka HTML/JS structure kabhi bhi badal sakta hai. Agar
dashboard pe badges 0 dikhe ya points galat aaye, to:

1. Apna public profile URL browser mein kholo.
2. DevTools se actual HTML/JSON structure dekho.
3. `lib/scraper.ts` mein `extractFromJson` ya `extractFromDom` functions
   ke selectors/keys ko us structure ke hisaab se update karo.

## Features included

- Add profile — public profile URL/ID se points + badges fetch karke
  database mein save karta hai
- Dashboard — scoreboard (points/badges/snapshots), points-over-time
  chart, full badge grid (type-wise color coded: game/trivia/skill)
- Leaderboard — saare tracked profiles points ke hisaab se ranked
- History — har refresh ek naya snapshot save karta hai, isse trend
  chart banta hai (daily refresh karoge to better history milegi)
- Refresh button — manually latest data dobara fetch karta hai

## Optional: auto-refresh on a schedule

Vercel ke free Cron Jobs se daily auto-refresh add kar sakte ho.
`vercel.json` mein ye add karo aur ek `/api/cron-refresh` route banao jo
saare tracked profiles ko loop karke refresh logic chalaye:

```json
{
  "crons": [{ "path": "/api/cron-refresh", "schedule": "0 6 * * *" }]
}
```
