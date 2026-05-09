"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import type { HabitWithStreak } from "@/lib/types";

interface PublicHabitCardProps {
  habit: HabitWithStreak;
  onNudge?: (habitId: string) => void;
  onReact?: (habitId: string, emoji: string) => void;
  onComment?: (habitId: string) => void;
}

const REACTION_EMOJIS = ["🔥", "💪", "❤️", "🎉", "👏"];

export function PublicHabitCard({
  habit,
  onNudge,
  onReact,
  onComment,
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

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
              style={{ backgroundColor: `${habit.color || "#ef4444"}20` }}
            >
              {habit.icon || "🎯"}
            </div>
            <div>
              <CardTitle className="text-lg">{habit.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Flame
                    className={cn(
                      "h-4 w-4",
                      habit.current_streak > 0 && "text-orange-500"
                    )}
                  />
                  <span className="font-semibold">{habit.current_streak}</span>
                  <span>day streak</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Engagement Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Nudge Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNudge?.(habit.id)}
            className="gap-2"
          >
            <Hand className="h-4 w-4" />
            Nudge
          </Button>

          {/* React Button */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              React
            </Button>

            {showReactions && (
              <div className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-lg border bg-popover p-2 shadow-lg">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact?.(habit.id, emoji);
                      setShowReactions(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-accent"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comment Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onComment?.(habit.id)}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Comment
          </Button>

          {/* Share Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </div>

        {/* Heatmap */}
        {heatmapData.length > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Activity</p>
            <Heatmap data={heatmapData} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
