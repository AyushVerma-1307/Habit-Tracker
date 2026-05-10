"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  HABIT_COLORS,
  HABIT_ICONS,
  DAY_SHORT_NAMES,
  cn,
} from "@/lib/utils";
import type { FrequencyDay } from "@/lib/types";

interface HabitFormData {
  title: string;
  icon: string;
  color: string;
  frequency: FrequencyDay[];
  is_public: boolean;
}

interface HabitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: HabitFormData) => Promise<void> | void;
  initialData?: Partial<HabitFormData>;
  mode?: "create" | "edit";
}

const ALL_DAYS: FrequencyDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function HabitFormModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: HabitFormModalProps) {
  const defaultTitle = mode === "create" ? "Daily Focus" : "";
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState<HabitFormData>({
    title: initialData?.title || defaultTitle,
    icon: initialData?.icon || "🎯",
    color: initialData?.color || HABIT_COLORS[0],
    frequency: initialData?.frequency || ["mon", "tue", "wed", "thu", "fri"],
    is_public: initialData?.is_public || false,
  });

  React.useEffect(() => {
    if (!open) return;

    setFormData({
      title: initialData?.title || defaultTitle,
      icon: initialData?.icon || "🎯",
      color: initialData?.color || HABIT_COLORS[0],
      frequency: initialData?.frequency || ["mon", "tue", "wed", "thu", "fri"],
      is_public: initialData?.is_public || false,
    });
  }, [defaultTitle, initialData, open]);

  const handleDayToggle = (day: FrequencyDay) => {
    setFormData((prev) => ({
      ...prev,
      frequency: prev.frequency.includes(day)
        ? prev.frequency.filter((selectedDay) => selectedDay !== day)
        : [...prev.frequency, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.frequency.length === 0) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      setFormData({
        title: defaultTitle,
        icon: "🎯",
        color: HABIT_COLORS[0],
        frequency: ["mon", "tue", "wed", "thu", "fri"],
        is_public: false,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating habit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create New Habit" : "Edit Habit"}</DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Build a fresh streak with a habit that is clear, visible, and easy to start today."
                : "Refine your habit settings without losing momentum."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Habit Name</Label>
              <Input
                id="title"
                placeholder="e.g., Morning Run, Read 30 minutes..."
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: item.emoji }))
                    }
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-2xl border text-xl transition-all",
                      formData.icon === item.emoji
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : "border-border/60 bg-muted/70 hover:border-primary/30 hover:bg-muted"
                    )}
                    title={item.label}
                    disabled={isSubmitting}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-3">
                {HABIT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 border-background shadow-sm transition-all",
                      formData.color === color && "scale-110 ring-2 ring-primary/30"
                    )}
                    style={{ backgroundColor: color }}
                    disabled={isSubmitting}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={cn(
                      "flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition-all",
                      formData.frequency.includes(day)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    disabled={isSubmitting}
                  >
                    {DAY_SHORT_NAMES[day]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                    }))
                  }
                  disabled={isSubmitting}
                >
                  Every Day
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      frequency: ["mon", "tue", "wed", "thu", "fri"],
                    }))
                  }
                  disabled={isSubmitting}
                >
                  Weekdays
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
              <div className="space-y-0.5">
                <Label>Make Public</Label>
                <p className="text-sm text-muted-foreground">
                  Let others view your progress on your profile page.
                </p>
              </div>
              <Switch
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_public: checked }))
                }
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || !formData.title.trim() || formData.frequency.length === 0
              }
            >
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Habit"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
