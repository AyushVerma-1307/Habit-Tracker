// =====================================================
// Streak Calculation - Timezone Aware
// =====================================================

import {
  subDays,
  parseISO,
  differenceInDays,
  getDay,
} from "date-fns";
import type { FrequencyDay } from "@/lib/types";

// Day name to number mapping
const DAY_MAP: Record<FrequencyDay, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/**
 * Check if a given date is a habit day based on frequency
 */
export function isHabitDay(
  date: Date,
  frequency: FrequencyDay[]
): boolean {
  const dayIndex = date.getDay();
  return frequency.some((day) => DAY_MAP[day] === dayIndex);
}

/**
 * Get the previous habit day (considering frequency)
 */
export function getPreviousHabitDay(
  date: Date,
  frequency: FrequencyDay[],
  maxDaysBack: number = 30
): Date | null {
  let cursor = subDays(date, 1);

  for (let i = 0; i < maxDaysBack; i++) {
    if (isHabitDay(cursor, frequency)) {
      return cursor;
    }
    cursor = subDays(cursor, 1);
  }

  return null;
}

/**
 * Calculate current streak for a habit
 * Considers frequency (e.g., weekdays only means no streak break on weekends)
 */
export function calculateStreak(
  checkins: string[], // Array of "YYYY-MM-DD" date strings
  frequency: FrequencyDay[],
  userTimezone: string
): number {
  if (!checkins.length) return 0;

  // Normalize checkin dates to handle potential date objects from Supabase
  const normalizedCheckins = checkins.map(c => {
    if (typeof c === 'object' && c !== null) {
      return String(c).split('T')[0];
    }
    return String(c).split('T')[0];
  });

  // Create a set of checkin dates for O(1) lookup
  const checkinSet = new Set(normalizedCheckins);

  // Use local date
  const todayStr = new Date().toLocaleDateString('en-CA');

  let streak = 0;
  let cursor = new Date();
  let todayCheckedIn = checkinSet.has(todayStr);

  // If today is a habit day and NOT checked in yet, start looking from yesterday
  if (!todayCheckedIn) {
    if (isHabitDay(cursor, frequency)) {
      // Today is a habit day but not checked in - check if there's a gap
      const yesterday = subDays(cursor, 1);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA');

      if (!checkinSet.has(yesterdayStr)) {
        // Gap found - streak is 0
        return 0;
      }
      // Start counting from yesterday
      cursor = yesterday;
    } else {
      // Today is not a habit day - find the previous habit day
      const prevHabitDay = getPreviousHabitDay(cursor, frequency);
      if (!prevHabitDay) return 0;
      cursor = prevHabitDay;
    }
  }

  // Walk backwards through habit days
  while (true) {
    const dateStr = cursor.toLocaleDateString('en-CA');

    if (checkinSet.has(dateStr)) {
      streak++;
    } else {
      break;
    }

    // Move to previous habit day
    const prevDay = getPreviousHabitDay(cursor, frequency);
    if (!prevDay) break;

    // Safety check: don't go back more than a year
    const daysBack = differenceInDays(new Date(), prevDay);
    if (daysBack > 365) break;

    cursor = prevDay;
  }

  return streak;
}

/**
 * Calculate longest streak for a habit (all time)
 */
export function calculateLongestStreak(
  checkins: string[],
  frequency: FrequencyDay[],
  userTimezone: string
): number {
  if (!checkins.length) return 0;

  // Normalize checkin dates to handle potential date objects from Supabase
  const normalizedCheckins = checkins.map(c => {
    if (typeof c === 'object' && c !== null) {
      return String(c).split('T')[0];
    }
    return String(c).split('T')[0];
  });

  // Sort checkins by date (ascending)
  const sorted = [...normalizedCheckins].sort();

  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sorted) {
    const date = parseISO(dateStr);

    if (prevDate === null) {
      // First checkin
      currentStreak = 1;
    } else {
      // Check if this checkin continues the streak
      let expectedDate = subDays(date, 1);

      // Find the next expected habit day
      while (!isHabitDay(expectedDate, frequency)) {
        expectedDate = subDays(expectedDate, 1);
      }

      const expectedStr = expectedDate.toLocaleDateString('en-CA');

      if (expectedStr === prevDate.toLocaleDateString('en-CA') ||
          checkins.includes(expectedStr)) {
        // This checkin is part of the current streak
        currentStreak++;
      } else {
        // Streak broken, start new one
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    prevDate = date;
  }

  // Don't forget to check the last streak
  longestStreak = Math.max(longestStreak, currentStreak);

  return longestStreak;
}

/**
 * Check if a habit is checked in for today (in user's timezone)
 */
export function isCheckedInToday(
  checkins: string[],
  userTimezone: string
): boolean {
  const todayStr = new Date().toLocaleDateString('en-CA');
  
  const normalizedCheckins = checkins.map(c => {
    if (typeof c === 'object' && c !== null) {
      return String(c).split('T')[0];
    }
    return String(c).split('T')[0];
  });
  
  return normalizedCheckins.includes(todayStr);
}

/**
 * Get all checkin dates for heatmap (last N days)
 */
export function getCheckinDatesForHeatmap(
  checkins: string[],
  days: number = 365
): { date: string; count: number }[] {
  // Normalize checkin dates to handle potential date objects from Supabase
  const normalizedCheckins = checkins.map(c => {
    if (typeof c === 'object' && c !== null) {
      return String(c).split('T')[0];
    }
    return String(c).split('T')[0];
  });

  const checkinMap = new Map<string, number>();

  for (const dateStr of normalizedCheckins) {
    const count = checkinMap.get(dateStr) || 0;
    checkinMap.set(dateStr, count + 1);
  }

  return Array.from(checkinMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Format streak for display
 */
export function formatStreak(streak: number): string {
  if (streak === 0) return "0";
  if (streak === 1) return "1 day";
  return `${streak} days`;
}

/**
 * Get milestone reached (if any)
 */
export function getMilestoneReached(streak: number): number | null {
  const milestones = [7, 21, 30, 66, 100, 200, 365];

  for (const milestone of milestones) {
    if (streak === milestone) {
      return milestone;
    }
  }

  return null;
}