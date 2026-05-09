# Database Architecture - Habit Tracker

## Overview

The Habit Tracker uses PostgreSQL via Supabase as its database backend. The schema is defined in `supabase/schema.sql` and includes six core tables with Row Level Security (RLS) policies.

---

## Table Relationships

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │     habits      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───────┤ user_id (FK)    │
│ email           │       │ id (PK)         │
│ username        │       └────────┬────────┘
│ name            │                │
│ avatar_url      │       ┌────────┴────────┐
│ timezone        │       │                 │
│ is_pro          │       ▼                 ▼
└─────────────────┘ ┌──────────┐   ┌─────────────┐
                    │ checkins │   │  reactions  │
                    ├──────────┤   ├─────────────┤
                    │ habit_id │◄──│ habit_id(FK)│
                    │ user_id  │   │ session_id │
                    │ checked_ │   │ emoji       │
                    │ date     │   └─────────────┘
                    └──────────┘
                         │
                         ▼
                    ┌──────────┐   ┌─────────────┐
                    │ nudges   │   │  comments  │
                    ├──────────┤   ├─────────────┤
                    │ habit_id │◄──│ habit_id(FK)│
                    │ user_id  │   │ author_id   │
                    │ from_name│   │ content     │
                    │ message  │   └─────────────┘
                    └──────────┘
```

---

## Tables

### 1. users

**Purpose**: Stores user profile information linked to Supabase Auth.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  timezone text NOT NULL DEFAULT 'UTC',
  is_pro boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, FK→auth.users | Links to Supabase Auth |
| `email` | text | UNIQUE, NOT NULL | User email address |
| `username` | text | UNIQUE, NOT NULL | Public profile URL slug |
| `name` | text | NULLABLE | Display name |
| `avatar_url` | text | NULLABLE | Profile picture URL |
| `timezone` | text | NOT NULL, DEFAULT 'UTC' | For streak calculations |
| `is_pro` | boolean | DEFAULT false | Pro tier flag |
| `created_at` | timestamptz | DEFAULT now() | Account creation time |

**Indexes**:
- Primary key on `id`
- Unique index on `email`
- Unique index on `username`

**RLS Policies**:
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can create their own profile if it's missing
CREATE POLICY "Users can create own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Anyone can view public profiles
CREATE POLICY "Anyone can view public user profiles"
  ON public.users FOR SELECT
  USING (true);
```

**Auto-Creation Trigger**:
```sql
-- Automatically create user profile when auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name, avatar_url, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2. habits

**Purpose**: Stores user-created habits with frequency settings.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text,
  color text,
  frequency text[] NOT NULL DEFAULT '{"mon","tue","wed","thu","fri","sat","sun"}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto-generated | Unique habit identifier |
| `user_id` | uuid | FK→users, NOT NULL | Owner of the habit |
| `title` | text | NOT NULL | Habit name |
| `icon` | text | NULLABLE | Emoji icon |
| `color` | text | NULLABLE | Hex color code |
| `frequency` | text[] | NOT NULL | Array of days (e.g., ["mon","tue","wed"]) |
| `is_public` | boolean | DEFAULT false | Whether visible on public profile |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |

**Frequency Format**:
```typescript
type FrequencyDay = "sun" | "mon" | "tue" | "wed" "thu" | "fri" | "sat";
// Examples:
["mon","tue","wed","thu","fri","sat","sun"]  // Daily
["mon","tue","wed","thu","fri"]              // Weekdays only
["sat","sun"]                                // Weekends only
```

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_public ON public.habits(is_public);
```

**RLS Policies**:
```sql
-- Users can view their own habits
CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own habits
CREATE POLICY "Users can create habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own habits
CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own habits
CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Anyone can view public habits
CREATE POLICY "Anyone can view public habits"
  ON public.habits FOR SELECT
  USING (is_public = true);
```

---

### 3. checkins

**Purpose**: Records daily check-ins for habits (unique per habit+date).

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checked_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, checked_date)
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto-generated | Unique check-in ID |
| `habit_id` | uuid | FK→habits, NOT NULL | Related habit |
| `user_id` | uuid | FK→users, NOT NULL | User who checked in |
| `checked_date` | date | NOT NULL | Date of check-in (YYYY-MM-DD) |
| `created_at` | timestamptz | DEFAULT now() | When check-in was made |

