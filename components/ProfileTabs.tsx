"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProFeaturesManager } from "@/components/ProFeaturesManager";
import { TIMEZONES } from "@/lib/utils";
import {
  Globe,
  Loader2,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
} from "lucide-react";

interface ProfileTabsProps {
  isOwner: boolean;
  user: {
    id: string;
    email: string;
    timezone: string;
    is_pro?: boolean;
    pro_features?: Record<string, boolean>;
  };
  name: string;
  setName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderTime: string;
  setReminderTime: (v: string) => void;
  publicUrl: string;
  handleProfileSave: (e: React.FormEvent) => void;
  isSavingProfile: boolean;
  confirmDelete: string;
  setConfirmDelete: (v: string) => void;
  handleDeleteAccount: () => void;
  isDeletingAccount: boolean;
  proFeatures: Record<string, boolean>;
  setProFeatures: (v: Record<string, boolean>) => void;
}

function isFeatureEnabled(pro_features: Record<string, boolean> | undefined, key: string): boolean {
  // Default to true if pro_features doesn't exist or key not set
  if (!pro_features || Object.keys(pro_features).length === 0) return true;
  return pro_features[key] ?? true;
}

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

export function ProfileTabs({
  isOwner,
  user,
  name,
  setName,
  username,
  setUsername,
  timezone,
  setTimezone,
  reminderEnabled,
  setReminderEnabled,
  reminderTime,
  setReminderTime,
  publicUrl,
  handleProfileSave,
  isSavingProfile,
  confirmDelete,
  setConfirmDelete,
  handleDeleteAccount,
  isDeletingAccount,
  proFeatures,
  setProFeatures,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"profile" | "settings" | "account">("profile");

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "settings" as const, label: "Settings", icon: Settings },
    { id: "account" as const, label: "Account", icon: Shield },
  ];

  if (!isOwner) {
    return (
      <div className="rounded-2xl border border-border/40 bg-muted/30 p-6 text-center">
        <p className="text-muted-foreground">This is a public profile page.</p>
        <p className="text-sm text-muted-foreground mt-1">Create your own to track habits!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border/40 pb-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Display Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 rounded-xl border-border/40"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profile-username">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="profile-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      placeholder="yourname"
                      required
                      className="h-11 rounded-xl border-border/40 pl-7"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input 
                    id="profile-email" 
                    value={user.email} 
                    disabled 
                    className="h-11 rounded-xl border-border/40 bg-muted/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profile-timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="profile-timezone" className="h-11 rounded-xl border-border/40">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-1">
                    <Globe className="h-3.5 w-3.5" />
                    Public URL
                  </div>
                  <div className="font-mono text-sm truncate">{publicUrl}</div>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Timezone</div>
                  <div className="font-medium">{getReadableTimezone(timezone)}</div>
                </div>
              </div>
            </form>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Reminder Settings - only show if reminders feature is enabled */}
              {user.is_pro && isFeatureEnabled(proFeatures, "reminders_enabled") ? (
                <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-5 dark:border-amber-800/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Email Reminders</h3>
                      <p className="text-sm text-muted-foreground">Get reminded daily to check in</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                  
                  {reminderEnabled && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Reminder Time</Label>
                        <Input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <span className="text-xs text-muted-foreground">
                          You'll receive reminders at {reminderTime} ({getReadableTimezone(timezone)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : user.is_pro ? null : (
                <div className="rounded-xl border border-yellow-200/50 bg-yellow-50/50 p-5 dark:border-yellow-800/50 dark:bg-yellow-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Email Reminders</h3>
                      <p className="text-sm text-muted-foreground">Upgrade to Pro for daily reminders</p>
                    </div>
                    <span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">Pro</span>
                  </div>
                </div>
              )}

              {/* Pro Features Toggle */}
              <ProFeaturesManager 
                isPro={!!user.is_pro} 
                proFeatures={proFeatures}
                onProFeaturesChange={setProFeatures}
              />
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-red-200/30 bg-red-50/30 p-5 dark:border-red-900/30 dark:bg-red-950/10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-300">Delete Account</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permanently delete your account, habits, and all data. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Input
                    value={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="rounded-lg font-mono text-center"
                  />
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={confirmDelete !== "DELETE" || isDeletingAccount}
                    className="rounded-lg"
                  >
                    {isDeletingAccount ? "Deleting..." : "Delete My Account"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}