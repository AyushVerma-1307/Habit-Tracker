import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  // Verify the nudge belongs to a habit owned by the user
  const { data: nudge, error: fetchError } = await supabase
    .from("nudges")
    .select("id, habit_id")
    .eq("id", id)
    .single();

  if (fetchError || !nudge) {
    return NextResponse.json({ error: "Nudge not found" }, { status: 404 });
  }

  // Check if user owns the habit
  const { data: habit } = await supabase
    .from("habits")
    .select("user_id")
    .eq("id", nudge.habit_id)
    .single();

  if (!habit || habit.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete the nudge
  const { error: deleteError } = await supabase
    .from("nudges")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting nudge:", deleteError);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}