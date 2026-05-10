import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { subDays, startOfWeek, endOfWeek, format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { calculateStreak } from "@/lib/streak";
import type { AnalyticsSummary, WeeklyReport, MonthlyReport, HabitAnalytics, FrequencyDay } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_pro, timezone")
      .eq("id", authUser.id)
      .single();

    if (!profile?.is_pro) {
      return NextResponse.json({ error: "Pro feature" }, { status: 403 });
    }

    const timezone = profile.timezone || "UTC";
    const userTz = timezone;

    const now = new Date();
    const todayInTz = toZonedTime(now, userTz);
    const todayStr = format(todayInTz, "yyyy-MM-dd");

    const { data: habitsData } = await supabase
      .from("habits")
      .select("id, title, icon, color, frequency")
      .eq("user_id", authUser.id);

    const habitIds = habitsData?.map((h) => h.id) || [];

    if (habitIds.length === 0) {
      return NextResponse.json({
        weekly: [],
        monthly: [],
        best_habits: [],
        worst_habits: [],
        consistency_score: 0,
        total_checkins: 0,
        average_completion_rate: 0,
      });
    }

    const { data: checkinsData } = await supabase
      .from("checkins")
      .select("habit_id, checked_date")
      .in("habit_id", habitIds)
      .order("checked_date", { ascending: false });

    const checkinsByHabit: Record<string, string[]> = {};
    checkinsData?.forEach((c) => {
      if (!checkinsByHabit[c.habit_id]) {
        checkinsByHabit[c.habit_id] = [];
      }
      checkinsByHabit[c.habit_id].push(c.checked_date);
    });

    const totalCheckins = checkinsData?.length || 0;

    // Weekly reports (last 8 weeks)
    const weekly: WeeklyReport[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(todayInTz, i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, "yyyy-MM-dd");
      const weekEndStr = format(weekEnd, "yyyy-MM-dd");

      let totalExpected = 0;
      let totalDone = 0;

      habitsData?.forEach((habit) => {
        const frequency: string[] = habit.frequency || [];
        const daysInRange = eachDayOfInterval({ start: weekStart, end: weekEnd });
        daysInRange.forEach((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayOfWeek = format(day, "EEE").toLowerCase() as string;
          const shortDay = dayOfWeek.slice(0, 3) as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
          if (frequency.includes(shortDay)) {
            totalExpected++;
            if (checkinsByHabit[habit.id]?.includes(dayStr)) {
              totalDone++;
            }
          }
        });
      });

      weekly.push({
        week: weekStartStr,
        completion_rate: totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0,
        total_checkins: totalDone,
        habits_completed: totalDone,
        total_habits: (habitsData || []).length,
      });
    }

    // Monthly reports (last 6 months)
    const monthly: MonthlyReport[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(todayInTz, i));
      const monthEnd = endOfMonth(monthStart);
      const monthStartStr = format(monthStart, "yyyy-MM-dd");
      const monthEndStr = format(monthEnd, "yyyy-MM-dd");

      let totalExpected = 0;
      let totalDone = 0;

      habitsData?.forEach((habit) => {
        const frequency: string[] = habit.frequency || [];
        const daysInRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
        daysInRange.forEach((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayOfWeek = format(day, "EEE").toLowerCase();
          const shortDay = dayOfWeek.slice(0, 3) as "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
          if (frequency.includes(shortDay)) {
            totalExpected++;
            if (checkinsByHabit[habit.id]?.includes(dayStr)) {
              totalDone++;
            }
          }
        });
      });

      monthly.push({
        month: monthStartStr,
        completion_rate: totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0,
        total_checkins: totalDone,
        habits_completed: totalDone,
        total_habits: (habitsData || []).length,
      });
    }

    // Per-habit analytics
    const habitAnalytics: HabitAnalytics[] = habitsData?.map((habit) => {
      const checkins = checkinsByHabit[habit.id] || [];
      const frequency = (habit.frequency || []) as FrequencyDay[];

      // Last 30 days
      const last30Days = eachDayOfInterval({ start: subDays(todayInTz, 30), end: todayInTz });
      let expected30 = 0;
      let done30 = 0;

      last30Days.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayOfWeek = format(day, "EEE").toLowerCase();
        const shortDay = dayOfWeek.slice(0, 3) as FrequencyDay;
        if (frequency.includes(shortDay)) {
          expected30++;
          if (checkins.includes(dayStr)) {
            done30++;
          }
        }
      });

      // Use the proper streak calculation from streak.ts
      const currentStreak = calculateStreak(checkins, frequency, userTz);

      // Calculate longest streak by checking each prefix
      let longestStreak = currentStreak;
      if (checkins.length > 1) {
        const sortedCheckins = [...checkins].sort();
        for (let i = 1; i <= sortedCheckins.length; i++) {
          const prefix = sortedCheckins.slice(0, i);
          const streakForPrefix = calculateStreak(prefix, frequency, userTz);
          if (streakForPrefix > longestStreak) longestStreak = streakForPrefix;
        }
      }

      // Consistency score (0-100) - based on completion rate + streak bonus
      let consistencyScore = 0;
      if (expected30 > 0) {
        const rate = done30 / expected30;
        const streakBonus = Math.min(currentStreak * 2, 20);
        consistencyScore = Math.min(100, Math.round((rate * 100 * 0.7) + streakBonus));
      }

      return {
        habit_id: habit.id,
        title: habit.title,
        icon: habit.icon,
        color: habit.color,
        completion_rate: expected30 > 0 ? Math.round((done30 / expected30) * 100) : 0,
        total_checkins: checkins.length,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        consistency_score: consistencyScore,
      };
    }) || [];

    const sortedByCompletion = [...habitAnalytics].sort((a, b) => b.completion_rate - a.completion_rate);
    const bestHabits = sortedByCompletion.slice(0, 3);
    const worstHabits = sortedByCompletion.slice(-3).reverse();

    const avgCompletion = habitAnalytics.length > 0
      ? Math.round(habitAnalytics.reduce((sum, h) => sum + h.completion_rate, 0) / habitAnalytics.length)
      : 0;

    const overallConsistency = habitAnalytics.length > 0
      ? Math.round(habitAnalytics.reduce((sum, h) => sum + h.consistency_score, 0) / habitAnalytics.length)
      : 0;

    return NextResponse.json({
      weekly,
      monthly,
      best_habits: bestHabits,
      worst_habits: worstHabits,
      consistency_score: overallConsistency,
      total_checkins: totalCheckins,
      average_completion_rate: avgCompletion,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
