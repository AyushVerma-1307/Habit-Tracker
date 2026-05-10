"use client";

import { Flame, Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-grid-soft opacity-30" />
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated flame icon */}
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-2xl shadow-orange-500/30 animate-pulse">
            <Flame className="h-10 w-10 text-white" />
          </div>
          
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-orange-500/50 animate-ping" />
        </div>
        
        {/* Loading text */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">Loading...</h2>
          <p className="text-muted-foreground">Preparing your dashboard</p>
        </div>
        
        {/* Loading spinner */}
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}