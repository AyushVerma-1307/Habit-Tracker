"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicHabitCard } from "@/components/PublicHabitCard";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";
import {
  useHabitsStore,
  useUIStore,
  useUserStore,
  useToastStore,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Copy,
  Flame,
  Globe,
  Loader2,
  LogOut,
  Save,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { formatRelativeTime, generateSessionId, TIMEZONES } from "@/lib/utils";
import type { HabitWithStreak } from "@/lib/types";

function getReadableTimezone(tz: string): string {
  const tzMap: Record<string, string> = {
    "America/New_York": "Eastern",
    "America/Chicago": "Central",
    "America/Denver": "Mountain",
    "America/Los_Angeles": "Pacific",
    "America/Anchorage": "Alaska",
    "Pacific/Honolulu": "Hawaii",
    "Europe/London": "London",
    "Europe/Paris": "Paris",
    "Europe/Berlin": "Berlin",
    "Asia/Tokyo": "Tokyo",
    "Asia/Shanghai": "Beijing",
    "Asia/Kolkata": "Mumbai",
    "Asia/Singapore": "Singapore",
    "Asia/Dubai": "Dubai",
    "Australia/Sydney": "Sydney",
    "Australia/Melbourne": "Melbourne",
    "Pacific/Auckland": "Auckland",
  };
  return tzMap[tz] || tz.split("/").pop()?.replace(/_/g, " ") || tz;
}

interface PublicProfileClientProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatar_url: string | null;
    email: string;
    timezone: string;
    is_pro?: boolean;
    reminder_enabled?: boolean;
    reminder_time?: string;
    created_at: string;
  };
  habits: HabitWithStreak[];
  isOwner: boolean;
}

