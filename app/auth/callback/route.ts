import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const origin = requestUrl.origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/onboarding?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  const supabase = await createServerClient();
  const { data: { user }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/onboarding?error=${encodeURIComponent(exchangeError.message)}`,
        origin
      )
    );
  }

  // Check if user profile needs setup - redirect to onboarding to handle this
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    // If no profile or UTC timezone, go to onboarding for profile setup
    if (!profile || !profile.timezone || profile.timezone === "UTC") {
      return NextResponse.redirect(new URL("/onboarding", origin));
    }
  }

  // Profile is complete, go to dashboard
  return NextResponse.redirect(new URL("/dashboard", origin));
}
