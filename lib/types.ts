// User types
export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string;
  is_pro?: boolean;
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