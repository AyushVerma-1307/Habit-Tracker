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
      <div className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 dark:border-yellow-800 dark:from-yellow-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Advanced Analytics</h3>
              <span className="rounded-full bg-yellow-200 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                PRO
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly/monthly reports, consistency scores & habit trends.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-yellow-300 bg-yellow-100/50 p-3 text-center dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Upgrade to Pro to unlock analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => handleOpen(true)}
        className="w-full rounded-3xl border border-border/60 bg-card/80 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Advanced Analytics</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly/monthly reports, consistency scores & habit trends.
            </p>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Advanced Analytics
            </DialogTitle>
            <DialogDescription>
              Your habit performance over time. Timezone: {userTimezone}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{data.consistency_score}%</div>
                  <div className="mt-1 text-xs text-muted-foreground">Consistency</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center">
                  <div className="text-2xl font-bold text-orange-500">{data.total_checkins}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Total Check-ins</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-500">{data.average_completion_rate}%</div>
                  <div className="mt-1 text-xs text-muted-foreground">Avg. Completion</div>
                </div>
              </div>

              {data.weekly.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">Weekly Trends</h4>
                  <div className="space-y-2">
                    {data.weekly.map((week, i) => (
                      <div key={week.week} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-muted-foreground">
                          {i === 0 ? "This week" : `${8 - i}w ago`}
                        </div>
                        <div className="flex-1 h-6 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${week.completion_rate}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">
                          {week.completion_rate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.monthly.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">Monthly Trends</h4>
                  <div className="space-y-2">
                    {data.monthly.map((month) => (
                      <div key={month.month} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-muted-foreground">
                          {new Date(month.month).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="flex-1 h-6 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${month.completion_rate}%` }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                          />
                        </div>
                        <div className="w-12 text-right text-sm font-medium">
                          {month.completion_rate}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.best_habits.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Best Performing Habits
                  </h4>
                  <div className="space-y-2">
                    {data.best_habits.map((habit, i) => (
                      <div key={habit.habit_id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                        <span className="text-xl">{habit.icon || "🎯"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{habit.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {habit.current_streak} day streak · {habit.completion_rate}% completion
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-emerald-500">{habit.completion_rate}%</span>
                          <span className="text-xs text-muted-foreground">score: {habit.consistency_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.worst_habits.length > 0 && (
                <div>
                  <h4 className="mb-3 flex items-center gap-2 font-semibold">
                    <Target className="h-4 w-4 text-orange-400" />
                    Habits Needing Attention
                  </h4>
                  <div className="space-y-2">
                    {data.worst_habits.map((habit) => (
                      <div key={habit.habit_id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                        <span className="text-xl">{habit.icon || "🎯"}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{habit.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {habit.current_streak} day streak · {habit.completion_rate}% completion
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-orange-400">{habit.completion_rate}%</span>
                          <span className="text-xs text-muted-foreground">score: {habit.consistency_score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No data yet. Start tracking habits to see analytics.
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
