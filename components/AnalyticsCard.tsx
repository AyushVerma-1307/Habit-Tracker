"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Flame,
  BarChart3,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AnalyticsSummary,
  WeeklyReport,
  MonthlyReport,
  HabitAnalytics,
} from "@/lib/types";

interface AnalyticsCardProps {
  isPro: boolean;
  userTimezone: string;
}

export function AnalyticsCard({ isPro, userTimezone }: AnalyticsCardProps) {
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      if (res.status === 403) {
        setError("PRO_FEATURE");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = (val: boolean) => {
    if (val && !data && !error) {
      fetchAnalytics();
    }
    setOpen(val);
  };

  if (!isPro) {
    return (
      <div className="group relative overflow-hidden rounded-3xl border border-dashed border-yellow-300/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 p-6 transition-all hover:border-yellow-400 dark:from-yellow-950/20 dark:to-orange-950/20">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg shadow-yellow-500/10 dark:from-yellow-900/40 dark:to-orange-900/40">
            <BarChart3 className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight">Advanced Analytics</h3>
              <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-3 py-1 text-xs font-bold text-white shadow-sm">
                PRO
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Unlock weekly/monthly reports, consistency scores & habit trends
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Zap className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-5 rounded-2xl border border-dashed border-yellow-300/50 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:from-yellow-900/20 dark:to-orange-900/20">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            Upgrade to Pro to unlock this feature
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => handleOpen(true)}
        className="group w-full rounded-3xl border border-border/60 bg-card/80 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      >
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/20 shadow-lg shadow-primary/10">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-tight">Advanced Analytics</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Weekly/monthly reports, consistency scores & habit trends
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-4xl w-[98vw] max-h-[95vh] overflow-hidden p-0 [&>button]:hidden">
          <div className="flex h-full max-h-[95vh] flex-col">
            {/* Header */}
            <div className="relative overflow-hidden border-b bg-gradient-to-r from-primary/5 via-orange-500/5 to-yellow-500/5 px-8 py-6 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-lg shadow-primary/20">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                      Advanced Analytics
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Your performance in {userTimezone}
                    </DialogDescription>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content - Scrollable but hidden scrollbar */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-8 py-6">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                    </div>
                    <p className="text-sm text-muted-foreground">Loading your insights...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-48 items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <span className="font-medium text-destructive">{error}</span>
                </div>
              ) : data ? (
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5 p-5 shadow-sm transition-all hover:shadow-md hover:shadow-primary/10"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                          <Zap className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-primary">
                          {data.consistency_score}%
                        </div>
                        <div className="mt-1 text-sm font-medium text-muted-foreground">
                          Consistency Score
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="group relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50 to-yellow-50 p-5 shadow-sm transition-all hover:shadow-md hover:shadow-orange-500/10 dark:from-orange-950/30 dark:to-yellow-950/30"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-orange-500/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                          <Flame className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-orange-600 dark:text-orange-400">
                          {data.total_checkins}
                        </div>
                        <div className="mt-1 text-sm font-medium text-muted-foreground">
                          Total Check-ins
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="group relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm transition-all hover:shadow-md hover:shadow-emerald-500/10 dark:from-emerald-950/30 dark:to-teal-950/30"
                    >
                      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                          <Target className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                          {data.average_completion_rate}%
                        </div>
                        <div className="mt-1 text-sm font-medium text-muted-foreground">
                          Avg. Completion
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Weekly Trends */}
                  {data.weekly.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold">Weekly Trends</h4>
                      </div>
                      <div className="space-y-3">
                        {data.weekly.map((week, i) => (
                          <div
                            key={week.week}
                            className="flex items-center gap-4 rounded-xl border border-border/40 bg-background/60 p-4 backdrop-blur-sm"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                              <span className="text-xs font-semibold text-muted-foreground">
                                {i === 0 ? "NOW" : `${8 - i}w`}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${week.completion_rate}%` }}
                                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20"
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold">{week.completion_rate}%</span>
                              <span className="text-xs text-muted-foreground">
                                {week.habits_completed}/{week.total_habits}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Monthly Trends */}
                  {data.monthly.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold">Monthly Overview</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {data.monthly.map((month, i) => (
                          <motion.div
                            key={month.month}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + i * 0.05 }}
                            className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-4 text-center backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                            <div className="relative">
                              <div className="text-2xl font-bold">{month.completion_rate}%</div>
                              <div className="mt-1 text-xs font-medium text-muted-foreground">
                                {new Date(month.month).toLocaleDateString("en-US", { month: "short" })}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Best Habits */}
                  {data.best_habits.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 dark:from-yellow-900/50 dark:to-orange-900/50 dark:text-yellow-400">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold">Top Performers</h4>
                      </div>
                      <div className="space-y-3">
                        {data.best_habits.map((habit, i) => (
                          <motion.div
                            key={habit.habit_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.1 }}
                            className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur-sm transition-all hover:border-emerald-200/50 hover:shadow-md hover:shadow-emerald-500/10"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: `${habit.color || "#22c55e"}20` }}>
                              <span className="text-2xl">{habit.icon || "🎯"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-semibold">{habit.title}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  {habit.current_streak} day streak
                                </span>
                                <span>·</span>
                                <span>{habit.total_checkins} check-ins</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                                {i + 1}
                              </div>
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {habit.completion_rate}%
                              </span>
                            </div>
                            <div className="w-16 text-right text-xs text-muted-foreground">
                              score: {habit.consistency_score}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Needs Attention */}
                  {data.worst_habits.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                          <Target className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold">Needs Attention</h4>
                      </div>
                      <div className="space-y-3">
                        {data.worst_habits.map((habit) => (
                          <div
                            className="flex items-center gap-4 rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur-sm"
                          >
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm" style={{ backgroundColor: `${habit.color || "#ef4444"}15` }}>
                              <span className="text-2xl">{habit.icon || "🎯"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-semibold">{habit.title}</div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{habit.current_streak} day streak</span>
                                <span>·</span>
                                <span>{habit.total_checkins} check-ins</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-orange-500">
                                {habit.completion_rate}%
                              </span>
                            </div>
                            <div className="w-16 text-right text-xs text-muted-foreground">
                              score: {habit.consistency_score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No data yet. Start tracking habits to see analytics.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}