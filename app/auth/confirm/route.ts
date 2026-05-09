import { createServerClient } from "@/lib/supabase/server";

export default async function AuthPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Already logged in, redirect to dashboard
    return Response.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  // Redirect to onboarding for login
  return Response.redirect(new URL("/onboarding", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}