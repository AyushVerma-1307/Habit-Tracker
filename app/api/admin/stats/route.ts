import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !isAdminEmail(user.email)) {
    return { authorized: false, user: null };
  }
  
  return { authorized: true, user };
}

export async function GET() {
  const auth = await verifyAdmin(new Request(""));
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();

  try {
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: proUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_pro", true);

    const { count: totalHabits } = await supabase
      .from("habits")
      .select("*", { count: "exact", head: true });

    const { count: totalCheckins } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true });

    const today = new Date().toISOString().split("T")[0];
    const { count: checkinsToday } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .eq("checked_date", today);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];
    const { count: checkinsThisWeek } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .gte("checked_date", weekAgoStr);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split("T")[0];
    const { count: checkinsThisMonth } = await supabase
      .from("checkins")
      .select("*", { count: "exact", head: true })
      .gte("checked_date", monthAgoStr);

    const { count: newUsersThisWeek } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    const { count: newUsersThisMonth } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo.toISOString());

    const { count: totalNudges } = await supabase
      .from("nudges")
      .select("*", { count: "exact", head: true });

    const { count: totalReactions } = await supabase
      .from("reactions")
      .select("*", { count: "exact", head: true });

    const { count: totalComments } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        pro: proUsers || 0,
        free: (totalUsers || 0) - (proUsers || 0),
        newThisWeek: newUsersThisWeek || 0,
        newThisMonth: newUsersThisMonth || 0,
      },
      habits: {
        total: totalHabits || 0,
      },
      checkins: {
        total: totalCheckins || 0,
        today: checkinsToday || 0,
        thisWeek: checkinsThisWeek || 0,
        thisMonth: checkinsThisMonth || 0,
      },
      engagement: {
        nudges: totalNudges || 0,
        reactions: totalReactions || 0,
        comments: totalComments || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}