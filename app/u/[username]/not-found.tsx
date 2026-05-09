"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flame, Home, Search } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/u\/([^/]+)/);
    if (match) {
      setUsername(match[1]);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="mx-auto max-w-lg text-center">
          {/* Icon */}
          <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30">
            <Search className="h-12 w-12 text-primary" />
          </div>

          {/* 404 */}
          <div className="mb-4 text-8xl font-bold text-primary/20">404</div>

          {/* Message */}
          <h1 className="mb-4 text-3xl font-bold tracking-tight">
            User Not Found
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Hmm, looks like <span className="font-semibold text-foreground">@{username}</span> doesn&apos;t exist yet.
            <br />
            Maybe they haven&apos;t joined StreakWatch, or the username is different.
          </p>

          {/* Actions */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button variant="outline" size="lg" className="gap-2">
                <Flame className="h-4 w-4" />
                Create Your Profile
              </Button>
            </Link>
          </div>

          {/* Decorative */}
          <div className="mt-12 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary underline underline-offset-4">
              Browse popular habits →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}