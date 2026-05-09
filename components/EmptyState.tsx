"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Flame } from "lucide-react";

interface EmptyStateProps {
  type: "no-habits" | "no-public-habits" | "loading";
  onAddHabit?: () => void;
}

export function EmptyState({ type, onAddHabit }: EmptyStateProps) {
  if (type === "loading") {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (type === "no-habits") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Flame className="h-10 w-10 text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Start Your First Habit</h3>
        <p className="mb-6 max-w-md text-muted-foreground">
          Build positive habits and track your daily progress. Don't break the
          chain!
        </p>
        {onAddHabit && (
          <Button onClick={onAddHabit} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Habit
          </Button>
        )}
      </motion.div>
    );
  }

  if (type === "no-public-habits") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <span className="text-4xl">🔒</span>
        </div>
        <h3 className="mb-2 text-xl font-semibold">No Public Habits Yet</h3>
        <p className="max-w-md text-muted-foreground">
          This user hasn't made any habits public yet. Check back later or
          explore other users!
        </p>
      </motion.div>
    );
  }

  return null;
}