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

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "created_at";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  try {
    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,username.ilike.%${search}%,name.ilike.%${search}%`
      );
    }

    const { data: users, count, error } = await query;

    if (error) throw error;

    const userIds = users?.map((u) => u.id) || [];
    let habitCounts: Record<string, number> = {};
    let checkinCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: habits } = await supabase
        .from("habits")
        .select("user_id")
        .in("user_id", userIds);
      
      const { data: checkins } = await supabase
        .from("checkins")
        .select("user_id")
        .in("user_id", userIds);

      userIds.forEach((id) => {
        habitCounts[id] = habits?.filter((h) => h.user_id === id).length || 0;
        checkinCounts[id] = checkins?.filter((c) => c.user_id === id).length || 0;
      });
    }

    const usersWithStats = users?.map((user) => ({
      ...user,
      habit_count: habitCounts[user.id] || 0,
      checkin_count: checkinCounts[user.id] || 0,
    })) || [];

    return NextResponse.json({
      users: usersWithStats,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}