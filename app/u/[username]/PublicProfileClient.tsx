"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PublicHabitCard } from "@/components/PublicHabitCard";
import { EmptyState } from "@/components/EmptyState";
import { Toast } from "@/components/Toast";
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
  Copy,
  Flame,
  Loader2,
  LogOut,
  Save,
  Share2,
  Trash2,
} from "lucide-react";
import { formatRelativeTime, generateSessionId, TIMEZONES } from "@/lib/utils";
import type { HabitWithStreak } from "@/lib/types";

interface PublicProfileClientProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatar_url: string | null;
    email: string;
    timezone: string;
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

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            
            {/* Left Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Flame className="h-5 w-5 text-white" />
              </div>

              <span className="text-xl font-bold">
                HabitTracker
              </span>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {isOwner ? (
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="hidden rounded-full sm:inline-flex"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={copyProfileLink}
                  className="hidden rounded-full sm:inline-flex"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center">
          <Link href={isOwner ? "/dashboard" : "/onboarding"}>
            <Button
              variant="outline"
              className="rounded-full"
            >
              ← {isOwner ? "Dashboard" : "Get Started"}
            </Button>
          </Link>
        </div>
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-glow relative overflow-hidden rounded-[32px] border border-border/60 bg-card/85 p-6 backdrop-blur"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-orange-500 to-red-500 text-3xl font-bold text-white shadow-xl shadow-orange-500/20">
                  {user.name?.[0]?.toUpperCase() || user.username[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-bold tracking-tight">
                    {user.name || user.username}
                  </h1>
                  <p className="mt-1 text-lg text-muted-foreground">@{user.username}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {formatRelativeTime(user.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                      <Flame className="h-4 w-4" />
                      Best streak {bestStreak}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5">
                      <Share2 className="h-4 w-4" />
                      {completedToday}/{habits.length} today
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Public Link
                  </div>
                  <div className="mt-2 truncate font-semibold">
                    {publicUrl}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Timezone
                  </div>
                  <div className="mt-2 truncate font-semibold">{user.timezone}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Visibility
                  </div>
                  <div className="mt-2 font-semibold">
                    {habits.length > 0 ? `${habits.length} public habits` : "No public habits yet"}
                  </div>
                </div>
              </div>
            </div>

            {isOwner ? (
              <form
                onSubmit={handleProfileSave}
                className="rounded-[28px] border border-border/60 bg-background/80 p-5 shadow-sm"
              >
                <div className="mb-5">
                  <h2 className="text-xl font-semibold">Profile Form</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Update your public information, preview your link, and manage your account from one place.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="profile-name">Display Name</Label>
                    <Input
                      id="profile-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-username">Username</Label>
                    <Input
                      id="profile-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="yourname"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Preview: {publicUrl}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input id="profile-email" value={user.email} disabled />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profile-timezone">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger id="profile-timezone">
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
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button type="submit" disabled={isSavingProfile || !username.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button type="button" variant="outline" onClick={copyProfileLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Profile Link
                  </Button>
                </div>

                <div className="mt-6 rounded-[24px] border border-destructive/25 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Delete your account, habits, and all server data permanently.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                    <Input
                      id="delete-confirm"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    className="mt-4"
                    onClick={handleDeleteAccount}
                    disabled={confirmDelete !== "DELETE" || isDeletingAccount}
                  >
                    {isDeletingAccount ? "Deleting account..." : "Delete My Account"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-[28px] border border-border/60 bg-background/80 p-5 shadow-sm">
                <h2 className="text-xl font-semibold">Profile Details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore this profile and cheer on the visible habits below.
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Name
                    </div>
                    <div className="mt-2 font-medium">{user.name || "Not set"}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Username
                    </div>
                    <div className="mt-2 font-medium">@{user.username}</div>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Timezone
                    </div>
                    <div className="mt-2 font-medium">{user.timezone}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={copyProfileLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Profile Link
                  </Button>
                  <Link href="/onboarding">
                    <Button variant="outline">Create Your Profile</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </motion.section>

        <section className="mt-8">
          {habits.length === 0 ? (
            <div className="surface-glow rounded-[28px] border border-border/60 bg-card/80 p-4">
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

        {!isOwner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 rounded-[28px] border border-dashed border-primary/30 bg-card/70 p-6 text-center"
          >
            <Flame className="mx-auto mb-2 h-8 w-8 text-primary" />
            <h3 className="mb-2 text-lg font-semibold">Want to track your own habits?</h3>
            <p className="mb-4 text-muted-foreground">
              Join HabitTracker and build positive habits with social accountability.
            </p>
            <Link href="/onboarding">
              <Button>Start Tracking</Button>
            </Link>
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
