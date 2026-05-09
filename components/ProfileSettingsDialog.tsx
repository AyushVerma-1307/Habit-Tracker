"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TIMEZONES } from "@/lib/utils";
import type { User } from "@/lib/types";

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (data: { name: string; username: string; timezone: string }) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export function ProfileSettingsDialog({
  open,
  onOpenChange,
  user,
  isSaving,
  isDeleting,
  onSave,
  onDeleteAccount,
}: ProfileSettingsDialogProps) {
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [timezone, setTimezone] = React.useState("America/New_York");
  const [confirmValue, setConfirmValue] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setTimezone(user.timezone || "America/New_York");
    setConfirmValue("");
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      timezone,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your public identity, timezone, and account settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
            <div className="grid gap-2">
              <Label htmlFor="profile-name">Display Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-username">Username</Label>
              <Input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="yourname"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your public profile lives at `/u/{username || "username"}`.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="profile-timezone">
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

          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This permanently removes your account, habits, check-ins, and auth access from the server.
            </p>
            <div className="mt-4 grid gap-2">
              <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
              <Input
                id="delete-confirm"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              className="mt-4 w-full"
              onClick={onDeleteAccount}
              disabled={confirmValue !== "DELETE" || isDeleting}
            >
              {isDeleting ? "Deleting account..." : "Delete My Account"}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !username.trim()}>
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