**Constraints**:
- `UNIQUE(habit_id, checked_date)` - One check-in per habit per day

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_checkins_habit_id ON public.checkins(habit_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON public.checkins(checked_date);
```

**RLS Policies**:
```sql
-- Users can view their own checkins
CREATE POLICY "Users can view own checkins"
  ON public.checkins FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own checkins
CREATE POLICY "Users can create checkins"
  ON public.checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own checkins (undo check-in)
CREATE POLICY "Users can delete own checkins"
  ON public.checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Public habits checkins are viewable by anyone
CREATE POLICY "Anyone can view checkins for public habits"
  ON public.checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = checkins.habit_id
      AND habits.is_public = true
    )
  );
```

**Usage in Application**:
```typescript
// Fetch check-ins for heatmap
const { data } = await supabase
  .from("checkins")
  .select("habit_id, checked_date")
  .in("habit_id", habitIds);

// Convert to streak calculation format
const checkinsByHabit: Record<string, string[]> = {};
checkinsData?.forEach((checkin) => {
  if (!checkinsByHabit[checkin.habit_id]) {
    checkinsByHabit[checkin.habit_id] = [];
  }
  checkinsByHabit[checkin.habit_id].push(checkin.checked_date);
});
```

---

### 4. reactions

**Purpose**: Anonymous emoji reactions on public habits (session-based).

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, session_id)
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto-generated | Unique reaction ID |
| `habit_id` | uuid | FK→habits, NOT NULL | Related public habit |
| `session_id` | text | NOT NULL | Anonymous session (localStorage) |
| `emoji` | text | NOT NULL | Reaction emoji (🔥, 👏, 💪) |
| `created_at` | timestamptz | DEFAULT now() | When reaction was added |

**Constraints**:
- `UNIQUE(habit_id, session_id)` - One reaction per session per habit

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_reactions_habit_id ON public.reactions(habit_id);
CREATE INDEX IF NOT EXISTS idx_reactions_session_id ON public.reactions(session_id);
```

**RLS Policies**:
```sql
-- Anyone can view reactions for public habits
CREATE POLICY "Anyone can view reactions"
  ON public.reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = reactions.habit_id
      AND habits.is_public = true
    )
  );

-- Anyone can add reactions (tracked by session_id)
CREATE POLICY "Anyone can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (true);

-- Anyone can update their own reactions
CREATE POLICY "Users can update own reactions"
  ON public.reactions FOR UPDATE
  USING (true);
```

**Session ID Generation**:
```typescript
// lib/utils.ts
export function generateSessionId(): string {
  if (typeof window !== "undefined") {
    let sessionId = localStorage.getItem("habit_tracker_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("habit_tracker_session_id", sessionId);
    }
    return sessionId;
  }
  return "";
}
```

---

### 5. nudges

**Purpose**: Motivational messages sent to habit owners by visitors.

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_name text,
  message text,
  created_at timestamptz DEFAULT now()
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto-generated | Unique nudge ID |
| `habit_id` | uuid | FK→habits, NOT NULL | Target habit |
| `user_id` | uuid | FK→users, NOT NULL | Habit owner (recipient) |
| `from_name` | text | NULLABLE | Sender's name (optional) |
| `message` | text | NULLABLE | Motivational message |
| `created_at` | timestamptz | DEFAULT now() | When nudge was sent |

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_nudges_habit_id ON public.nudges(habit_id);
CREATE INDEX IF NOT EXISTS idx_nudges_user_id ON public.nudges(user_id);
```

**RLS Policies**:
```sql
-- Anyone can create nudges (rate-limited at app level)
CREATE POLICY "Anyone can create nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (true);

-- Users can view nudges sent to their habits
CREATE POLICY "Users can view nudges for own habits"
  ON public.nudges FOR SELECT
  USING (auth.uid() = user_id);
```

**Usage Note**: Rate limiting should be implemented at the application level (not in the database) to prevent spam.

---

### 6. comments

**Purpose**: Comments on public habits (requires authentication).

**Schema**:
```sql
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Fields**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | uuid | PK, auto-generated | Unique comment ID |
| `habit_id` | uuid | FK→habits, NOT NULL | Target habit |
| `author_id` | uuid | FK→users, NULLABLE | Comment author |
| `content` | text | NOT NULL | Comment text |
| `created_at` | timestamptz | DEFAULT now() | When comment was posted |

