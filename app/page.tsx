"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  Flame,
  Globe,
  MessageCircle,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function FloatingParticle({ delay }: { delay: number }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPosition({
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
      });
      setOpacity(Math.random() * 0.3 + 0.1);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className="absolute h-2 w-2 rounded-full bg-primary animate-float"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        opacity,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StreakWatch</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/onboarding">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="hidden sm:inline-flex">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
          {/* Floating Particles */}
          <FloatingParticle delay={0} />
          <FloatingParticle delay={500} />
          <FloatingParticle delay={1000} />
          <FloatingParticle delay={1500} />
          <FloatingParticle delay={2000} />
          <FloatingParticle delay={2500} />
        </div>

        <div className="container relative mx-auto px-4 py-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-muted-foreground">
                Join 2,847 people building better habits
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              Don&apos;t break the chain.
              <br />
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                The internet is watching.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mb-10 max-w-2xl text-xl text-muted-foreground">
              Build lasting habits with the power of accountability. Share your
              progress, get nudged by friends, and never break your streak again.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/onboarding">
                <Button size="lg" className="btn-lift h-12 gap-2 text-base">
                  Start Building Habits
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="btn-lift h-12 gap-2 text-base"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Social Proof - Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 rounded-2xl border bg-card/50 p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">47,892</div>
                <div className="text-sm text-muted-foreground">Habits Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">2.1M+</div>
                <div className="text-sm text-muted-foreground">Check-ins</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">89%</div>
                <div className="text-sm text-muted-foreground">Retention</div>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20">
            <DemoPreview />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Everything you need to build lasting habits
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Simple, powerful tools designed to keep you accountable and motivated.
            </p>
          </AnimatedSection>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <AnimatedSection delay={100}>
              <FeatureCard
                icon={<Flame className="h-6 w-6" />}
                title="Streak Tracking"
                description="Watch your streak grow day by day. Miss a day? See your streak reset and feel the motivation to get back on track."
              />
            </AnimatedSection>
            <AnimatedSection delay={200}>
              <FeatureCard
                icon={<Globe className="h-6 w-6" />}
                title="Public Accountability"
                description="Share your habit dashboard with the world. When friends can see your progress, social pressure becomes your superpower."
              />
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Get Nudged"
                description="Friends can send you motivation when you&apos;re slacking. A little nudge goes a long way in keeping you consistent."
              />
            </AnimatedSection>
            <AnimatedSection delay={400}>
              <FeatureCard
                icon={<MessageCircle className="h-6 w-6" />}
                title="Reactions & Comments"
                description="Receive fire reactions and encouraging comments on your progress. Celebrate milestones with your community."
              />
            </AnimatedSection>
            <AnimatedSection delay={500}>
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title="GitHub-Style Heatmap"
                description="Visualize your consistency with a beautiful activity heatmap. See patterns, track progress, and celebrate consistency."
              />
            </AnimatedSection>
            <AnimatedSection delay={600}>
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Milestone Celebrations"
                description="Hit 7, 21, 30, 66, or 100 days? We&apos;ll celebrate with you and help you share your achievements."
              />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Start in 60 seconds
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Getting started is simple. No credit card required.
            </p>
          </AnimatedSection>

          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Connection Lines */}
              <div className="absolute left-8 top-1/2 h-px w-[calc(100%-4rem)] bg-border md:left-1/2 md:top-0 md:h-[calc(100%-8rem)] md:w-px" />

              <div className="space-y-12">
                <Step
                  number={1}
                  title="Create your account"
                  description="Sign up with Google or email in seconds. Pick a username for your public profile."
                  align="right"
                  delay={100}
                />
                <Step
                  number={2}
                  title="Add your habits"
                  description="Start from templates or create custom habits. Set your frequency - daily, weekdays, or custom days."
                  align="left"
                  delay={200}
                />
                <Step
                  number={3}
                  title="Check in daily"
                  description="One click to mark your habit complete. Watch your streak grow."
                  align="right"
                  delay={300}
                />
                <Step
                  number={4}
                  title="Share & get accountability"
                  description="Share your public link. Friends can react, comment, and nudge you to stay on track."
                  align="left"
                  delay={400}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 p-12 text-center md:p-20">
            {/* Background Pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>

            <div className="relative">
              <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
                Ready to build your streak?
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-xl text-white/80">
                Join thousands of people who have transformed their habits with
                StreakWatch. Free forever, no credit card needed.
              </p>
              <Link href="/onboarding">
                <Button
                  size="lg"
                  className="h-12 gap-2 text-base bg-white text-primary hover:bg-white/90"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <AnimatedSection className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Start free. Upgrade when you need more.
            </p>
          </AnimatedSection>

          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Free Plan */}
            <Card className="relative overflow-hidden">
              <CardContent className="p-8">
                <h3 className="mb-2 text-2xl font-bold">Free</h3>
                <p className="mb-6 text-muted-foreground">
                  Perfect for getting started
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mb-8 space-y-3">
                  <ListItem checked>Up to 3 habits</ListItem>
                  <ListItem checked>Public profile</ListItem>
                  <ListItem checked>Basic analytics</ListItem>
                  <ListItem checked>Community support</ListItem>
                </ul>
                <Link href="/onboarding" className="block">
                  <Button variant="outline" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative overflow-hidden border-primary">
              <div className="absolute right-4 top-4">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Popular
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="mb-2 text-2xl font-bold">Pro</h3>
                <p className="mb-6 text-muted-foreground">
                  For serious habit builders
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">$5</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mb-8 space-y-3">
                  <ListItem checked>Unlimited habits</ListItem>
                  <ListItem checked>Email reminders</ListItem>
                  <ListItem checked>Advanced analytics</ListItem>
                  <ListItem checked>Nudge rate limiting</ListItem>
                  <ListItem checked>Priority support</ListItem>
                </ul>
                <Link href="/onboarding" className="block">
                  <Button className="w-full">Start 14-day Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Flame className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">StreakWatch</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for habit builders, by habit builders.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
              <a href="#" className="hover:text-foreground">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature Card Component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 cursor-pointer group"
      style={{
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-semibold transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Step Component
function Step({
  number,
  title,
  description,
  align,
  delay = 0,
}: {
  number: number;
  title: string;
  description: string;
  align: "left" | "right";
  delay?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatedSection delay={delay}>
      <div
        className={cn(
          "relative flex items-center gap-8",
          align === "right" ? "md:flex-row" : "md:flex-row-reverse"
        )}
      >
        {/* Number Circle */}
        <div
          className={cn(
            "z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground transition-all duration-300",
            align === "right" ? "md:order-1" : "md:order-1",
            isHovered && "scale-110 shadow-lg shadow-primary/30"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {number}
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex-1 rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30",
            align === "right" ? "md:text-left" : "md:text-right"
          )}
        >
          <h3 className="mb-2 text-xl font-semibold">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </AnimatedSection>
  );
}

// List Item Component
function ListItem({
  checked,
  children,
}: {
  checked: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 className="h-5 w-5 text-green-500" />
      <span>{children}</span>
    </li>
  );
}

// Demo Preview Component
function DemoPreview() {
  const [hoveredHabit, setHoveredHabit] = useState<string | null>(null);
  const habits = [
    { icon: "💪", title: "Workout", streak: 15, color: "#ef4444", checked: true },
    { icon: "📚", title: "Reading", streak: 8, color: "#3b82f6", checked: true },
    { icon: "💧", title: "Drink Water", streak: 23, color: "#06b6d4", checked: false },
  ];

  return (
    <AnimatedSection delay={300} className="mx-auto max-w-3xl">
      <div className="rounded-2xl border bg-card/50 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500">
            <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-br from-orange-400 to-red-500 opacity-50" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Alex Johnson</h3>
            <p className="text-sm text-muted-foreground">@alexjohnson</p>
          </div>
        </div>

        <div className="space-y-4">
          {habits.map((habit, index) => (
            <div
              key={habit.title}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
              style={{
                borderLeftColor: habit.color,
                borderLeftWidth: 4,
                animationDelay: `${index * 100}ms`,
              }}
              onMouseEnter={() => setHoveredHabit(habit.title)}
              onMouseLeave={() => setHoveredHabit(null)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl transition-transform group-hover:scale-125">
                  {habit.icon}
                </span>
                <div>
                  <p className="font-semibold">{habit.title}</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span>{habit.streak} day streak</span>
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all duration-300",
                  habit.checked
                    ? "bg-green-500 text-white group-hover:bg-green-400 group-hover:scale-110"
                    : "bg-muted text-muted-foreground group-hover:bg-orange-100"
                )}
              >
                {habit.checked ? "✓" : "○"}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4 transition-colors hover:text-primary" />
          <span>12 comments</span>
          <span>•</span>
          <span>47 reactions</span>
          <span>•</span>
          <span>8 nudges sent</span>
        </div>
      </div>
    </AnimatedSection>
  );
}