export default function PublicProfileClient({
  user,
  habits,
  isOwner,
}: PublicProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const { addToast } = useToastStore();

  const [showNudgeModal, setShowNudgeModal] = React.useState(false);
  const [showCommentModal, setShowCommentModal] = React.useState(false);
  const [selectedHabitId, setSelectedHabitId] = React.useState<string | null>(null);
  const [nudgeName, setNudgeName] = React.useState("");
  const [nudgeMessage, setNudgeMessage] = React.useState("");
  const [commentContent, setCommentContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState("");
  const [name, setName] = React.useState(user.name || "");
  const [username, setUsername] = React.useState(user.username || "");
  const [timezone, setTimezone] = React.useState(user.timezone || "America/New_York");
  const [reminderEnabled, setReminderEnabled] = React.useState(user.reminder_enabled || false);
  const [reminderTime, setReminderTime] = React.useState(user.reminder_time || "21:00");

  const sessionId = React.useMemo(() => generateSessionId(), []);

  const [publicUrl, setPublicUrl] = React.useState("");
  
  React.useEffect(() => {
    setPublicUrl(`/u/${user.username}`);
  }, [user.username]);

  const bestStreak = habits.reduce(
    (best, habit) => Math.max(best, habit.current_streak, habit.longest_streak),
    0
  );
  const completedToday = habits.filter((habit) => habit.is_checked_in_today).length;

  const handleNudge = async () => {
    if (!selectedHabitId) return;

    setIsSubmitting(true);

    try {
      const { data: profile } = await supabase
        .from("users")
        .select("nudge_quiet_hours_enabled, nudge_quiet_hours_start, nudge_quiet_hours_end, nudge_rate_limit_per_day, is_pro")
        .eq("id", user.id)
        .single();

      if (profile?.is_pro) {
        if (profile.nudge_quiet_hours_enabled) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMin = now.getMinutes();
          const currentTime = currentHour * 60 + currentMin;
          const [startH, startM] = (profile.nudge_quiet_hours_start || "22:00").split(":").map(Number);
          const [endH, endM] = (profile.nudge_quiet_hours_end || "08:00").split(":").map(Number);
          const startTime = startH * 60 + startM;
          const endTime = endH * 60 + endM;

          const inQuietHours = startTime > endTime
            ? currentTime >= startTime || currentTime < endTime
            : currentTime >= startTime && currentTime < endTime;

          if (inQuietHours) {
            addToast("Nudges are paused during quiet hours", "info");
            setIsSubmitting(false);
            return;
          }
        }

        const { count } = await supabase
          .from("nudges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

        if (count && count >= (profile.nudge_rate_limit_per_day || 5)) {
          addToast("Nudge limit reached for today. Try again tomorrow.", "info");
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("nudges").insert({
        habit_id: selectedHabitId,
        user_id: user.id,
        from_name: nudgeName || "Anonymous",
        message: nudgeMessage,
      });

      if (!error) {
        setShowNudgeModal(false);
        setNudgeName("");
        setNudgeMessage("");
        setSelectedHabitId(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReact = async (habitId: string, emoji: string) => {
    await supabase.from("reactions").upsert(
      {
        habit_id: habitId,
        session_id: sessionId,
        emoji,
      },
      {
        onConflict: "habit_id,session_id",
      }
    );
  };

  const handleComment = async () => {
    if (!selectedHabitId || !commentContent.trim()) return;

    setIsSubmitting(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        window.location.href = "/onboarding";
        return;
      }

      const { error } = await supabase.from("comments").insert({
        habit_id: selectedHabitId,
        author_id: authUser.id,
        content: commentContent.trim(),
      });

      if (!error) {
        setShowCommentModal(false);
        setCommentContent("");
        setSelectedHabitId(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    setIsSavingProfile(true);

    try {
      const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "_");

      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("id")
        .eq("username", normalizedUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (existingError || existingUser) {
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({
          name: name || null,
          username: normalizedUsername,
          timezone,
          reminder_enabled: reminderEnabled,
          reminder_time: reminderTime,
        })
        .eq("id", user.id);

      if (!error) {
        window.location.href = `/u/${normalizedUsername}`;
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDelete !== "DELETE") return;

    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (response.ok) {
        await supabase.auth.signOut();
        router.replace("/onboarding");
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const openNudgeModal = (habitId: string) => {
    setSelectedHabitId(habitId);
    setShowNudgeModal(true);
  };

  const openCommentModal = (habitId: string) => {
    setSelectedHabitId(habitId);
    setShowCommentModal(true);
  };

  const copyProfileLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-grid-soft pointer-events-none fixed inset-0 opacity-40" />

      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center justify-between">
            
            {/* Left Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-105">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                StreakWatch
              </span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {isOwner ? (
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  size="sm"
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={copyProfileLink}
                  size="sm"
                  className="rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Copy className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href={isOwner ? "/dashboard" : "/onboarding"}>
            <Button
              variant="outline"
              className="rounded-xl gap-1.5 bg-background/80 hover:bg-background"
            >
              <span className="text-lg">←</span>
              {isOwner ? "Dashboard" : "Home"}
            </Button>
          </Link>
          
          {isOwner && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyProfileLink} className="rounded-xl gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <Button type="submit" form="profile-form" size="sm" disabled={isSavingProfile || !username.trim()} className="rounded-xl gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {isSavingProfile ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card via-card/95 to-primary/[0.03] p-6 md:p-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-transparent to-transparent rounded-full blur-3xl" />
          
          <div className="relative grid gap-8 lg:grid-cols-[1fr_1fr]">
            {/* Left: Profile Info */}
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-4xl font-bold text-white shadow-2xl shadow-orange-500/30">
                    {user.name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                  </div>
                  {user.is_pro && (
                    <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {user.name || user.username}
                  </h1>
                  <p className="mt-1 text-lg text-muted-foreground">@{user.username}</p>
                  {user.is_pro && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400">
                      <Sparkles className="h-3 w-3" />
                      Pro Member
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-2xl bg-background/60 border border-border/40 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                    <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none">{bestStreak}</div>
                    <div className="text-xs text-muted-foreground">Best streak</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-background/60 border border-border/40 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none">{completedToday}/{habits.length}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-background/60 border border-border/40 px-4 py-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-none">{formatRelativeTime(user.created_at)}</div>
                    <div className="text-xs text-muted-foreground">Joined</div>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    Public URL
                  </div>
                  <div className="mt-2 font-mono text-sm text-foreground/90 truncate">{publicUrl}</div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Timezone
                  </div>
                  <div className="mt-2 font-medium text-foreground/90">{getReadableTimezone(user.timezone)}</div>
                </div>
              </div>
            </div>

{isOwner ? (
              <form
                id="profile-form"
                onSubmit={handleProfileSave}
                className="space-y-5 rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Save className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Edit Profile</h2>
                    <p className="text-xs text-muted-foreground">Update your public info</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name" className="text-sm font-medium">Display Name</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-11 rounded-xl border-border/40 bg-background/80"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-username" className="text-sm font-medium">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                      <Input
                        id="profile-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        placeholder="yourname"
                        required
                        className="h-11 rounded-xl border-border/40 bg-background/80 pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      → {publicUrl}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="profile-email" 
                      value={user.email} 
                      disabled 
                      className="h-11 rounded-xl border-border/40 bg-muted/50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-timezone" className="text-sm font-medium">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="profile-timezone" className="h-11 rounded-xl border-border/40 bg-background/80">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {user.is_pro ? (
                    <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between">
                        <div className="grid gap-0.5">
                          <Label htmlFor="reminder-enabled" className="text-sm font-semibold">
                            Email Reminders
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Get reminded daily to check in
                          </p>
                        </div>
                        <input
                          id="reminder-enabled"
                          type="checkbox"
                          checked={reminderEnabled}
                          onChange={(e) => setReminderEnabled(e.target.checked)}
                          className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                        />
                      </div>
                      <AnimatePresence>
                        {reminderEnabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 grid gap-2">
                              <Label htmlFor="reminder-time" className="text-xs font-medium">Reminder Time</Label>
                              <Input
                                id="reminder-time"
                                type="time"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                className="w-28 rounded-lg border-border/40"
                              />
                              <p className="text-xs text-muted-foreground">
                                You'll receive reminders at {reminderTime} ({getReadableTimezone(timezone)})
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-yellow-200/50 bg-yellow-50/50 p-4 dark:border-yellow-800/50 dark:bg-yellow-950/20">
                      <div className="flex items-center justify-between">
                        <div className="grid gap-0.5">
                          <span className="text-sm font-semibold">Email Reminders</span>
                          <p className="text-xs text-muted-foreground">
                            Upgrade to Pro for daily reminders
                          </p>
                        </div>
                        <span className="rounded-full bg-yellow-200 px-2.5 py-1 text-xs font-semibold text-yellow-800 dark:bg-yellow-800/70 dark:text-yellow-200">
                          Pro
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-red-200/30 bg-red-50/30 p-4 dark:border-red-900/30 dark:bg-red-950/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Delete Account</h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Permanently delete your account, habits, and all data.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <Input
                      id="delete-confirm"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="Type DELETE"
                      className="h-9 rounded-lg border-border/40 text-center font-mono text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-3 w-full rounded-lg"
                    onClick={handleDeleteAccount}
                    disabled={confirmDelete !== "DELETE" || isDeletingAccount}
                  >
                    {isDeletingAccount ? "Deleting..." : "Delete My Account"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5 rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">About</h2>
                    <p className="text-xs text-muted-foreground">Profile details</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl bg-background/60 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Name
                    </div>
                    <div className="mt-1.5 font-medium">{user.name || "Not set"}</div>
                  </div>
                  <div className="rounded-xl bg-background/60 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Username
                    </div>
                    <div className="mt-1.5 font-mono text-sm">@{user.username}</div>
                  </div>
                  <div className="rounded-xl bg-background/60 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Location
                    </div>
                    <div className="mt-1.5 font-medium">{getReadableTimezone(user.timezone)}</div>
                  </div>
                  {habits.length > 0 && (
                    <div className="rounded-xl bg-background/60 p-3.5">
                      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Public Habits
                      </div>
                      <div className="mt-1.5 font-medium">{habits.length} habit{habits.length !== 1 ? "s" : ""} being tracked</div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={copyProfileLink} size="sm" className="flex-1 rounded-xl">
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                    Copy Link
                  </Button>
                  <Link href="/onboarding" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full rounded-xl">
                      Create Yours
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        <section className="mt-8 rounded-3xl border border-border/30 bg-card/70 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {isOwner ? "Your Public Habits" : "Tracked Habits"}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {habits.length > 0 
                  ? `${habits.length} habit${habits.length !== 1 ? "s" : ""} with public accountability`
                  : "No habits have been made public yet"}
              </p>
            </div>
            {isOwner && habits.length > 0 && (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="rounded-xl bg-background/80">
                  Manage All
                </Button>
              </Link>
            )}
          </div>

          {habits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/40 bg-card/80 p-8 text-center">
              <EmptyState type="no-public-habits" />
            </div>
          ) : (
            <div className="space-y-4">
              {habits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <PublicHabitCard
                    habit={habit}
                    onNudge={() => openNudgeModal(habit.id)}
                    onReact={handleReact}
                    onComment={() => openCommentModal(habit.id)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {!isOwner && habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 relative overflow-hidden rounded-2xl border border-orange-200/40 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-400/20 via-transparent to-transparent rounded-full blur-2xl" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/25">
                <Flame className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Start Your Own Journey</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                Join thousands building better habits with the power of public accountability. Don't break the chain.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/onboarding">
                  <Button size="lg" className="rounded-xl px-6">
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" size="lg" className="rounded-xl px-6">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Dialog open={showNudgeModal} onOpenChange={setShowNudgeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a Nudge</DialogTitle>
            <DialogDescription>
              Send some motivation to keep the streak going!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nudge-name">Your Name (optional)</Label>
              <Input
                id="nudge-name"
                placeholder="Anonymous"
                value={nudgeName}
                onChange={(e) => setNudgeName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nudge-message">Message (optional)</Label>
              <Input
                id="nudge-message"
                placeholder="You've got this! Keep going!"
                value={nudgeMessage}
                onChange={(e) => setNudgeMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleNudge} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Nudge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Comment</DialogTitle>
            <DialogDescription>
              Share some encouragement or feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <textarea
                id="comment"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Great progress! Keep it up!"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
            </div>

            <Button
              onClick={handleComment}
              disabled={isSubmitting || !commentContent.trim()}
              className="w-full"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Comment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toast />
    </div>
  );
}
