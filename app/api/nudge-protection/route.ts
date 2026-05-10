import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select(`
        nudge_quiet_hours_enabled,
        nudge_quiet_hours_start,
        nudge_quiet_hours_end,
        nudge_rate_limit_per_day,
        is_pro
      `)
      .eq("id", authUser.id)
      .single();

    if (!profile?.is_pro) {
      return NextResponse.json({ error: "Pro feature" }, { status: 403 });
    }

    const { data: blockedUsers } = await supabase
      .from("blocked_users")
      .select(`
        id,
        blocked_user_id,
        created_at,
        blocked:users!blocked_users_blocked_user_id_fkey(
          username,
          name,
          avatar_url
        )
      `)
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    const formattedBlocked = blockedUsers?.map((b) => {
      const blockedInfo = Array.isArray(b.blocked) ? b.blocked[0] : b.blocked;
      return {
        id: b.id,
        blocked_user_id: b.blocked_user_id,
        blocked_username: (blockedInfo as { username: string } | null)?.username || "Unknown",
        blocked_name: (blockedInfo as { name: string | null } | null)?.name || null,
        blocked_avatar: (blockedInfo as { avatar_url: string | null } | null)?.avatar_url || null,
        created_at: b.created_at,
      };
    }) || [];

    return NextResponse.json({
      quiet_hours_enabled: profile.nudge_quiet_hours_enabled ?? false,
      quiet_hours_start: profile.nudge_quiet_hours_start ?? "22:00",
      quiet_hours_end: profile.nudge_quiet_hours_end ?? "08:00",
      rate_limit_per_day: profile.nudge_rate_limit_per_day ?? 5,
      blocked_users: formattedBlocked,
    });
  } catch (error) {
    console.error("Nudge protection get error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_pro")
      .eq("id", authUser.id)
      .single();

    if (!profile?.is_pro) {
      return NextResponse.json({ error: "Pro feature" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.quiet_hours_enabled === "boolean") {
      updates.nudge_quiet_hours_enabled = body.quiet_hours_enabled;
    }
    if (typeof body.quiet_hours_start === "string") {
      updates.nudge_quiet_hours_start = body.quiet_hours_start;
    }
    if (typeof body.quiet_hours_end === "string") {
      updates.nudge_quiet_hours_end = body.quiet_hours_end;
    }
    if (typeof body.rate_limit_per_day === "number") {
      updates.nudge_rate_limit_per_day = body.rate_limit_per_day;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", authUser.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nudge protection patch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("is_pro")
      .eq("id", authUser.id)
      .single();

    if (!profile?.is_pro) {
      return NextResponse.json({ error: "Pro feature" }, { status: 403 });
    }

    const body = await request.json();

    if (body.action === "block") {
      const { blocked_username } = body;
      if (!blocked_username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 });
      }

      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .ilike("username", blocked_username)
        .single();

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      if (targetUser.id === authUser.id) {
        return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
      }

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          user_id: authUser.id,
          blocked_user_id: targetUser.id,
        });

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json({ error: "User already blocked" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === "unblock") {
      const { blocked_user_id } = body;
      if (!blocked_user_id) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
      }

      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("user_id", authUser.id)
        .eq("blocked_user_id", blocked_user_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Nudge protection post error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
