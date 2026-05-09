import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Habit color palette for selection
export const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
] as const;

// Habit icon options
export const HABIT_ICONS = [
  { emoji: "🏃", label: "Running" },
  { emoji: "💪", label: "Workout" },
  { emoji: "📚", label: "Reading" },
  { emoji: "💧", label: "Water" },
  { emoji: "🧘", label: "Meditation" },
  { emoji: "💤", label: "Sleep" },
  { emoji: "🥗", label: "Diet" },
  { emoji: "✍️", label: "Writing" },
  { emoji: "🎸", label: "Music" },
  { emoji: "💻", label: "Coding" },
  { emoji: "📝", label: "Journaling" },
  { emoji: "🎯", label: "Goals" },
  { emoji: "🚭", label: "No Smoking" },
  { emoji: "🍺", label: "No Alcohol" },
  { emoji: "🌅", label: "Early Riser" },
  { emoji: "🏋️", label: "Gym" },
  { emoji: "🚴", label: "Cycling" },
  { emoji: "🧠", label: "Learning" },
  { emoji: "💰", label: "Saving Money" },
  { emoji: "🙏", label: "Gratitude" },
] as const;

// Frequency presets
export const FREQUENCY_PRESETS = {
  daily: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const,
  weekdays: ["mon", "tue", "wed", "thu", "fri"] as const,
  weekdays_only: ["mon", "tue", "wed", "thu", "fri"] as const,
} as const;

// Timezone list (common timezones)
export const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Beijing" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
] as const;

// Day name mapping
export const DAY_NAMES: Record<string, string> = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export const DAY_SHORT_NAMES: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

// Generate unique session ID for anonymous users
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

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}