import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { HabitWithStreak, FrequencyDay } from "@/lib/types";
import { calculateStreak, isCheckedInToday } from "@/lib/streak";
import PublicProfileClient from "./PublicProfileClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, username")
    .ilike("username", username)
    .single();

  if (!user) {
    return {
      title: "User Not Found | HabitTracker",
    };
  }

  return {
    title: `${user.name || user.username}'s Habits | HabitTracker`,
    description: `Check out ${user.name || user.username}'s habit streaks and progress on HabitTracker.`,
    openGraph: {
      title: `${user.name || user.username}'s Habits`,
      description: "Track your habits, build streaks, and share your progress with the world.",
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Fetch user profile (case-insensitive)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .ilike("username", username)
    .single();

  if (userError || !user) {
    notFound();
  }

  // Fetch public habits
  const { data: habitsData } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  // Fetch checkins for all habits
  const habitIds = habitsData?.map((h) => h.id) || [];
  let checkinsByHabit: Record<string, string[]> = {};

  if (habitIds.length > 0) {
    const { data: checkinsData } = await supabase
      .from("checkins")
      .select("habit_id, checked_date")
      .in("habit_id", habitIds)
      .order("checked_date", { ascending: false });

    // Group checkins by habit
    checkinsData?.forEach((checkin) => {
      if (!checkinsByHabit[checkin.habit_id]) {
        checkinsByHabit[checkin.habit_id] = [];
      }
      checkinsByHabit[checkin.habit_id].push(checkin.checked_date);
    });
  }

  // Calculate streaks for each habit
  const habitsWithStreaks: HabitWithStreak[] = (habitsData || []).map((habit) => {
    const checkins = checkinsByHabit[habit.id] || [];
    const frequency = habit.frequency as FrequencyDay[];
    const currentStreak = calculateStreak(checkins, frequency, user.timezone);
    const longestStreak = currentStreak; // TODO: Calculate longest properly

    return {
      ...habit,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      is_checked_in_today: isCheckedInToday(checkins, user.timezone),
      checkins,
    };
  });

  return (
      <PublicProfileClient
        user={{
          id: user.id,
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          email: user.email,
          timezone: user.timezone,
          is_pro: user.is_pro,
          reminder_enabled: user.reminder_enabled,
          reminder_time: user.reminder_time,
          created_at: user.created_at,
        }}
      habits={habitsWithStreaks}
      isOwner={authUser?.id === user.id}
    />
  );
}
