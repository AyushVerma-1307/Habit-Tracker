# Project Analysis - Habit Tracker

## Executive Summary

This document provides a comprehensive technical analysis of the Habit Tracker application - a full-stack web application built with Next.js 14, Supabase, and TypeScript. The application enables users to create, track, and share habit streaks with public accountability features.

---

## 1. High-Level Architecture Overview

### Technology Stack

| Layer | Technology | Version/Details |
|-------|------------|-----------------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | Strict mode enabled |
| Database | PostgreSQL | Via Supabase |
| Authentication | Supabase Auth | Google OAuth + Email/Password + Magic Link |
| State Management | Zustand | Client-side state |
| Styling | Tailwind CSS | With shadcn/ui components |
| Animations | Framer Motion | Page transitions & micro-interactions |
| Date Handling | date-fns + date-fns-tz | Timezone-aware calculations |
| Deployment | Vercel | Recommended |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Next.js    │  │   Zustand   │  │  Framer     │             │
│  │  App Router │  │   Stores    │  │  Motion     │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
│         │                │                                      │
│  ┌──────┴────────────────┴──────────────────────────────────┐   │
│  │              Supabase Client (Browser)                  │   │
│  │         - PKCE Flow for Auth                            │   │
│  │         - Direct DB Access (RLS Protected)              │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Auth      │  │  Database   │  │   RLS       │             │
│  │   Service   │  │  (Postgres) │  │   Policies  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Tables: users, habits, checkins,            │  │
│  │              reactions, nudges, comments                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Pages      │  │  API Routes │  │  Middleware │             │
│  │  (SSR/CSR)  │  │  (REST)     │  │  (Auth)     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │       Supabase Server Client (Cookie-based Auth)        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

### Directory Organization

```
/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API Routes (REST endpoints)
│   │   ├── account/              # Account management
│   │   ├── habits/               # Habit CRUD operations
│   │   ├── checkins/             # Check-in operations
│   │   └── [id]/                 # Specific resource handlers
│   ├── auth/                     # Authentication pages
│   │   ├── callback/             # OAuth callback handler
│   │   ├── confirm/              # Email confirmation
│   │   └── page.tsx              # Auth UI (sign in/sign up)
│   ├── dashboard/               # Main user dashboard
│   ├── onboarding/               # Multi-step onboarding flow
│   ├── u/[username]/             # Public profile pages (SSR)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirect)
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── switch.tsx
│   ├── EmptyState.tsx            # Empty state display
│   ├── HabitCard.tsx             # Habit with check-in UI
│   ├── HabitFormModal.tsx        # Create/edit habit form
│   ├── Heatmap.tsx               # GitHub-style heatmap
│   ├── MilestoneModal.tsx        # Celebration modal
│   ├── ProfileSettingsDialog.tsx # User settings
│   ├── PublicHabitCard.tsx       # Public profile habit view
│   ├── ThemeToggle.tsx           # Dark/light mode toggle
│   └── Toast.tsx                 # Notification system
│
├── lib/                          # Core library code
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client (PKCE)
│   │   ├── server.ts             # Server client (cookies)
│   │   └── middleware.ts         # Session refresh logic
│   ├── store.ts                  # Zustand state stores
│   ├── streak.ts                 # Streak calculation logic
│   ├── types.ts                  # TypeScript interfaces
│   └── utils.ts                  # Utilities & constants
│
├── supabase/                     # Supabase configuration
│   └── schema.sql                # Database schema + RLS
│
├── middleware.ts                 # Next.js middleware (auth)
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
└── package.json                  # Dependencies
```

### Architectural Decisions

1. **App Router over Pages Router**: Next.js 14 App Router provides better performance with React Server Components and streaming.

2. **Client-Side State with Zustand**: Lightweight state management without the complexity of Redux. Zustand stores handle:
   - User authentication state
   - Habits list with computed streaks
   - UI state (modals, sidebars)
   - Toast notifications

3. **Direct Supabase Access**: Rather than proxying all database calls through API routes, the application uses Supabase's client SDK directly from the browser with RLS policies for security. API routes are used for:
   - Cross-origin requests
   - Server-side operations
   - Complex aggregations

4. **PKCE Authentication Flow**: Uses Proof Key for Code Exchange to secure the OAuth flow in client-side applications.

---

## 3. Page Routes & Navigation

### Route Structure

| Route | Type | Purpose | Auth Required |
|-------|------|---------|---------------|
| `/` | Redirect | Routes to `/onboarding` or `/dashboard` | No |
| `/onboarding` | Client | Multi-step auth + profile + first habit | No |
| `/auth/callback` | Server | Handles OAuth code exchange | No |
| `/auth/page` | Client | Sign in/sign up page | No |
| `/dashboard` | Client | Main app with habit cards | Yes (middleware) |
| `/u/[username]` | Server | Public profile (SSR) | No |

### Middleware Protection

```typescript
// middleware.ts
const protectedRoutes = ["/dashboard"];

if (isProtectedRoute && !user) {
  return NextResponse.redirect("/onboarding");
}
```

