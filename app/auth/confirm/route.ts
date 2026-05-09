import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already logged in, redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  // Redirect to onboarding for login
  return NextResponse.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}