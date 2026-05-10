import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();

    // Get all users with reminders enabled
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, timezone, reminder_time")
      .eq("reminder_enabled", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users with reminders enabled" });
    }

    const results = [];

    for (const user of users) {
      // Get user's habits for today
      const today = new Date().toISOString().split("T")[0];

      const { data: habits, error: habitsError } = await supabase
        .from("habits")
        .select("id, title, frequency")
        .eq("user_id", user.id);

      if (habitsError || !habits) continue;

      // Check which habits should be done today based on frequency
      const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      const todayDay = dayNames[new Date().getDay()];

      const habitsDueToday = habits.filter((h) =>
        (h.frequency as string[]).includes(todayDay)
      );

      if (habitsDueToday.length === 0) continue;

      // Get checkins for today
      const { data: checkins } = await supabase
        .from("checkins")
        .select("habit_id")
        .eq("user_id", user.id)
        .eq("checked_date", today);

      const checkedHabitIds = new Set(checkins?.map((c) => c.habit_id) || []);
      const uncheckedHabits = habitsDueToday.filter(
        (h) => !checkedHabitIds.has(h.id)
      );

      if (uncheckedHabits.length > 0) {
        // TODO: Integrate with email service (Resend, SendGrid, etc.)
        // For now, just log what would be sent
        console.log(`Reminder for ${user.email}:`, {
          habits: uncheckedHabits.map((h) => h.title),
          count: uncheckedHabits.length,
        });

        results.push({
          user: user.email,
          habits: uncheckedHabits.map((h) => h.title),
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${users.length} users`,
      reminders: results,
    });
  } catch (error) {
    console.error("Reminder error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger reminders. Set up a cron job to call this endpoint.",
    example: "curl -X POST https://yourdomain.com/api/reminders",
  });
}