---

## 4. Key Modules & Responsibilities

### Authentication Module (`/lib/supabase/*`)

**client.ts** - Browser-side Supabase client
- Creates singleton browser client
- Configures PKCE flow for OAuth
- Provides `createClient()` export

**server.ts** - Server-side Supabase client
- Handles cookie-based session management
- Provides session refresh via `cookies()`
- Safe to call from Server Components

**middleware.ts** - Session refresh
- Refreshes expired sessions
- Updates auth cookies
- Returns user object to middleware

### State Management (`/lib/store.ts`)

```typescript
// Four Zustand stores
useUserStore     // User profile & auth state
useHabitsStore   // Habits list with computed data
useUIStore       // UI state (modals, sidebar)
useToastStore    // Toast notifications
```

### Streak Calculation (`/lib/streak.ts`)

Core business logic for:
- `calculateStreak()` - Current streak (frequency-aware)
- `calculateLongestStreak()` - All-time best
- `isHabitDay()` - Check if day matches frequency
- `getPreviousHabitDay()` - Walk backwards through habit days
- `getMilestoneReached()` - Detect milestone achievements

### Types (`/lib/types.ts`)

TypeScript interfaces for all data structures:
- `User`, `Habit`, `CheckIn`, `Streak`
- `Reaction`, `Nudge`, `Comment`
- `HabitWithStreak` (computed type)
- `Milestone` constants

---

## 5. Security Implementation

### Authentication Security

1. **Supabase Auth** - Managed by Supabase with:
   - JWT tokens stored in httpOnly cookies
   - Automatic session refresh
   - Provider-specific security (Google OAuth, email/password)

2. **PKCE Flow** - Required for public clients:
   ```typescript
   // lib/supabase/client.ts
   auth: {
     flowType: "pkce",
   }
   ```

3. **Middleware Protection** - Server-side auth checks:
   ```typescript
   // middleware.ts
   const { user } = await updateSession(request);
   if (isProtectedRoute && !user) {
     redirect("/onboarding");
   }
   ```

### Database Security (RLS)

Row Level Security policies on all tables:

```sql
-- Example: Users can only see their own habits
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

-- Example: Anyone can view public habits
CREATE POLICY "Anyone can view public habits"
  ON public.habits FOR SELECT
  USING (is_public = true);
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
```

---

## 6. Performance Considerations

### Rendering Strategies

| Page | Strategy | Rationale |
|------|----------|-----------|
| `/u/[username]` | SSR | SEO for public profiles |
| `/dashboard` | CSR | User-specific, real-time data |
| `/onboarding` | CSR | Auth state needs client access |

### Optimizations Implemented

1. **Client-Side Caching** - Zustand stores persist in memory
2. **Optimistic Updates** - Immediate UI feedback on check-ins
3. **Lazy Loading** - Next.js automatic code splitting
4. **Database Indexes** - Index on `user_id`, `habit_id`, `checked_date`
5. **Singleton Pattern** - Supabase client reused across components

### Potential Improvements

- Add React Query for server state caching
- Implement virtual list for many habits
- Add pagination to check-in queries
- Cache public profiles with ISR

---

## 7. Dependencies & Packages

### Production Dependencies

```json
{
  "next": "14.x",
  "@supabase/ssr": "^0.x",
  "@supabase/supabase-js": "^2.x",
  "zustand": "^4.x",
  "framer-motion": "^11.x",
  "date-fns": "^3.x",
  "date-fns-tz": "^3.x",
  "react-calendar-heatmap": "^1.x",
  "tailwind-merge": "^0.x",
  "clsx": "^2.x",
  "lucide-react": "^0.x"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.x",
  "tailwindcss": "^3.x",
  "@types/react": "^18.x",
  "@types/node": "^20.x"
}
```

---

## 8. Development Workflow

### Setup

1. Copy `.env.example` to `.env.local`
2. Configure Supabase URL and anon key
3. Run schema in Supabase SQL Editor
4. Run `npm install`
5. Run `npm run dev`

### Key Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npx tsc --noEmit     # TypeScript check
```

### Environment Configuration

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |

---

## 9. Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Supabase Setup

1. Create new Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Configure Google OAuth in Authentication > Providers
4. Get URL and anon key for environment variables

---

## 10. Summary

The Habit Tracker application demonstrates a modern full-stack architecture with:

- **Clean separation of concerns** between UI, state, and data layers
- **Robust security** via Supabase RLS and authenticated routes
- **Type safety** throughout with TypeScript
- **Developer experience** with hot reloading and clear project structure
- **Scalability** ready for growth with proper indexes and caching patterns

The architecture prioritizes:
1. **User experience** with optimistic updates and smooth animations
2. **Developer experience** with clear file organization and type safety
3. **Security** with RLS policies and auth middleware
4. **Performance** with appropriate rendering strategies per page

---

*Generated: May 2026*
*Version: 1.0.0*