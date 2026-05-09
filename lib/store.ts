import { create } from "zustand";
import type { Habit, HabitWithStreak, User } from "@/lib/types";

// =====================================================
// User Store
// =====================================================
interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// =====================================================
// Habits Store
// =====================================================
interface HabitsState {
  habits: HabitWithStreak[];
  setHabits: (habits: HabitWithStreak[]) => void;
  addHabit: (habit: HabitWithStreak) => void;
  updateHabit: (id: string, updates: Partial<HabitWithStreak>) => void;
  removeHabit: (id: string) => void;
  toggleCheckIn: (habitId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  isLoading: true,
  setHabits: (habits) => set({ habits, isLoading: false }),
  addHabit: (habit) =>
    set((state) => ({
      habits: [...state.habits, habit],
      isLoading: false,
    })),
  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    })),
  removeHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    })),
  toggleCheckIn: (habitId) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              is_checked_in_today: !h.is_checked_in_today,
              current_streak: h.is_checked_in_today
                ? h.current_streak - 1
                : h.current_streak + 1,
            }
          : h
      ),
    })),
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// =====================================================
// UI Store
// =====================================================
interface UIState {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showMilestoneModal: boolean;
  milestoneValue: number | null;
  setShowMilestoneModal: (show: boolean, milestone?: number | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showOnboarding: false,
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  showMilestoneModal: false,
  milestoneValue: null,
  setShowMilestoneModal: (show, milestone = null) =>
    set({ showMilestoneModal: show, milestoneValue: milestone }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// =====================================================
// Toast/Notification Store
// =====================================================
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-remove after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));