**Indexes**:
```sql
CREATE INDEX IF NOT EXISTS idx_comments_habit_id ON public.comments(habit_id);
```

**RLS Policies**:
```sql
-- Anyone can view comments for public habits
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = comments.habit_id
      AND habits.is_public = true
    )
  );

-- Only logged-in users can create comments
CREATE POLICY "Logged in users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = author_id);
```

---

## Data Flow Examples

### Creating a New Habit

```typescript
// Client-side (onboarding/dashboard)
const { data, error } = await supabase
  .from("habits")
  .insert({
    user_id: user.id,
    title: "Morning Run",
    icon: "🏃",
    color: "#22c55e",
    frequency: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    is_public: true,
  })
  .select()
  .single();
```

### Checking In

```typescript
// Client-side (HabitCard)
const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");

const { data, error } = await supabase
  .from("checkins")
  .insert({
    habit_id: habitId,
    user_id: userId,
    checked_date: todayStr,
  })
  .select()
  .single();
```

### Fetching Public Profile Data

```typescript
// Server-side (app/u/[username]/page.tsx)

// 1. Fetch user profile
const { data: user } = await supabase
  .from("users")
  .select("*")
  .eq("username", username)
  .single();

// 2. Fetch public habits
const { data: habitsData } = await supabase
  .from("habits")
  .select("*")
  .eq("user_id", user.id)
  .eq("is_public", true);

// 3. Fetch check-ins for all habits
const habitIds = habitsData.map(h => h.id);
const { data: checkinsData } = await supabase
  .from("checkins")
  .select("habit_id, checked_date")
  .in("habit_id", habitIds);

// 4. Calculate streaks (client-side via lib/streak.ts)
const habitsWithStreaks = habitsData.map(habit => ({
  ...habit,
  current_streak: calculateStreak(
    checkinsByHabit[habit.id],
    habit.frequency,
    user.timezone
  ),
}));
```

---

## Security Model Summary

| Table | Owner | Public Read | Public Write | Auth Read | Auth Write |
|-------|-------|-------------|--------------|-----------|------------|
| `users` | ✅ | ✅ (profile) | ❌ | ✅ (own) | ✅ (own) |
| `habits` | ✅ | ✅ (if public) | ❌ | ✅ (own) | ✅ (own) |
| `checkins` | ✅ | ✅ (if habit public) | ❌ | ✅ (own) | ✅ (own) |
| `reactions` | ❌ | ✅ (if habit public) | ✅ (anonymous) | ✅ | ✅ (own session) |
| `nudges` | ✅ | ❌ | ✅ (anonymous) | ✅ (own) | ❌ |
| `comments` | ❌ | ✅ (if habit public) | ✅ (auth only) | ✅ | ✅ (own) |

---

## Performance Considerations

### Indexes

The following indexes optimize common queries:

```sql
-- User lookups
idx_habits_user_id        -- Fetch user's habits
idx_checkins_user_id      -- Fetch user's check-ins
idx_nudges_user_id        -- Fetch user's nudges

-- Public profile queries
idx_habits_is_public      -- Fetch public habits
idx_reactions_habit_id    -- Fetch reactions for habit
idx_comments_habit_id     -- Fetch comments for habit

-- Date-based queries
idx_checkins_date         -- Date range queries
idx_checkins_habit_id     -- Fetch check-ins for habit
```

### Query Optimization Tips

1. **Batch check-in fetches**: Fetch all check-ins for user's habits in one query, then group by habit in application code.

2. **Use `.single()` when expecting one row**: More efficient than `.maybeSingle()`.

3. **Limit columns**: Only select needed columns for public profiles.

4. **Consider caching**: Public profiles could benefit from ISR (Incremental Static Regeneration).

---

## Future Schema Additions (Phase 3+)

```sql
-- Reminders table (for email notifications)
CREATE TABLE IF NOT EXISTS public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  habit_id uuid REFERENCES public.habits(id),
  reminder_time time NOT NULL,
  timezone text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Analytics table (cached aggregations)
CREATE TABLE IF NOT EXISTS public.analytics (
  user_id uuid REFERENCES public.users(id),
  date date NOT NULL,
  total_checkins integer DEFAULT 0,
  total_habits integer DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
```

---

*Generated: May 2026*
*Version: 1.0.0*