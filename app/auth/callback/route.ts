import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
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
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(
        `/onboarding?error=${encodeURIComponent(exchangeError.message)}`,
        origin
      )
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
