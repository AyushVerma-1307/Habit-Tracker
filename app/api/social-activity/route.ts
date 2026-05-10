import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all nudges for user's habits
  const { data: nudges, error: nudgesError } = await supabase
    .from("nudges")
    .select(`
      id,
      from_name,
      message,
      created_at,
      habit:habits(id, title, icon, color)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (nudgesError) {
    console.error("Error fetching nudges:", nudgesError);
  }

  // Fetch all comments on user's public habits
  const { data: publicHabits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_public", true);

  const publicHabitIds = publicHabits?.map(h => h.id) || [];

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      author:users(id, username, name, avatar_url),
      habit:habits(id, title, icon, color)
    `)
    .in("habit_id", publicHabitIds.length > 0 ? publicHabitIds : ["empty"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (commentsError) {
    console.error("Error fetching comments:", commentsError);
  }

  // Fetch all reactions on user's public habits
  const { data: reactions, error: reactionsError } = await supabase
    .from("reactions")
    .select(`
      id,
      emoji,
      session_id,
      created_at,
      habit:habits(id, title, icon, color)
    `)
    .in("habit_id", publicHabitIds.length > 0 ? publicHabitIds : ["empty"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (reactionsError) {
    console.error("Error fetching reactions:", reactionsError);
  }

  // Calculate summary stats
  const summary = {
    totalNudges: nudges?.length || 0,
    totalComments: comments?.length || 0,
    totalReactions: reactions?.length || 0,
    recentNudges: nudges?.slice(0, 5) || [],
    recentComments: comments?.slice(0, 5) || [],
  };

  // Group reactions by emoji
  const reactionCounts: Record<string, number> = {};
  reactions?.forEach(r => {
    reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
  });

  return NextResponse.json({
    nudges: nudges || [],
    comments: comments || [],
    reactions: reactions || [],
    reactionCounts,
    summary,
  });
}