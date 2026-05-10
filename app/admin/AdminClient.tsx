"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Crown, Flame, CheckCircle, MessageCircle, Users, TrendingUp, Activity, Heart, Eye, Edit, Trash2 } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  name: string | null;
  timezone: string;
  is_pro: boolean;
  is_pro_display?: boolean;
  created_at: string;
  habit_count?: number;
  checkin_count?: number;
  current_streak?: number;
}

interface UserDetail {
  user: AdminUser;
  habits: Array<{
    id: string;
    title: string;
    icon: string | null;
    color: string | null;
    frequency: string[];
    created_at: string;
  }>;
  checkins: Array<{
    id: string;
    habit_id: string;
    checked_date: string;
    created_at: string;
  }>;
  nudges: Array<{
    id: string;
    from_name: string | null;
    message: string | null;
    created_at: string;
    habit?: { id: string; title: string; icon: string | null };
  }>;
  comments: Array<{
    id: string;
    content: string;
    created_at: string;
    habit?: { id: string; title: string; icon: string | null };
  }>;
  reactions: Array<{
    id: string;
    emoji: string;
    session_id: string;
    created_at: string;
    habit?: { id: string; title: string; icon: string | null };
  }>;
  recentActivity: Array<{
    type: "checkin" | "nudge" | "comment" | "reaction";
    date: string;
    data: Record<string, unknown>;
  }>;
  stats: {
    habit_count: number;
    checkin_count: number;
    reactions_count: number;
    nudges_count: number;
    comments_count: number;
  };
}

type TabType = "overview" | "nudges" | "comments" | "reactions" | "activity";

