// User types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string;
  is_pro?: boolean;
  pro_features?: Record<string, boolean>;
  // Nudge protection
  nudge_quiet_hours_enabled?: boolean;
  nudge_quiet_hours_start?: string;
  nudge_quiet_hours_end?: string;
  nudge_rate_limit_per_day?: number;
  created_at: string;
}

// Habit types
export type FrequencyDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  color: string | null;
  frequency: FrequencyDay[];
  is_public: boolean;
  created_at: string;
}

// Check-in types
export interface CheckIn {
  id: string;
  habit_id: string;
  user_id: string;
  checked_date: string; // "YYYY-MM-DD"
  created_at: string;
}

// Streak types
export interface Streak {
  habit_id: string;
  current_streak: number;
  longest_streak: number;
  last_checkin_date: string | null;
}

// Reaction types
export interface Reaction {
  id: string;
  habit_id: string;
  session_id: string;
  emoji: string;
  created_at: string;
}

// Nudge types
export interface Nudge {
  id: string;
  habit_id: string;
  user_id: string;
  from_name: string | null;
  message: string | null;
  created_at: string;
}

// Comment types
export interface Comment {
  id: string;
  habit_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  author?: {
    username: string;
    name: string | null;
    avatar_url: string | null;
  };
}

// Habit with computed data
export interface HabitWithStreak extends Habit {
  current_streak: number;
  longest_streak: number;
  is_checked_in_today: boolean;
  checkins?: string[]; // array of "YYYY-MM-DD" dates for heatmap
}

// Public user profile
export interface PublicProfile {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  habits: HabitWithStreak[];
}

// Milestone types
export const MILESTONES = [7, 21, 30, 66, 100, 200, 365] as const;
export type Milestone = (typeof MILESTONES)[number];

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: "nudge" | "reaction" | "milestone" | "reminder";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Analytics types
export interface WeeklyReport {
  week: string;
  completion_rate: number;
  total_checkins: number;
  habits_completed: number;
  total_habits: number;
}

export interface MonthlyReport {
  month: string;
  completion_rate: number;
  total_checkins: number;
  habits_completed: number;
  total_habits: number;
}

export interface HabitAnalytics {
  habit_id: string;
  title: string;
  icon: string | null;
  color: string | null;
  completion_rate: number;
  total_checkins: number;
  current_streak: number;
  longest_streak: number;
  consistency_score: number;
}

export interface AnalyticsSummary {
  weekly: WeeklyReport[];
  monthly: MonthlyReport[];
  best_habits: HabitAnalytics[];
  worst_habits: HabitAnalytics[];
  consistency_score: number;
  total_checkins: number;
  average_completion_rate: number;
}

export interface BlockedUser {
  id: string;
  blocked_user_id: string;
  blocked_username: string;
  blocked_name: string | null;
  blocked_avatar: string | null;
  created_at: string;
}

// Habit Stacking (Pro feature)
export interface HabitChain {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  habits?: HabitWithStreak[];
}

export interface HabitChainLink {
  id: string;
  chain_id: string;
  habit_id: string;
  position: number;
  trigger_type: "after" | "before";
}