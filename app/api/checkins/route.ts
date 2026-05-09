import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { formatInTimeZone } from "date-fns-tz";

// GET /api/checkins - Get checkins for current user's habits
export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("checkins")
    .select("habit_id, checked_date, created_at")
    .eq("user_id", user.id)
    .order("checked_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ checkins: data });
}

// POST /api/checkins - Check in for a habit
export async function POST(request: Request) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { habit_id } = body;

    if (!habit_id) {
      return NextResponse.json(
        { error: "habit_id is required" },
        { status: 400 }
      );
    }

    // Verify ownership of the habit
    const { data: habit } = await supabase
      .from("habits")
      .select("user_id, frequency")
      .eq("id", habit_id)
      .single();

    if (!habit || habit.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get user's timezone (default to UTC)
    const { data: profile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "UTC";
    const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");

    // Check if already checked in today
    const { data: existing } = await supabase
      .from("checkins")
      .select("id")
      .eq("habit_id", habit_id)
      .eq("checked_date", todayStr)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }

    // Create check-in
    const { data, error } = await supabase
      .from("checkins")
      .insert({
        habit_id,
        user_id: user.id,
        checked_date: todayStr,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ checkin: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/checkins - Undo check-in for today
export async function DELETE(request: Request) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { habit_id } = body;

    if (!habit_id) {
      return NextResponse.json(
        { error: "habit_id is required" },
        { status: 400 }
      );
    }

    // Get user's timezone
    const { data: profile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "UTC";
    const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");

    // Delete today's check-in
    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("habit_id", habit_id)
      .eq("user_id", user.id)
      .eq("checked_date", todayStr);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}