import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PUT /api/habits/[id] - Update a habit
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, icon, color, frequency, is_public } = body;

    // Verify ownership
    const { data: existing } = await supabase
      .from("habits")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};

    if (title !== undefined) updates.title = title.trim();
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (frequency !== undefined) updates.frequency = frequency;
    if (is_public !== undefined) updates.is_public = is_public;

    const { data, error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ habit: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("habits")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("habits").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}