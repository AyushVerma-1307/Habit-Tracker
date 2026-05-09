import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { response, user } = await updateSession(request);

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If trying to access protected route without auth, redirect to onboarding
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // For onboarding, just pass through - let the page handle auth logic
  // Don't redirect here to avoid cookie sync issues

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
