# 🔥 Habit Tracker with Public Accountability

## ✅ Implementation Complete - Phase 1 & 2 MVP

---

## 📌 Project Overview

A web app where users:
- Create habits and track daily streaks
- Get a **unique public link** to share their habit dashboard
- Let friends **react, comment, or "nudge"** them
- Feel social pressure that drives consistency and retention

**Tagline:** *"Don't break the chain. The internet is watching."*

---

## ✅ Completed Features

### Auth & Onboarding ✅
- Google OAuth via **Supabase Auth** (no NextAuth)
- Onboarding: pick from habit templates or create custom
- Set habit frequency: Daily / Weekdays / Custom days
- Set **timezone** during onboarding (required — used for streak calc)
- After onboarding completes → redirect to `/dashboard`
- If 0 habits created during onboarding → show empty state with CTA

### Habit Tracking ✅
- One-click daily check-in per habit
- Streak counter (current streak + longest streak)
- Calendar heatmap view (GitHub-style)
- Frequency-aware streak calculation (respects weekdays-only, etc.)

### Public Profile Page ✅
- Auto-generated URL: `yourapp.com/u/username`
- Shows all **public** habits, streaks, and heatmap
- If user has 0 public habits → show: *"No Public Habits Yet"*
- Visitors can:
  - 👊 **Nudge** — send motivation (stored in database)
  - 🔥 **React** with emoji — tracked via **anonymous session ID**
  - 💬 **Comment** — login required

### Core UI Components ✅
- `HabitCard` - Check-in button, streak display, heatmap toggle
- `Heatmap` - GitHub-style activity grid
- `PublicHabitCard` - Read-only with nudge/react UI
- `MilestoneModal` - Celebration + share (7, 21, 30, 66, 100 days)
- `EmptyState` - No habits / No public habits states
- `HabitFormModal` - Create/edit habits

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Styling | **Tailwind CSS** + shadcn/ui |
| State | **Zustand** |
| Animations | **Framer Motion** |
| Heatmap | **react-calendar-heatmap** |
| Auth | **Supabase Auth** (Google OAuth) |
| Database | **Supabase** (Postgres) |
| DB Client | **@supabase/supabase-js** |
| Date Utils | **date-fns** + **date-fns-tz** |

---

## 📁 Project Structure

```
/app
  /onboarding/page.tsx        → Sign up / setup flow
  /dashboard/page.tsx         → Main app (after login)
  /u/[username]/page.tsx       → Public profile (SSR)
  /u/[username]/PublicProfileClient.tsx
  /auth/callback/route.ts     → OAuth callback
  /api
    /habits/route.ts          → GET, POST habits
    /habits/[id]/route.ts     → PUT, DELETE habit
    /checkins/route.ts        → GET, POST, DELETE check-ins

/components
  /ui/                        → shadcn/ui primitives
  HabitCard.tsx               → Habit with check-in
  Heatmap.tsx                 → Calendar heatmap
  PublicHabitCard.tsx         → Public view
  MilestoneModal.tsx          → Celebration
  EmptyState.tsx              → Empty states
  HabitFormModal.tsx          → Create/edit form
  Toast.tsx                   → Notifications

/lib
  /supabase/
    client.ts                 → Browser client
    server.ts                 → Server client
    middleware.ts             → Middleware client
  streak.ts                   → Streak calculation (timezone-aware)
  store.ts                    → Zustand state
  types.ts                    → TypeScript types
  utils.ts                    → Utilities

/supabase
  schema.sql                  → Database schema + RLS

middleware.ts                  → Route protection
```

---

## 🗃️ Database Schema

Run `supabase/schema.sql` in Supabase SQL Editor.

### Tables
- `users` - Profile + timezone
- `habits` - User's habits with frequency
- `checkins` - Daily check-ins (unique per habit+date)
- `reactions` - Anonymous emoji reactions (session-based)
- `nudges` - Visitor nudges with optional message
- `comments` - Logged-in user comments

### Security (RLS)
- Users can only access their own habits/checkins
- Public habits are viewable by anyone
- Reactions/Nudges have no auth requirement
- Comments require login

---

## 🧠 Streak Calculation

The streak logic is **frequency-aware**:
- Daily habits: expects check-in every day
- Weekday habits: skips weekends automatically
- Custom: respects selected days only

```typescript
// lib/streak.ts
calculateStreak(checkins, frequency, userTimezone)
```

---

## 🚀 Next Steps (Phase 3+)

### Phase 3 - Nudge & Notifications
- [ ] Rate limiting for nudges (Upstash Redis)
- [ ] hCaptcha protection
- [ ] Email notifications via Resend
- [ ] 9 PM reminder cron job (per timezone)

### Phase 4 - Virality & Polish
- [ ] OG image generation (Satori)
- [ ] Share milestone cards
- [ ] Mobile responsive polish
- [ ] Posthog analytics

### Phase 5 - Monetization
- [ ] Lemon Squeezy integration
- [ ] Feature gates (3 habits free, Pro unlimited)
- [ ] Billing portal

---

## 📣 Quick Start

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase + Google OAuth credentials
3. Run `supabase/schema.sql` in your Supabase project
4. Run `npm install && npm run dev`
5. Visit http://localhost:3000

---

*Ship fast. Share early. Let the streak do the marketing.*