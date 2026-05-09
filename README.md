# =====================================================
# Habit Tracker - Setup Guide
# =====================================================

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready
3. Go to Settings > API and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep this safe!)

## 2. Run Database Schema

1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `supabase/schema.sql`
3. Run the SQL to create all tables and policies

## 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to APIs & Services > Credentials
4. Create OAuth Client ID (Web application)
5. Add authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Copy Client ID and Client Secret

## 4. Configure in Supabase

1. Go to Supabase Dashboard > Authentication > Providers > Google
2. Enable Google OAuth
3. Paste your Google Client ID and Client Secret
4. Save

## 5. Set up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` (your deployed URL or http://localhost:3000)

## 6. Install Dependencies

```bash
npm install
```

## 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 8. Test the App

1. Click "Continue with Google"
2. Sign in with your Google account
3. Complete onboarding (name, username, timezone)
4. Create your first habit
5. Check in to see the streak tracking!
6. Visit `/u/your-username` to see your public profile

## Optional: Enable Email (Phase 3)

### Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Add a domain or use their test API
3. Add `RESEND_API_KEY` to `.env.local`

### Upstash Redis (Rate Limiting)
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and Token
4. Add to `.env.local`

### hCaptcha
1. Sign up at [hcaptcha.com](https://hcaptcha.com)
2. Add a new site
3. Copy site key and secret
4. Add to `.env.local`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables on Vercel
Add all variables from `.env.example` in Vercel dashboard:
- Project Settings > Environment Variables

## Project Structure

```
/app
  /onboarding         → Sign up / setup flow
  /dashboard          → Main app (after login)
  /u/[username]       → Public profile page
  /auth/callback      → OAuth callback handler
  /api                → API routes (future)

/components
  /ui                 → shadcn/ui components
  HabitCard.tsx       → Habit display with check-in
  Heatmap.tsx         → GitHub-style activity grid
  PublicHabitCard.tsx → Public view with nudge/react
  MilestoneModal.tsx  → Celebration popup

/lib
  /supabase           → Client setup
  streak.ts           → Streak calculation logic
  store.ts            → Zustand state management
  types.ts            → TypeScript types
  utils.ts            → Utility functions

/supabase
  schema.sql          → Database schema
```