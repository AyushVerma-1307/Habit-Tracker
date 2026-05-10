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
import { ProFeaturesManager } from "@/components/ProFeaturesManager";
import { ProfileTabs } from "@/components/ProfileTabs";
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
  Settings,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  Zap,
  BarChart3,
  Shield,
  Link2,
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
    pro_features?: Record<string, boolean>;
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
  const [proFeatures, setProFeatures] = React.useState<Record<string, boolean>>(user.pro_features || {});

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

      if (existingError) {
        addToast("Error checking username", "error");
        setIsSavingProfile(false);
        return;
      }

      if (existingUser) {
        addToast("Username already taken", "error");
        setIsSavingProfile(false);
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
          pro_features: proFeatures,
        })
        .eq("id", user.id);

      if (error) {
        addToast(error.message || "Failed to save profile", "error");
      } else {
        addToast("Profile saved successfully!", "success");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      addToast("Failed to save profile", "error");
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
              <Button 
                type="button" 
                size="sm" 
                onClick={handleProfileSave} 
                disabled={isSavingProfile || !username.trim()} 
                className="rounded-xl gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-border/40 bg-card p-6 md:p-8"
        >
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
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
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {user.name || user.username}
              </h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.is_pro && (
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-400">
                  <Sparkles className="h-3 w-3" />
                  Pro Member
                </span>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">{completedToday}/{habits.length}</div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{formatRelativeTime(user.created_at)}</div>
                <div className="text-xs text-muted-foreground">Joined</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ProfileTabs
            isOwner={isOwner}
            user={{
              id: user.id,
              email: user.email,
              timezone: user.timezone,
              is_pro: user.is_pro,
              pro_features: user.pro_features,
            }}
            name={name}
            setName={setName}
            username={username}
            setUsername={setUsername}
            timezone={timezone}
            setTimezone={setTimezone}
            reminderEnabled={reminderEnabled}
            setReminderEnabled={setReminderEnabled}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
            publicUrl={publicUrl}
            handleProfileSave={handleProfileSave}
            isSavingProfile={isSavingProfile}
            confirmDelete={confirmDelete}
            setConfirmDelete={setConfirmDelete}
            handleDeleteAccount={handleDeleteAccount}
            isDeletingAccount={isDeletingAccount}
            proFeatures={proFeatures}
            setProFeatures={setProFeatures}
          />
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
