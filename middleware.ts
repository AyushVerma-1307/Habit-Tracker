import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only run auth check for protected routes
  if (isProtectedRoute) {
    // Check for auth cookie directly without calling Supabase
    const authCookie = request.cookies.get("sb-access-token") || 
                      request.cookies.get("supabase-auth-token") ||
                      request.cookies.getAll().find(c => c.name.includes("auth-token"));

    // If trying to access protected route without auth, redirect to onboarding
    if (!authCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
