"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Trophy, Share2, Copy, X } from "lucide-react";

const MILESTONE_MESSAGES: Record<number, string> = {
  7: "One week strong! You're building momentum.",
  21: "Three weeks! Habits are becoming second nature.",
  30: "One month! You're unstoppable!",
  66: "66 days! You're in the habit zone!",
  100: "100 days! Incredible dedication!",
  200: "200 days! You're a habit machine!",
  365: "ONE YEAR! Legendary status achieved!",
};

export function MilestoneModal() {
  const { showMilestoneModal, milestoneValue, setShowMilestoneModal } =
    useUIStore();

  if (!milestoneValue) return null;

  const handleShare = async () => {
    const text = `🔥 I just hit a ${milestoneValue}-day streak on HabitTracker! ${
      MILESTONE_MESSAGES[milestoneValue] || "Building better habits every day!"
    }`;

    if (navigator.share) {
      await navigator.share({
        title: "HabitTracker Milestone",
        text,
        url: window.location.origin,
      });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <AnimatePresence>
      {showMilestoneModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="mx-4 w-full max-w-md rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-yellow-500 p-1"
          >
            <div className="rounded-xl bg-background p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500"
              >
                <Trophy className="h-10 w-10 text-white" />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-2 text-3xl font-bold"
              >
                {milestoneValue} Day Streak!
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-muted-foreground"
              >
                {MILESTONE_MESSAGES[milestoneValue] ||
                  "Keep up the amazing work!"}
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex gap-3"
              >
                <Button onClick={handleShare} className="flex-1 gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowMilestoneModal(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}