import { createServerClient, createAdminClient } from "@/lib/supabase/server";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { id } = await params;

  try {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (userError) throw userError;

    const { data: habits } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });

    const habitIds = (habits || []).map((h: { id: string }) => h.id);

    const { data: checkins } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", id)
      .order("checked_date", { ascending: false })
      .limit(100);

    const { data: nudges } = await supabase
      .from("nudges")
      .select(`
        id,
        from_name,
        message,
        created_at,
        habit:habits(id, title, icon)
      `)
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: comments } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        habit:habits(id, title, icon)
      `)
      .in("habit_id", habitIds.length > 0 ? habitIds : ["none"])
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: reactions } = await supabase
      .from("reactions")
      .select(`
        id,
        emoji,
        session_id,
        created_at,
        habit:habits(id, title, icon)
      `)
      .in("habit_id", habitIds.length > 0 ? habitIds : ["none"])
      .order("created_at", { ascending: false })
      .limit(100);

    const recentActivity = [
      ...(checkins || []).map((c: { checked_date: string }) => ({
        type: "checkin" as const,
        date: c.checked_date,
        data: c,
      })),
      ...(nudges || []).map((n: { created_at: string }) => ({
        type: "nudge" as const,
        date: n.created_at,
        data: n,
      })),
      ...(comments || []).map((c: { created_at: string }) => ({
        type: "comment" as const,
        date: c.created_at,
        data: c,
      })),
      ...(reactions || []).map((r: { created_at: string }) => ({
        type: "reaction" as const,
        date: r.created_at,
        data: r,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    return NextResponse.json({
      user: userData,
      habits: habits || [],
      checkins: checkins || [],
      nudges: nudges || [],
      comments: comments || [],
      reactions: reactions || [],
      recentActivity,
      stats: {
        habit_count: habits?.length || 0,
        checkin_count: checkins?.length || 0,
        reactions_count: reactions?.length || 0,
        nudges_count: nudges?.length || 0,
        comments_count: comments?.length || 0,
      },
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { id } = await params;

  try {
    const body = await request.json();
    const { is_pro, name, timezone } = body;

    const updateData: Record<string, unknown> = {};
    if (typeof is_pro === "boolean") updateData.is_pro = is_pro;
    if (typeof name === "string") updateData.name = name;
    if (typeof timezone === "string") updateData.timezone = timezone;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { id } = await params;

  try {
    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}