export default function AdminClient() {
  const supabase = createClient();
  const [stats, setStats] = useState<{
    users: { total: number; pro: number; free: number; newThisWeek: number; newThisMonth: number };
    habits: { total: number };
    checkins: { total: number; today: number; thisWeek: number; thisMonth: number };
    engagement: { nudges: number; reactions: number; comments: number };
  } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [toggling, setToggling] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [userStats, setUserStats] = useState<{
    totalCheckins: number;
    avgPerHabit: number;
    activeDays: number;
    longestStreak: number;
  } | null>(null);

  const limit = 20;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
    setLoading(false);
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleProStatus = async (userId: string, currentStatus: boolean) => {
    setToggling(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pro: !currentStatus }),
      });
      if (res.ok) {
        setUsers(users.map((u) =>
          u.id === userId ? { ...u, is_pro: !currentStatus } : u
        ));
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to toggle pro status:", error);
    }
    setToggling(null);
  };

  const openUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setSelectedUser(null);
    setShowUserModal(true);
    setActiveTab("overview");
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
        calculateUserStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
    }
    setUserDetailLoading(false);
  };

  const calculateUserStats = (data: UserDetail) => {
    const totalCheckins = data.checkins.length;
    const avgPerHabit = data.habits.length > 0 ? (totalCheckins / data.habits.length).toFixed(1) : 0;
    const uniqueDays = new Set(data.checkins.map((c) => c.checked_date)).size;
    
    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate: string | null = null;
    const sortedDates = [...data.checkins.map((c) => c.checked_date)].sort();
    
    for (const date of sortedDates) {
      if (prevDate === null) {
        currentStreak = 1;
      } else {
        const prev = new Date(prevDate);
        const curr = new Date(date);
        const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      prevDate = date;
    }

    setUserStats({
      totalCheckins,
      avgPerHabit: parseFloat(avgPerHabit as string),
      activeDays: uniqueDays,
      longestStreak,
    });
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setSelectedUser(null);
        setShowUserModal(false);
        fetchStats();
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
    setDeleting(false);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Manage users and platform</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              ← Back to Site
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.users.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-500">+{stats?.users.newThisWeek || 0}</span> this week
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
              <Crown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.users.pro || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.users.total ? Math.round((stats.users.pro / stats.users.total) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.habits.total || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                avg {stats?.users.total ? (stats.habits.total / stats.users.total).toFixed(1) : 0} per user
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.checkins.today || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.checkins.thisWeek || 0} this week
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Nudges Sent</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.engagement.nudges || 0}</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reactions</CardTitle>
              <span className="text-lg">🔥</span>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.engagement.reactions || 0}</div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Comments</CardTitle>
              <MessageCircle className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{stats?.engagement.comments || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by email, username, or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 min-w-[200px] max-w-md px-4 py-2 rounded-lg border border-input bg-background"
          />
          <Button variant="outline" onClick={fetchUsers}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Username</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Timezone</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Habits</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Check-ins</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => openUserDetail(user.id)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <div className="font-medium">{user.name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">@{user.username}</span>
                      </td>
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">{user.timezone}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">{user.habit_count || 0}</td>
                      <td className="px-4 py-3 text-sm">{user.checkin_count || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          user.is_pro
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}>
                          {user.is_pro ? "Pro" : "Free"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={user.is_pro ? "destructive" : "default"}
                            onClick={() => toggleProStatus(user.id, user.is_pro)}
                            disabled={toggling === user.id}
                          >
                            {toggling === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.is_pro ? (
                              "Remove Pro"
                            ) : (
                              "Make Pro"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openUserDetail(user.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                  Next
                </Button>
              </div>
            </div>

            {users.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </main>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden bg-background rounded-2xl shadow-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xl font-bold text-white">
                    {selectedUser?.user.name?.[0]?.toUpperCase() || selectedUser?.user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedUser?.user.name || selectedUser?.user.username}</h2>
                    <p className="text-sm text-muted-foreground">@{selectedUser?.user.username} • {selectedUser?.user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setShowUserModal(false)} size="icon">
                  ✕
                </Button>
              </div>
            </div>

            <div className="border-b px-6">
              <div className="flex gap-1">
                {(["overview", "nudges", "comments", "reactions", "activity"] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                    {tab !== "overview" && selectedUser?.stats && (
                      <span className="ml-1 text-xs opacity-60">
                        ({tab === "nudges" ? selectedUser.stats.nudges_count :
                          tab === "comments" ? selectedUser.stats.comments_count :
                          tab === "reactions" ? selectedUser.stats.reactions_count :
                          selectedUser.recentActivity.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              {userDetailLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedUser ? (
                <>
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 p-4 text-center">
                          <p className="text-3xl font-bold text-orange-500">{selectedUser.stats.habit_count}</p>
                          <p className="text-xs text-muted-foreground mt-1">Habits</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 p-4 text-center">
                          <p className="text-3xl font-bold text-green-500">{userStats?.totalCheckins || 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">Check-ins</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 p-4 text-center">
                          <p className="text-3xl font-bold text-purple-500">{userStats?.activeDays || 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">Active Days</p>
                        </div>
                        <div className="rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-4 text-center">
                          <p className="text-3xl font-bold text-yellow-500">{userStats?.longestStreak || 0}</p>
                          <p className="text-xs text-muted-foreground mt-1">Best Streak</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Timezone</span>
                          <span className="font-medium">{selectedUser.user.timezone}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Joined</span>
                          <span className="font-medium">{new Date(selectedUser.user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Avg per Habit</span>
                          <span className="font-medium">{userStats?.avgPerHabit || 0}</span>
                        </div>
                        <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`font-medium ${selectedUser.user.is_pro ? "text-yellow-500" : "text-gray-500"}`}>
                            {selectedUser.user.is_pro ? "Pro" : "Free"}
                          </span>
                        </div>
                      </div>

                      {selectedUser.habits.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Habits</h3>
                          <div className="grid gap-3">
                            {selectedUser.habits.map((habit) => (
                              <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderLeftColor: habit.color || "#ef4444", borderLeftWidth: 4 }}>
                                <span className="text-2xl">{habit.icon || "🎯"}</span>
                                <div className="flex-1">
                                  <p className="font-medium">{habit.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {habit.frequency.length} days/week • Created {new Date(habit.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "nudges" && (
                    <div className="space-y-4">
                      {selectedUser.nudges.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No nudges received yet</p>
                        </div>
                      ) : (
                        selectedUser.nudges.map((nudge) => (
                          <div key={nudge.id} className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{nudge.from_name || "Anonymous"}</p>
                                {nudge.habit && (
                                  <p className="text-sm text-muted-foreground">
                                    On: {nudge.habit.icon} {nudge.habit.title}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(nudge.created_at).toLocaleString()}
                              </span>
                            </div>
                            {nudge.message && (
                              <p className="mt-2 text-sm bg-muted/50 p-3 rounded-lg">{nudge.message}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "comments" && (
                    <div className="space-y-4">
                      {selectedUser.comments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No comments yet</p>
                        </div>
                      ) : (
                        selectedUser.comments.map((comment) => (
                          <div key={comment.id} className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent border">
                            <div className="flex items-start justify-between">
                              {comment.habit && (
                                <p className="text-sm text-muted-foreground">
                                  On: {comment.habit.icon} {comment.habit.title}
                                </p>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-2">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "reactions" && (
                    <div className="space-y-4">
                      {selectedUser.reactions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <span className="text-6xl opacity-20">🔥</span>
                          <p className="mt-4">No reactions yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                          {(() => {
                            const emojiCounts: Record<string, number> = {};
                            selectedUser.reactions.forEach((r) => {
                              emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
                            });
                            return Object.entries(emojiCounts)
                              .sort((a, b) => b[1] - a[1])
                              .map(([emoji, count]) => (
                                <div key={emoji} className="p-4 rounded-xl bg-muted/50 text-center">
                                  <p className="text-3xl">{emoji}</p>
                                  <p className="text-sm font-medium mt-1">{count}</p>
                                </div>
                              ));
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="space-y-3">
                      {selectedUser.recentActivity.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No recent activity</p>
                        </div>
                      ) : (
                        selectedUser.recentActivity.map((activity, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === "checkin" ? "bg-green-500/20 text-green-500" :
                              activity.type === "nudge" ? "bg-purple-500/20 text-purple-500" :
                              activity.type === "comment" ? "bg-cyan-500/20 text-cyan-500" :
                              "bg-pink-500/20 text-pink-500"
                            }`}>
                              {activity.type === "checkin" ? <CheckCircle className="h-5 w-5" /> :
                               activity.type === "nudge" ? <TrendingUp className="h-5 w-5" /> :
                               activity.type === "comment" ? <MessageCircle className="h-5 w-5" /> :
                               <span>{activity.type === "reaction" ? "🔥" : "?"}</span>}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize">{activity.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.type === "checkin" ? `Checked in on ${(activity.data as { checked_date?: string }).checked_date}` :
                                 activity.type === "nudge" ? `Nudge from ${(activity.data as { from_name?: string }).from_name || "Anonymous"}` :
                                 activity.type === "comment" ? String((activity.data as { content?: string }).content || "").slice(0, 50) :
                                 `${(activity.data as { emoji?: string }).emoji} reaction`}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t bg-muted/30 flex justify-between">
              <Button variant="outline" onClick={() => window.open(`/u/${selectedUser?.user.username}`, "_blank")}>
                View Public Profile
              </Button>
              <Button variant="destructive" onClick={() => deleteUser(selectedUser?.user.id || "")} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" /> Delete User</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}