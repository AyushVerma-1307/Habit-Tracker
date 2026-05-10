"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heatmap } from "@/components/Heatmap";
import { getCheckinDatesForHeatmap } from "@/lib/streak";
import { cn } from "@/lib/utils";
import {
  Flame,
  Hand,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import type { HabitWithStreak } from "@/lib/types";

const REACTION_EMOJIS = ["🔥", "💪", "❤️", "🎉", "👏"];

interface PublicHabitCardProps {
  habit: HabitWithStreak;
  onNudge?: (habitId: string) => void;
  onReact?: (habitId: string, emoji: string) => void;
  onComment?: (habitId: string) => void;
  isOwner?: boolean;
  userReaction?: string;
  hasUserCommented?: boolean;
  hasUserNudged?: boolean;
}

export function PublicHabitCard({
  habit,
  onNudge,
  onReact,
  onComment,
  isOwner = false,
  userReaction,
  hasUserCommented = false,
  hasUserNudged = false,
}: PublicHabitCardProps) {
  const [showReactions, setShowReactions] = React.useState(false);
  const heatmapData = habit.checkins
    ? getCheckinDatesForHeatmap(habit.checkins)
    : [];

  const handleShare = () => {
    const url = `${window.location.origin}/u/${window.location.pathname.split("/")[2]}`;
    const text = `Check out my ${habit.title} streak: ${habit.current_streak} days! 🔥`;

    if (navigator.share) {
      navigator.share({
        title: habit.title,
        text,
        url,
      });
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
    }
  };

  const totalCheckins = habit.checkins?.length || 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="w-full overflow-hidden border-border/40 bg-card/95 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <div 
          className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
        />
        
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: Habit Info */}
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                style={{ 
                  backgroundColor: `${habit.color || "#ef4444"}15`,
                  boxShadow: `0 0 20px ${habit.color || "#ef4444"}15`
                }}
              >
                {habit.icon || "🎯"}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold tracking-tight">{habit.title}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                  <span className={cn(
                    "flex items-center gap-1.5 font-medium",
                    habit.current_streak > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                  )}>
                    <Flame className={cn("h-4 w-4", habit.current_streak > 0 && "animate-pulse")} />
                    {habit.current_streak} day streak
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Best: {habit.longest_streak}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {totalCheckins} total
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Status Badge */}
            <div className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm font-semibold",
              habit.is_checked_in_today 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-muted text-muted-foreground"
            )}>
              {habit.is_checked_in_today ? "✓ Done today" : "○ Pending"}
            </div>
          </div>

          {/* Action Buttons - Only show if not owner */}
          {!isOwner && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                variant={hasUserNudged ? "default" : "outline"}
                size="sm"
                onClick={() => onNudge?.(habit.id)}
                className={cn(
                  "gap-1.5 rounded-lg border-border/40 bg-background/60 hover:bg-background hover:border-primary/30",
                  hasUserNudged && "bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:border-purple-700 dark:text-purple-400"
                )}
              >
                <Hand className="h-3.5 w-3.5" />
                {hasUserNudged ? "Nudged!" : "Nudge"}
              </Button>

              <div className="relative">
                <Button
                  variant={userReaction ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowReactions(!showReactions)}
                  className={cn(
                    "gap-1.5 rounded-lg border-border/40 bg-background/60 hover:bg-background hover:border-primary/30",
                    userReaction && "bg-pink-100 hover:bg-pink-200 border-pink-300 text-pink-700 dark:bg-pink-900/30 dark:hover:bg-pink-900/50 dark:border-pink-700 dark:text-pink-400"
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", userReaction && "fill-current")} />
                  {userReaction ? `${userReaction} Reacted` : "React"}
                </Button>

                <AnimatePresence>
                  {showReactions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 4 }}
                      className="absolute left-0 top-full z-20 mt-1.5 flex gap-1 rounded-xl border border-border/40 bg-popover/95 p-2 shadow-xl backdrop-blur-sm"
                    >
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            onReact?.(habit.id, emoji);
                            setShowReactions(false);
                          }}
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-125 hover:bg-accent",
                            userReaction === emoji && "bg-primary/20 ring-2 ring-primary"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant={hasUserCommented ? "default" : "outline"}
                size="sm"
                onClick={() => onComment?.(habit.id)}
                className={cn(
                  "gap-1.5 rounded-lg border-border/40 bg-background/60 hover:bg-background hover:border-primary/30",
                  hasUserCommented && "bg-primary/20 hover:bg-primary/30 border-primary/50 text-primary dark:bg-primary/20 dark:hover:bg-primary/30"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {hasUserCommented ? "Commented" : "Comment"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1.5 rounded-lg border-border/40 bg-background/60 hover:bg-background hover:border-primary/30"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share
              </Button>
            </div>
          )}

          {/* Heatmap */}
          {heatmapData.length > 0 && (
            <div className="mt-5 rounded-xl border border-border/30 bg-background/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Activity History</p>
                <span className="text-xs text-muted-foreground">Last 12 months</span>
              </div>
              <Heatmap data={heatmapData} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
