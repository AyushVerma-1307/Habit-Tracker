"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heatmap } from "@/components/Heatmap";
import { getCheckinDatesForHeatmap } from "@/lib/streak";
import { cn, DAY_SHORT_NAMES } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  Flame,
  Globe,
  Lock,
  MoreVertical,
  Trash2,
} from "lucide-react";

interface HabitCardProps {
  habit: {
    id: string;
    title: string;
    icon: string | null;
    color: string | null;
    frequency: string[];
    is_public: boolean;
    current_streak: number;
    longest_streak: number;
    is_checked_in_today: boolean;
    checkins?: string[];
  };
  userTimezone: string;
  isOwner?: boolean;
  onCheckIn?: () => void;
  onTogglePublic?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

export function HabitCard({
  habit,
  userTimezone,
  isOwner = false,
  onCheckIn,
  onTogglePublic,
  onDelete,
  onEdit,
  isLoading = false,
}: HabitCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);

  const handleCheckIn = async () => {
    if (isChecking || isLoading) return;
    setIsChecking(true);
    try {
      await onCheckIn?.();
    } finally {
      setIsChecking(false);
    }
  };

  const habitColor = habit.color || "#ef4444";
  const heatmapData = habit.checkins ? getCheckinDatesForHeatmap(habit.checkins) : [];
  const completionRatio = habit.is_checked_in_today ? 100 : Math.min(habit.current_streak * 12, 92);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="w-full"
    >
      <Card
        className={cn(
          "surface-glow overflow-hidden border-border/60 bg-card/85 transition-all duration-300 backdrop-blur-sm",
          habit.is_checked_in_today && "ring-2 ring-green-500"
        )}
        style={{
          borderLeftColor: habitColor,
          borderLeftWidth: "4px",
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner"
                style={{
                  background: `linear-gradient(135deg, ${habitColor}25, ${habitColor}50)`,
                }}
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
                  {habit.longest_streak > habit.current_streak && (
                    <span className="text-xs">(Best: {habit.longest_streak})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && (
                <div
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                  title={habit.is_public ? "Public" : "Private"}
                >
                  {habit.is_public ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </div>
              )}

              {isOwner && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMenu(!showMenu)}
                    className="h-8 w-8"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>

                  {showMenu && (
                    <div className="absolute right-0 top-8 z-10 w-40 rounded-lg border bg-popover p-1 shadow-lg">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onEdit?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onTogglePublic?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        {habit.is_public ? (
                          <>
                            <Lock className="h-4 w-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4" />
                            Make Public
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete?.();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${completionRatio}%`,
                background: `linear-gradient(90deg, ${habitColor}, ${habitColor}cc)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${completionRatio}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {isOwner && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckIn}
              disabled={isChecking || isLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-semibold shadow-sm transition-all",
                habit.is_checked_in_today
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {habit.is_checked_in_today ? (
                <>
                  <Check className="h-5 w-5" />
                  Checked In Today!
                </>
              ) : (
                <>
                  <span className="text-xl">✓</span>
                  Check In
                </>
              )}
            </motion.button>
          )}

          <div className="flex flex-wrap gap-1.5">
            {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map((day) => (
              <span
                key={day}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  habit.frequency.includes(day)
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {DAY_SHORT_NAMES[day]?.[0] || day[0].toUpperCase()}
              </span>
            ))}
          </div>

          {heatmapData.length > 0 && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
              >
                <span>Activity</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 overflow-hidden"
                >
                  <Heatmap data={heatmapData} />
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
