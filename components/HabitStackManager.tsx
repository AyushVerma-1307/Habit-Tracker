"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Link2,
  Trash2,
  GripVertical,
  ArrowRight,
  Loader2,
  MoreVertical,
  Edit3,
  X,
  Check,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitWithStreak, HabitChain } from "@/lib/types";

interface HabitStackManagerProps {
  habits: HabitWithStreak[];
  isPro: boolean;
  userId: string;
}

export function HabitStackManager({ habits, isPro, userId }: HabitStackManagerProps) {
  const supabase = createClient();
  const { addToast } = useToastStore();

  const [chains, setChains] = React.useState<HabitChain[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [editingChain, setEditingChain] = React.useState<HabitChain | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Create form state
  const [chainName, setChainName] = React.useState("");
  const [chainDescription, setChainDescription] = React.useState("");
  const [selectedHabits, setSelectedHabits] = React.useState<string[]>([]);

  const fetchChains = React.useCallback(async () => {
    if (!isPro) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("habit_chains")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chains:", error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      // Fetch links and then fetch habits for each link
      const chainsWithHabits = await Promise.all(
        data.map(async (chain) => {
          const { data: links } = await supabase
            .from("habit_chain_links")
            .select("habit_id, position")
            .eq("chain_id", chain.id)
            .order("position", { ascending: true });

          if (!links || links.length === 0) {
            return { ...chain, habits: [] };
          }

          // Get habit IDs and fetch habits
          const habitIds = links.map(l => l.habit_id);
          const { data: habitsData } = await supabase
            .from("habits")
            .select("id, user_id, title, icon, color, frequency, is_public, created_at")
            .in("id", habitIds);

          // Create ordered habits array matching link positions
          const habitMap = new Map(habitsData?.map(h => [h.id, h]) || []);
          const chainHabits = links
            .map(link => habitMap.get(link.habit_id))
            .filter(Boolean)
            .map(h => ({
              ...h,
              current_streak: 0,
              longest_streak: 0,
              is_checked_in_today: false,
            })) as HabitWithStreak[];

          return { ...chain, habits: chainHabits };
        })
      );
      setChains(chainsWithHabits);
    } else {
      setChains([]);
    }
    setIsLoading(false);
  }, [isPro, supabase, userId]);

  React.useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  const handleCreateChain = async () => {
    if (!chainName.trim() || selectedHabits.length < 2) {
      addToast("Please add at least 2 habits to create a chain", "error");
      return;
    }

    setIsSaving(true);

    try {
      // Create the chain
      const { data: chain, error: chainError } = await supabase
        .from("habit_chains")
        .insert({
          user_id: userId,
          name: chainName.trim(),
          description: chainDescription.trim() || null,
        })
        .select()
        .single();

      if (chainError) throw chainError;

      // Add habits to chain
      const links = selectedHabits.map((habitId, index) => ({
        chain_id: chain.id,
        habit_id: habitId,
        position: index + 1,
        trigger_type: "after" as const,
      }));

      const { error: linksError } = await supabase
        .from("habit_chain_links")
        .insert(links);

      if (linksError) throw linksError;

      addToast("Habit chain created!", "success");
      setShowCreateDialog(false);
      resetForm();
      fetchChains();
    } catch (err) {
      console.error("Error creating chain:", err);
      addToast("Failed to create chain", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateChain = async () => {
    if (!editingChain || !chainName.trim() || selectedHabits.length < 2) {
      addToast("Please add at least 2 habits", "error");
      return;
    }

    setIsSaving(true);

    try {
      // Update chain
      const { error: chainError } = await supabase
        .from("habit_chains")
        .update({
          name: chainName.trim(),
          description: chainDescription.trim() || null,
        })
        .eq("id", editingChain.id);

      if (chainError) throw chainError;

      // Delete existing links
      await supabase
        .from("habit_chain_links")
        .delete()
        .eq("chain_id", editingChain.id);

      // Add new links
      const links = selectedHabits.map((habitId, index) => ({
        chain_id: editingChain.id,
        habit_id: habitId,
        position: index + 1,
        trigger_type: "after" as const,
      }));

      const { error: linksError } = await supabase
        .from("habit_chain_links")
        .insert(links);

      if (linksError) throw linksError;

      addToast("Chain updated!", "success");
      setEditingChain(null);
      resetForm();
      fetchChains();
    } catch (err) {
      console.error("Error updating chain:", err);
      addToast("Failed to update chain", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChain = async (chainId: string) => {
    if (!confirm("Delete this habit chain?")) return;

    try {
      // Links will be deleted automatically due to CASCADE
      const { error } = await supabase
        .from("habit_chains")
        .delete()
        .eq("id", chainId);

      if (error) throw error;

      addToast("Chain deleted", "info");
      fetchChains();
    } catch (err) {
      console.error("Error deleting chain:", err);
      addToast("Failed to delete chain", "error");
    }
  };

  const openEditDialog = (chain: HabitChain) => {
    setEditingChain(chain);
    setChainName(chain.name);
    setChainDescription(chain.description || "");
    setSelectedHabits(chain.habits?.map((h) => h.id) || []);
  };

  const resetForm = () => {
    setChainName("");
    setChainDescription("");
    setSelectedHabits([]);
    setEditingChain(null);
  };

  const toggleHabitInChain = (habitId: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId]
    );
  };

  const moveHabit = (index: number, direction: "up" | "down") => {
    const newHabits = [...selectedHabits];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newHabits.length) return;
    [newHabits[index], newHabits[targetIndex]] = [newHabits[targetIndex], newHabits[index]];
    setSelectedHabits(newHabits);
  };

  if (!isPro) return null;

  const selectedHabitObjects = selectedHabits
    .map((id) => habits.find((h) => h.id === id))
    .filter(Boolean) as HabitWithStreak[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Habit Stacks</h3>
          <p className="text-sm text-muted-foreground">
            Link habits together in sequence
          </p>
        </div>
        <Dialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-xl">
              <Plus className="h-4 w-4" />
              New Stack
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Create Habit Stack
              </DialogTitle>
              <DialogDescription>
                Link multiple habits together. Complete them in sequence for maximum momentum.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Stack Name</Label>
                <Input
                  placeholder="e.g., Morning Routine"
                  value={chainName}
                  onChange={(e) => setChainName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="What triggers this chain?"
                  value={chainDescription}
                  onChange={(e) => setChainDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Habits (2+ required)</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {habits.map((habit) => (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => toggleHabitInChain(habit.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                        selectedHabits.includes(habit.id)
                          ? "border-primary bg-primary/5"
                          : "border-border/40 hover:border-primary/40"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border",
                          selectedHabits.includes(habit.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {selectedHabits.includes(habit.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className="text-xl">{habit.icon || "🎯"}</span>
                      <span className="font-medium">{habit.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedHabits.length > 1 && (
                <div className="space-y-2">
                  <Label>Order</Label>
                  <div className="space-y-1">
                    {selectedHabitObjects.map((habit, index) => (
                      <div
                        key={habit.id}
                        className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-lg">{habit.icon || "🎯"}</span>
                        <span className="flex-1 text-sm font-medium">{habit.title}</span>
                        <button
                          type="button"
                          onClick={() => moveHabit(index, "up")}
                          disabled={index === 0}
                          className="p-1 hover:bg-background rounded"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveHabit(index, "down")}
                          disabled={index === selectedHabits.length - 1}
                          className="p-1 hover:bg-background rounded"
                        >
                          ↓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateChain}
                disabled={isSaving || selectedHabits.length < 2 || !chainName.trim()}
                className="flex-1"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Stack"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : chains.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/40 bg-muted/30 p-8 text-center">
          <Link2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No habit stacks yet</p>
          <p className="text-sm text-muted-foreground/70">
            Create a stack to link habits together
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {chains.map((chain) => (
            <Card
              key={chain.id}
              className="overflow-hidden border-border/40 bg-card/80"
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-3 border-b border-border/30 bg-muted/30 px-4 py-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{chain.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chain.habits?.length || 0} habits
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(chain)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChain(chain.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
                  {chain.habits?.map((habit, index) => (
                    <React.Fragment key={habit.id}>
                      <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 shrink-0">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-lg">{habit.icon || "🎯"}</span>
                        <span className="text-sm font-medium whitespace-nowrap">
                          {habit.title}
                        </span>
                        {habit.is_checked_in_today && (
                          <Check className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                      {index < (chain.habits?.length || 0) - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {chain.description && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground">{chain.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editingChain}
        onOpenChange={(open) => {
          if (!open) {
            setEditingChain(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Habit Stack
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stack Name</Label>
              <Input
                placeholder="e.g., Morning Routine"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What triggers this chain?"
                value={chainDescription}
                onChange={(e) => setChainDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Habits</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggleHabitInChain(habit.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                      selectedHabits.includes(habit.id)
                        ? "border-primary bg-primary/5"
                        : "border-border/40 hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md border",
                        selectedHabits.includes(habit.id)
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {selectedHabits.includes(habit.id) && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="text-xl">{habit.icon || "🎯"}</span>
                    <span className="font-medium">{habit.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedHabits.length > 1 && (
              <div className="space-y-2">
                <Label>Order</Label>
                <div className="space-y-1">
                  {selectedHabitObjects.map((habit, index) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-lg">{habit.icon || "🎯"}</span>
                      <span className="flex-1 text-sm font-medium">{habit.title}</span>
                      <button
                        type="button"
                        onClick={() => moveHabit(index, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-background rounded"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHabit(index, "down")}
                        disabled={index === selectedHabits.length - 1}
                        className="p-1 hover:bg-background rounded"
                      >
                        ↓
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingChain(null);
                resetForm();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateChain}
              disabled={isSaving || selectedHabits.length < 2 || !chainName.trim()}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}