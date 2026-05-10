"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Heart, Flame, Send, X, ExternalLink, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Nudge, Comment, Reaction } from "@/lib/types";

interface SocialActivityCardProps {
  className?: string;
}

export function SocialActivityCard({ className }: SocialActivityCardProps) {
  const supabase = createClient();
  const { user } = useUserStore();

  const [loading, setLoading] = React.useState(true);
  const [nudges, setNudges] = React.useState<Nudge[]>([]);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [reactions, setReactions] = React.useState<Reaction[]>([]);
  const [reactionCounts, setReactionCounts] = React.useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = React.useState<"nudges" | "comments" | "reactions">("nudges");
  const [showFullActivityModal, setShowFullActivityModal] = React.useState(false);
  const [modalActiveTab, setModalActiveTab] = React.useState<"nudges" | "comments" | "reactions">("nudges");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deletingType, setDeletingType] = React.useState<"nudge" | "comment" | null>(null);

  const fetchSocialActivity = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/social-activity");
      if (res.ok) {
        const data = await res.json();
        setNudges(data.nudges || []);
        setComments(data.comments || []);
        setReactions(data.reactions || []);
        setReactionCounts(data.reactionCounts || {});
      }
    } catch (error) {
      console.error("Failed to fetch social activity:", error);
    }
    setLoading(false);
  }, [user?.id]);

  const handleDeleteNudge = async (nudgeId: string) => {
    setDeletingId(nudgeId);
    setDeletingType("nudge");
    try {
      const res = await fetch(`/api/social-activity/nudge/${nudgeId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNudges(prev => prev.filter(n => n.id !== nudgeId));
      } else {
        console.error("Failed to delete nudge");
      }
    } catch (error) {
      console.error("Error deleting nudge:", error);
    } finally {
      setDeletingId(null);
      setDeletingType(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    setDeletingType("comment");
    try {
      const res = await fetch(`/api/social-activity/comment/${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId));
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setDeletingId(null);
      setDeletingType(null);
    }
  };

  React.useEffect(() => {
    fetchSocialActivity();
  }, [fetchSocialActivity]);

  const totalNudges = nudges.length;
  const totalComments = comments.length;
  const totalReactions = reactions.length;

  if (!user?.id) return null;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Social Activity
          </CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-sm text-muted-foreground">
          See what people are saying about your habits
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as "nudges" | "comments" | "reactions")}>
          <TabsList className="grid w-full grid-cols-3 h-auto rounded-xl bg-muted/50 p-1 gap-1">
            <TabsTrigger
              value="nudges"
              className="rounded-lg py-2 px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Nudges
              {totalNudges > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0.5">
                  {totalNudges}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-lg py-2 px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Comments
              {totalComments > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0.5">
                  {totalComments}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="reactions"
              className="rounded-lg py-2 px-3 text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Reactions
              {totalReactions > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0.5">
                  {totalReactions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 pt-2 max-h-[350px] overflow-y-auto scrollbar-hide">
            <TabsContent value="nudges" className="m-0 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : nudges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No nudges yet</p>
                  <p className="text-xs mt-1">Share your profile to get motivated!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {nudges.slice(0, 10).map((nudge, index) => (
                    <motion.div
                      key={nudge.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {nudge.from_name || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(nudge.created_at)}
                            </span>
                          </div>
                          {"habit" in nudge && nudge.habit && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              on {nudge.habit.icon} {nudge.habit.title}
                            </p>
                          )}
                          {nudge.message && (
                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded-lg">
                              "{nudge.message}"
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="comments" className="m-0 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Make your habits public to get feedback!</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {comments.slice(0, 10).map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {comment.author?.name || comment.author?.username || "Anonymous"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          {"habit" in comment && comment.habit && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              on {comment.habit.icon} {comment.habit.title}
                            </p>
                          )}
                          <p className="text-sm mt-2 line-clamp-2">{comment.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>

            <TabsContent value="reactions" className="m-0 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : Object.keys(reactionCounts).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Heart className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No reactions yet</p>
                  <p className="text-xs mt-1">Share your profile to get reactions!</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {Object.entries(reactionCounts)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([emoji, count]) => (
                        <motion.div
                          key={emoji}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border"
                        >
                          <span className="text-2xl">{emoji}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </motion.div>
                      ))}
                  </div>

                  {reactions.length > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      Total {totalReactions} reactions across your habits
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </div>
        </Tabs>

{nudges.length > 0 || comments.length > 0 || reactions.length > 0 ? (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => setShowFullActivityModal(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Activity
            </Button>
          </div>
        ) : null}
      </CardContent>

      {/* Full Activity Modal */}
      <Dialog open={showFullActivityModal} onOpenChange={setShowFullActivityModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">Social Activity</DialogTitle>
                  <DialogDescription>
                    All interactions on your public profile
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <Tabs value={modalActiveTab} onValueChange={(v: string) => setModalActiveTab(v as "nudges" | "comments" | "reactions")}>
              <TabsList className="grid w-full grid-cols-3 h-auto rounded-xl bg-muted/50 p-1 gap-1">
                <TabsTrigger
                  value="nudges"
                  className="rounded-lg py-2.5 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Nudges
                  {totalNudges > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">
                      {totalNudges}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="rounded-lg py-2.5 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Comments
                  {totalComments > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">
                      {totalComments}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="reactions"
                  className="rounded-lg py-2.5 px-4 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Reactions
                  {totalReactions > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs px-2 py-0.5">
                      {totalReactions}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                <TabsContent value="nudges" className="m-0 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : nudges.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Send className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No nudges yet</p>
                      <p className="text-sm mt-2">Share your profile to get motivated!</p>
                    </div>
                  ) : (
                    nudges.map((nudge, index) => (
                      <motion.div
                        key={nudge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                              <span className="text-lg">👊</span>
                            </div>
                            <div>
                              <p className="font-medium">{nudge.from_name || "Anonymous"}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(nudge.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNudge(nudge.id)}
                            disabled={deletingId === nudge.id}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {"habit" in nudge && nudge.habit && (
                          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                            <span>{nudge.habit.icon}</span>
                            <span>{nudge.habit.title}</span>
                          </p>
                        )}
                        {nudge.message && (
                          <p className="text-sm mt-3 p-3 bg-muted/50 rounded-lg italic">
                            "{nudge.message}"
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="comments" className="m-0 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No comments yet</p>
                      <p className="text-sm mt-2">Make your habits public to get feedback!</p>
                    </div>
                  ) : (
                    comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                              <span className="text-lg">💬</span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {comment.author?.name || comment.author?.username || "Anonymous"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(comment.created_at)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {"habit" in comment && comment.habit && (
                          <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                            <span>{comment.habit.icon}</span>
                            <span>{comment.habit.title}</span>
                          </p>
                        )}
                        <p className="text-sm mt-3 p-3 bg-muted/50 rounded-lg">{comment.content}</p>
                      </motion.div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="reactions" className="m-0 space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : Object.keys(reactionCounts).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">No reactions yet</p>
                      <p className="text-sm mt-2">Share your profile to get reactions!</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {Object.entries(reactionCounts)
                          .sort((a, b) => b[1] - a[1])
                          .map(([emoji, count]) => (
                            <motion.div
                              key={emoji}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex flex-col items-center justify-center p-4 rounded-xl bg-muted/50 border"
                            >
                              <span className="text-4xl mb-2">{emoji}</span>
                              <span className="text-lg font-bold">{count}</span>
                              <span className="text-xs text-muted-foreground">reactions</span>
                            </motion.div>
                          ))}
                      </div>

                      {reactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground text-center">
                            Total {totalReactions} reactions across {Object.keys(reactionCounts).length} different emojis
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <div className="pt-4 border-t flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/u/${user?.username}`, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Profile
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowFullActivityModal(false)}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}