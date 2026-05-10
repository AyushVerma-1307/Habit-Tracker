"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  Link2,
  Shield,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProFeaturesManagerProps {
  isPro: boolean;
  proFeatures: Record<string, boolean>;
  onProFeaturesChange: (features: Record<string, boolean>) => void;
}

const PRO_FEATURES_LIST = [
  {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Weekly/monthly reports, consistency scores, habit rankings",
    icon: <BarChart3 className="h-5 w-5" />,
    toggleKey: "analytics_enabled",
  },
  {
    id: "habit_stacking",
    name: "Habit Stacking",
    description: "Link habits together in sequential chains",
    icon: <Link2 className="h-5 w-5" />,
    toggleKey: "habit_stacking_enabled",
  },
  {
    id: "nudge_protection",
    name: "Nudge Protection",
    description: "Quiet hours, rate limiting, block users",
    icon: <Shield className="h-5 w-5" />,
    toggleKey: "nudge_protection_enabled",
  },
  {
    id: "reminders",
    name: "Email Reminders",
    description: "Daily reminders at your preferred time",
    icon: <Zap className="h-5 w-5" />,
    toggleKey: "reminders_enabled",
  },
];

function isFeatureEnabled(proFeatures: Record<string, boolean>, key: string): boolean {
  if (!proFeatures || Object.keys(proFeatures).length === 0) return true;
  return proFeatures[key] ?? true;
}

export function ProFeaturesManager({ 
  isPro, 
  proFeatures, 
  onProFeaturesChange 
}: ProFeaturesManagerProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!isPro) return null;

  const activeCount = PRO_FEATURES_LIST.filter(f => isFeatureEnabled(proFeatures, f.toggleKey)).length;

  const handleToggle = (toggleKey: string) => {
    const newFeatures = { ...proFeatures, [toggleKey]: !isFeatureEnabled(proFeatures, toggleKey) };
    onProFeaturesChange(newFeatures);
  };

  return (
    <motion.div
      initial={false}
      className="rounded-xl border border-purple-200/50 bg-purple-50/50 overflow-hidden dark:border-purple-800/50 dark:bg-purple-950/20"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-purple-50/50 dark:hover:bg-purple-950/10"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Pro Features</span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                {activeCount}/{PRO_FEATURES_LIST.length} active
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Manage your Pro feature toggles</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Toggle features on or off. Changes are saved when you click "Save Changes".
              </p>

              {PRO_FEATURES_LIST.map((feature) => {
                const enabled = isFeatureEnabled(proFeatures, feature.toggleKey);
                return (
                  <div
                    key={feature.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors",
                      enabled
                        ? "border-purple-200/50 bg-white/50 dark:border-purple-800/30 dark:bg-purple-900/10"
                        : "border-border/30 bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        enabled
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {feature.icon}
                      </div>
                      <div>
                        <span className={cn(
                          "text-sm font-medium",
                          !enabled && "text-muted-foreground"
                        )}>
                          {feature.name}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleToggle(feature.toggleKey)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-purple-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export { isFeatureEnabled };