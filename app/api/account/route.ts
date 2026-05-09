import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is required for account deletion." },
      { status: 500 }
    );
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
