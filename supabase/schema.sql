-- =====================================================
-- Habit Tracker Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE
-- Links to Supabase Auth.users (id matches auth.users.id)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  timezone text NOT NULL DEFAULT 'UTC',
  is_pro boolean DEFAULT false,
  reminder_enabled boolean DEFAULT false,
  reminder_time text DEFAULT '21:00',
  -- Pro-only: Nudge Protection
  nudge_quiet_hours_enabled boolean DEFAULT false,
  nudge_quiet_hours_start text DEFAULT '22:00',
  nudge_quiet_hours_end text DEFAULT '08:00',
  nudge_rate_limit_per_day int DEFAULT 5,
  -- Pro Features Toggle (JSONB)
  pro_features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create RLS policies for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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
  WITH CHECK (auth.uid() IS NOT NULL);

-- Anyone can view public profiles (for /u/[username] page)
CREATE POLICY "Anyone can view public user profiles"
  ON public.users FOR SELECT
  USING (true);

-- =====================================================
-- HABITS TABLE
-- =====================================================
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

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_is_public ON public.habits(is_public);

-- RLS policies for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- CHECKINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checked_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, checked_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checkins_habit_id ON public.checkins(habit_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON public.checkins(checked_date);

-- RLS policies for checkins
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- REACTIONS TABLE (Anonymous reactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, session_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reactions_habit_id ON public.reactions(habit_id);
CREATE INDEX IF NOT EXISTS idx_reactions_session_id ON public.reactions(session_id);

-- RLS policies for reactions (no auth required)
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

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
  USING (true); -- Session-based, validated at app level

-- =====================================================
-- NUDGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_name text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nudges_habit_id ON public.nudges(habit_id);
CREATE INDEX IF NOT EXISTS idx_nudges_user_id ON public.nudges(user_id);

-- RLS policies for nudges
ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Anyone can create nudges (rate-limited at app level)
CREATE POLICY "Anyone can create nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (true);

-- Users can view nudges sent to their habits
CREATE POLICY "Users can view nudges for own habits"
  ON public.nudges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete nudges on their own habits
CREATE POLICY "Users can delete nudges on own habits"
  ON public.nudges FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_habit_id ON public.comments(habit_id);

-- RLS policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

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

-- Habit owners can delete comments on their habits
CREATE POLICY "Habit owners can delete comments on their habits"
  ON public.comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = comments.habit_id
      AND habits.user_id = auth.uid()
    )
  );

-- =====================================================
-- BLOCKED USERS TABLE (Pro-only nudge protection)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocked list
CREATE POLICY "Users can view own blocked list"
  ON public.blocked_users FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add blocked users
CREATE POLICY "Users can add blocked users"
  ON public.blocked_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove blocked users
CREATE POLICY "Users can remove blocked users"
  ON public.blocked_users FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HABIT CHAINS TABLE (Pro-only Habit Stacking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habit_chains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habit_chains_user_id ON public.habit_chains(user_id);

ALTER TABLE public.habit_chains ENABLE ROW LEVEL SECURITY;

-- Users can view their own habit chains
CREATE POLICY "Users can view own habit chains"
  ON public.habit_chains FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create habit chains
CREATE POLICY "Users can create habit chains"
  ON public.habit_chains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own habit chains
CREATE POLICY "Users can update own habit chains"
  ON public.habit_chains FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own habit chains
CREATE POLICY "Users can delete own habit chains"
  ON public.habit_chains FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- HABIT CHAIN LINKS TABLE (Links habits to chains)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habit_chain_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL REFERENCES public.habit_chains(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  position int NOT NULL,
  trigger_type text DEFAULT 'after', -- 'after' = after previous habit, 'before' = before next
  created_at timestamptz DEFAULT now(),
  UNIQUE(chain_id, habit_id)
);

CREATE INDEX IF NOT EXISTS idx_habit_chain_links_chain_id ON public.habit_chain_links(chain_id);
CREATE INDEX IF NOT EXISTS idx_habit_chain_links_habit_id ON public.habit_chain_links(habit_id);

ALTER TABLE public.habit_chain_links ENABLE ROW LEVEL SECURITY;

-- Users can view their own chain links
CREATE POLICY "Users can view own habit chain links"
  ON public.habit_chain_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habit_chains
      WHERE habit_chains.id = habit_chain_links.chain_id
      AND habit_chains.user_id = auth.uid()
    )
  );

-- Users can create chain links
CREATE POLICY "Users can create habit chain links"
  ON public.habit_chain_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habit_chains
      WHERE habit_chains.id = chain_id
      AND habit_chains.user_id = auth.uid()
    )
  );

-- Users can update chain links
CREATE POLICY "Users can update own habit chain links"
  ON public.habit_chain_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.habit_chains
      WHERE habit_chains.id = chain_id
      AND habit_chains.user_id = auth.uid()
    )
  );

-- Users can delete chain links
CREATE POLICY "Users can delete own habit chain links"
  ON public.habit_chain_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.habit_chains
      WHERE habit_chains.id = chain_id
      AND habit_chains.user_id = auth.uid()
    )
  );

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGN UP
-- =====================================================
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

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- Uncomment to insert sample habits for development
-- =====================================================
/*
-- Insert sample habits for testing
INSERT INTO public.habits (user_id, title, icon, color, frequency, is_public) VALUES
  ('YOUR_USER_ID_HERE', 'Morning Run', '🏃', '#22c55e', '{"mon","tue","wed","thu","fri","sat","sun"}', true),
  ('YOUR_USER_ID_HERE', 'Read 30 minutes', '📚', '#3b82f6', '{"mon","tue","wed","thu","fri"}', true),
  ('YOUR_USER_ID_HERE', 'Drink 8 glasses of water', '💧', '#06b6d4', '{"mon","tue","wed","thu","fri","sat","sun"}', true);
*/
