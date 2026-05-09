"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/client";
import {
  useHabitsStore,
  useUIStore,
  useUserStore,
  useToastStore,
} from "@/lib/store";
import {
  calculateStreak,
  isCheckedInToday,
  getMilestoneReached,
} from "@/lib/streak";
import { HabitCard } from "@/components/HabitCard";
import { HabitFormModal } from "@/components/HabitFormModal";
import { EmptyState } from "@/components/EmptyState";
import { MilestoneModal } from "@/components/MilestoneModal";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  User,
  LogOut,
  Share2,
  Flame,
  Loader2,
  Target,
  PencilLine,
} from "lucide-react";
import type { FrequencyDay, HabitWithStreak } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const { user, setUser } = useUserStore();
  const {
    habits,
    setHabits,
    setIsLoading: setHabitsLoading,
    updateHabit,
    removeHabit,
  } = useHabitsStore();

  const { setShowMilestoneModal } = useUIStore();
  const { addToast } = useToastStore();

  const [isLoading, setIsLoading] = React.useState(true);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingHabit, setEditingHabit] =
    React.useState<HabitWithStreak | null>(null);

  const fetchHabits = React.useCallback(
    async (userId: string, timezone: string) => {
      setHabitsLoading(true);

      const { data: habitsData, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching habits:", error);
        addToast("Failed to load habits", "error");
        setHabitsLoading(false);
        return;
      }

      const habitIds = habitsData?.map((habit) => habit.id) || [];
      const checkinsByHabit: Record<string, string[]> = {};

      if (habitIds.length > 0) {
        const { data: checkinsData } = await supabase
          .from("checkins")
          .select("habit_id, checked_date")
          .in("habit_id", habitIds)
          .order("checked_date", { ascending: false });

        checkinsData?.forEach((checkin) => {
          if (!checkinsByHabit[checkin.habit_id]) {
            checkinsByHabit[checkin.habit_id] = [];
          }

          checkinsByHabit[checkin.habit_id].push(checkin.checked_date);
        });
      }

      const habitsWithStreaks: HabitWithStreak[] =
        habitsData?.map((habit) => {
          const checkins = checkinsByHabit[habit.id] || [];
          const frequency = habit.frequency as FrequencyDay[];
          const currentStreak = calculateStreak(
            checkins,
            frequency,
            timezone
          );

          return {
            ...habit,
            current_streak: currentStreak,
            longest_streak: Math.max(currentStreak, 0),
            is_checked_in_today: isCheckedInToday(checkins, timezone),
            checkins,
          };
        }) || [];

      setHabits(habitsWithStreaks);
      setHabitsLoading(false);
    },
    [addToast, setHabits, setHabitsLoading, supabase]
  );

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          router.push("/onboarding");
          return;
        }

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email || "",
          username: profile?.username || "",
          name:
            profile?.name || authUser.user_metadata?.full_name || null,
          avatar_url:
            profile?.avatar_url ||
            authUser.user_metadata?.avatar_url ||
            null,
          timezone: profile?.timezone || "UTC",
          created_at: profile?.created_at || authUser.created_at,
        });

        await fetchHabits(authUser.id, profile?.timezone || "UTC");
      } catch (error) {
        console.error("Error fetching data:", error);
        addToast("Failed to load dashboard", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [addToast, fetchHabits, router, setUser, supabase]);

  const handleCheckIn = async (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) return;

    const timezone = user?.timezone || "UTC";
    const todayStr = formatInTimeZone(
      new Date(),
      timezone,
      "yyyy-MM-dd"
    );

    if (habit.is_checked_in_today) {
      const { error } = await supabase
        .from("checkins")
        .delete()
        .eq("habit_id", habitId)
        .eq("checked_date", todayStr);

      if (error) {
        addToast("Failed to undo check-in", "error");
        return;
      }

      updateHabit(habitId, {
        is_checked_in_today: false,
        current_streak: Math.max(0, habit.current_streak - 1),
        checkins:
          habit.checkins?.filter((date) => date !== todayStr) || [],
      });

      addToast("Check-in undone", "info");
      return;
    }

    const { error } = await supabase.from("checkins").insert({
      habit_id: habitId,
      user_id: user?.id,
      checked_date: todayStr,
    });

    if (error) {
      addToast("Failed to check in", "error");
      return;
    }

    const newStreak = calculateStreak(
      [...(habit.checkins || []), todayStr],
      habit.frequency as FrequencyDay[],
      timezone
    );

    updateHabit(habitId, {
      is_checked_in_today: true,
      current_streak: newStreak,
      checkins: [...(habit.checkins || []), todayStr],
    });

    const milestone = getMilestoneReached(newStreak);

    if (milestone) {
      setTimeout(() => {
        setShowMilestoneModal(true, milestone);
      }, 500);
    } else {
      addToast("Checked in!", "success");
    }
  };

  const handleTogglePublic = async (habitId: string) => {
    const habit = habits.find((item) => item.id === habitId);
    if (!habit) return;

    const { error } = await supabase
      .from("habits")
      .update({ is_public: !habit.is_public })
      .eq("id", habitId);

    if (error) {
      addToast("Failed to update habit", "error");
      return;
    }

    updateHabit(habitId, {
      is_public: !habit.is_public,
    });

    addToast(
      habit.is_public
        ? "Habit is now private"
        : "Habit is now public",
      "success"
    );
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) {
      return;
    }

    const { error } = await supabase
      .from("habits")
      .delete()
      .eq("id", habitId);

    if (error) {
      addToast("Failed to delete habit", "error");
      return;
    }

    removeHabit(habitId);
    addToast("Habit deleted", "info");
  };

  const handleCreateHabit = async (data: {
    title: string;
    icon: string;
    color: string;
    frequency: FrequencyDay[];
    is_public: boolean;
  }) => {
    if (!user?.id) {
      addToast("Missing authenticated user", "error");
      throw new Error("Missing authenticated user");
    }

    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      title: data.title,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency,
      is_public: data.is_public,
    });

    if (error) {
      addToast(error.message || "Failed to create habit", "error");
      throw new Error(error.message);
    }

    await fetchHabits(user.id, user.timezone || "UTC");
    addToast("Habit created!", "success");
  };

  const handleEditHabit = async (data: {
    title: string;
    icon: string;
    color: string;
    frequency: FrequencyDay[];
    is_public: boolean;
  }) => {
    if (!editingHabit) {
      throw new Error("No habit selected");
    }

    const { error } = await supabase
      .from("habits")
      .update({
        title: data.title,
        icon: data.icon,
        color: data.color,
        frequency: data.frequency,
        is_public: data.is_public,
      })
      .eq("id", editingHabit.id);

    if (error) {
      addToast(error.message || "Failed to update habit", "error");
      throw new Error(error.message);
    }

    await fetchHabits(user?.id || "", user?.timezone || "UTC");

    setEditingHabit(null);
    addToast("Habit updated!", "success");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/onboarding");
  };

  const shareProfile = async () => {
    if (!user?.username) {
      addToast("Set your username first", "info");
      return;
    }

    const url = `${window.location.origin}/u/${user.username}`;

    if (navigator.share) {
      await navigator.share({
        title: "My Habit Tracker",
        text: "Check out my habits and streaks!",
        url,
      });

      return;
    }

    await navigator.clipboard.writeText(url);
    addToast("Profile link copied!", "success");
  };

  const totalCheckedToday = habits.filter(
    (habit) => habit.is_checked_in_today
  ).length;

  const totalHabits = habits.length;

  const bestStreak = habits.reduce(
    (best, habit) =>
      Math.max(best, habit.longest_streak, habit.current_streak),
    0
  );

  const completionPercent =
    totalHabits === 0
      ? 0
      : Math.round((totalCheckedToday / totalHabits) * 100);

  const recentHabitTitle = habits[0]?.title;

  const publicUrl =
    user?.username && typeof window !== "undefined"
      ? `${window.location.origin}/u/${user.username}`
      : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-5 w-5 text-white" />
              </div>

              <span className="text-xl font-bold">
                HabitTracker
              </span>
            </div>

            <div className="flex items-center gap-2">
              {user?.username && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareProfile}
                  className="hidden rounded-full sm:flex"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 w-10 rounded-full"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {user?.name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-56"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name || "User"}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {user?.username && (
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/u/${user.username}`)
                      }
                    >
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
          <section className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm"
            >
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                    Dashboard
                  </p>

                  <h1 className="mt-3 text-4xl font-bold tracking-tight">
                    Welcome back,
                    {" "}
                    {user?.name || "there"}
                  </h1>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {totalHabits === 0
                      ? "Create your first habit and start building consistency."
                      : totalCheckedToday === totalHabits
                        ? "Everything is completed today. Keep the streak alive tomorrow."
                        : `You are ${completionPercent}% done today with ${totalHabits - totalCheckedToday} habits left.`}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Completed Today",
                      value: `${totalCheckedToday}/${totalHabits}`,
                      icon: Target,
                    },
                    {
                      label: "Best Streak",
                      value: bestStreak.toString(),
                      icon: Flame,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <stat.icon className="h-4 w-4" />
                      </div>

                      <div className="text-lg font-semibold">
                        {stat.value}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Quick Add",
                  description:
                    "Create a new habit before motivation fades.",
                  icon: Plus,
                  action: () => setShowAddModal(true),
                  cta: "Create Habit",
                },
                {
                  title: "Profile",
                  description:
                    "Open your public profile and review your streaks.",
                  icon: PencilLine,
                  action: () =>
                    user?.username &&
                    router.push(`/u/${user.username}`),
                  cta: "View Profile",
                },
                {
                  title: "Public Link",
                  description: user?.username
                    ? `Share /u/${user.username}`
                    : "Set a username to unlock sharing.",
                  icon: Share2,
                  action: () =>
                    user?.username
                      ? shareProfile()
                      : router.push("/onboarding"),
                  cta: "Share",
                },
              ].map((item, index) => (
                <motion.button
                  key={item.title}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  onClick={item.action}
                  className="rounded-3xl border border-border/60 bg-card/80 p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <h2 className="mt-4 text-lg font-semibold">
                    {item.title}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm font-medium text-primary">
                    {item.cta}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Habit Board
                </h2>

                <p className="text-sm text-muted-foreground">
                  Track your consistency and keep streaks alive.
                </p>
              </div>

              <AnimatePresence mode="popLayout">
                {habits.length === 0 ? (
                  <div className="rounded-3xl border border-border/60 bg-card/80 p-4">
                    <EmptyState
                      type="no-habits"
                      onAddHabit={() => setShowAddModal(true)}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        userTimezone={user?.timezone || "UTC"}
                        isOwner={true}
                        onCheckIn={() => handleCheckIn(habit.id)}
                        onTogglePublic={() =>
                          handleTogglePublic(habit.id)
                        }
                        onDelete={() => handleDeleteHabit(habit.id)}
                        onEdit={() => setEditingHabit(habit)}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-3xl border border-border/60 bg-card/85 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/25 to-orange-500/20 text-xl font-bold text-primary">
                  {user?.name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xl font-semibold">
                    {user?.name || "Your profile"}
                  </h3>

                  <p className="truncate text-sm text-muted-foreground">
                    @{user?.username || "set-your-username"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm">
                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Email
                  </div>

                  <div className="mt-1 font-medium">
                    {user?.email}
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/60 p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Public URL
                  </div>

                  <div className="mt-1 break-all font-medium">
                    {publicUrl ||
                      "Set a username to generate a public profile link"}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Button
                  onClick={() =>
                    user?.username &&
                    router.push(`/u/${user.username}`)
                  }
                  className="gap-2 rounded-2xl"
                  disabled={!user?.username}
                >
                  <User className="h-4 w-4" />
                  View Profile
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(true)}
                  className="gap-2 rounded-2xl"
                >
                  <Plus className="h-4 w-4" />
                  Add Habit
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/85 p-6">
              <h3 className="text-lg font-semibold">
                Momentum Snapshot
              </h3>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Daily completion
                    </span>

                    <span className="font-medium">
                      {completionPercent}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-primary via-orange-400 to-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Tracked
                    </div>

                    <div className="mt-2 text-2xl font-semibold">
                      {totalHabits}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Checked Today
                    </div>

                    <div className="mt-2 text-2xl font-semibold">
                      {totalCheckedToday}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
                  <div className="text-sm font-medium text-primary">
                    Focus cue
                  </div>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {recentHabitTitle
                      ? `Start with "${recentHabitTitle}" and keep the momentum alive.`
                      : "Create one simple habit and focus on consistency first."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {habits.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-6 right-6"
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </main>

      <HabitFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSubmit={handleCreateHabit}
        mode="create"
      />

      <HabitFormModal
        open={!!editingHabit}
        onOpenChange={(open) => !open && setEditingHabit(null)}
        onSubmit={handleEditHabit}
        initialData={
          editingHabit
            ? {
                title: editingHabit.title,
                icon: editingHabit.icon || "🎯",
                color: editingHabit.color || "#ef4444",
                frequency: editingHabit.frequency as FrequencyDay[],
                is_public: editingHabit.is_public,
              }
            : undefined
        }
        mode="edit"
      />

      <MilestoneModal />
      <Toast />
    </div>
  );
}
