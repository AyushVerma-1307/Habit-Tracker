import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FrequencyDay } from "@/lib/types";

// GET /api/habits - List all habits for current user
export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ habits: data });
}

// POST /api/habits - Create a new habit
export async function POST(request: Request) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, icon, color, frequency, is_public } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!frequency || frequency.length === 0) {
      return NextResponse.json(
        { error: "At least one frequency day is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title: title.trim(),
        icon: icon || "🎯",
        color: color || "#ef4444",
        frequency,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ habit: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}