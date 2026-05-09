import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export default async function AuthPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user has timezone set
    const { data: profile } = await supabase
      .from("users")
      .select("timezone")
      .eq("id", user.id)
      .single();

    if (profile?.timezone && profile.timezone !== "UTC") {
      redirect("/dashboard");
    } else {
      redirect("/onboarding?setup=true");
    }
  } else {
    redirect("/onboarding");
  }
}