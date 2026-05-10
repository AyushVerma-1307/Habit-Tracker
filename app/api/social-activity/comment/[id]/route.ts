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

  // Verify the comment exists
  const { data: comment, error: fetchError } = await supabase
    .from("comments")
    .select("id, habit_id, author_id")
    .eq("id", id)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Check if user is either the author or owns the habit
  const { data: habit } = await supabase
    .from("habits")
    .select("user_id")
    .eq("id", comment.habit_id)
    .single();

  const isAuthor = comment.author_id === user.id;
  const isHabitOwner = habit && habit.user_id === user.id;

  if (!isAuthor && !isHabitOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete the comment
  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error deleting comment:", deleteError);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}