import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";
import { isAdminEmail } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect to onboarding
  if (!user) {
    redirect("/onboarding");
  }

  // If logged in but not admin, redirect to dashboard
  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return <AdminClient />;
}