"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield,
  BellOff,
  Users,
  Loader2,
  Ban,
  Plus,
  X,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { BlockedUser } from "@/lib/types";

interface NudgeProtectionCardProps {
  isPro: boolean;
}

interface NudgeProtectionSettings {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  rate_limit_per_day: number;
  blocked_users: (BlockedUser & { blocked_username: string; blocked_name: string | null; blocked_avatar: string | null })[];
}

export function NudgeProtectionCard({ isPro }: NudgeProtectionCardProps) {
  const [open, setOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<NudgeProtectionSettings>({
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    rate_limit_per_day: 5,
    blocked_users: [],
  });
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [blockUsername, setBlockUsername] = React.useState("");
  const [blockingUser, setBlockingUser] = React.useState(false);
  const [toast, setToast] = React.useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nudge-protection");
      if (res.status === 403) {
        setError("PRO_FEATURE");
        return;
      }
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setSettings(json);
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = React.useCallback(async (updates: Partial<NudgeProtectionSettings>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/nudge-protection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("Settings saved", "success");
    } catch {
      showToast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleBlockUser = async () => {
    if (!blockUsername.trim()) return;
    setBlockingUser(true);
    try {
      const res = await fetch("/api/nudge-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block", blocked_username: blockUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to block user", "error");
        return;
      }
      showToast("User blocked", "success");
      setBlockUsername("");
      await fetchSettings();
    } catch {
      showToast("Failed to block user", "error");
    } finally {
      setBlockingUser(false);
    }
  };

  const handleUnblockUser = async (blockedUserId: string) => {
    try {
      const res = await fetch("/api/nudge-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unblock", blocked_user_id: blockedUserId }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast("User unblocked", "success");
      await fetchSettings();
    } catch {
      showToast("Failed to unblock user", "error");
    }
  };

  const handleOpen = (val: boolean) => {
    if (val && !settings.blocked_users && !error) {
      fetchSettings();
    }
    setOpen(val);
  };

  if (!isPro) {
    return (
      <div className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 dark:border-yellow-800 dark:from-yellow-950/30 dark:to-orange-950/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Nudge Protection</h3>
              <span className="rounded-full bg-yellow-200 px-2.5 py-0.5 text-xs font-bold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                PRO
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Quiet hours, rate limiting & block users.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-yellow-300 bg-yellow-100/50 p-3 text-center dark:border-yellow-700 dark:bg-yellow-900/20">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Upgrade to Pro to unlock nudge protection
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
            <Shield className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Nudge Protection</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Quiet hours, rate limiting & block users.
            </p>
          </div>
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Nudge Protection
            </DialogTitle>
            <DialogDescription>
              Control when and how others can nudge you.
            </DialogDescription>
          </DialogHeader>

          {toast && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}>
              {toast.msg}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Quiet Hours</h4>
                <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Quiet Hours</div>
                      <div className="text-xs text-muted-foreground">
                        No nudges from {settings.quiet_hours_start} to {settings.quiet_hours_end}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={settings.quiet_hours_enabled}
                    onCheckedChange={(checked) => {
                      const updated = { ...settings, quiet_hours_enabled: checked };
                      setSettings(updated);
                      saveSettings(updated);
                    }}
                    disabled={saving}
                  />
                </div>

                {settings.quiet_hours_enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-start">Start Time</Label>
                      <Input
                        id="quiet-start"
                        type="time"
                        value={settings.quiet_hours_start}
                        onChange={(e) => {
                          const updated = { ...settings, quiet_hours_start: e.target.value };
                          setSettings(updated);
                        }}
                        onBlur={(e) => saveSettings({ quiet_hours_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quiet-end">End Time</Label>
                      <Input
                        id="quiet-end"
                        type="time"
                        value={settings.quiet_hours_end}
                        onChange={(e) => {
                          const updated = { ...settings, quiet_hours_end: e.target.value };
                          setSettings(updated);
                        }}
                        onBlur={(e) => saveSettings({ quiet_hours_end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Rate Limiting</h4>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Nudges per day</div>
                    <div className="text-xs text-muted-foreground">
                      Max nudges one visitor can send per day
                    </div>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={settings.rate_limit_per_day}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0 && val <= 50) {
                        const updated = { ...settings, rate_limit_per_day: val };
                        setSettings(updated);
                      }
                    }}
                    onBlur={(e) => saveSettings({ rate_limit_per_day: parseInt(e.target.value) })}
                    className="w-20 text-center"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="flex items-center gap-2 font-semibold">
                  <Ban className="h-5 w-5" />
                  Blocked Users
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Username to block..."
                    value={blockUsername}
                    onChange={(e) => setBlockUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleBlockUser()}
                  />
                  <Button onClick={handleBlockUser} disabled={blockingUser || !blockUsername.trim()}>
                    {blockingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Block
                  </Button>
                </div>
                {settings.blocked_users.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    No blocked users
                  </div>
                ) : (
                  <div className="space-y-2">
                    {settings.blocked_users.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {user.blocked_username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">@{user.blocked_username}</div>
                          {user.blocked_name && (
                            <div className="truncate text-xs text-muted-foreground">{user.blocked_name}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblockUser(user.blocked_user_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
