"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Flame,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn, HABIT_ICONS, HABIT_COLORS, DAY_SHORT_NAMES, TIMEZONES } from "@/lib/utils";
import type { FrequencyDay } from "@/lib/types";

const STEPS = [
  { id: 0, title: "Welcome", description: "Sign in or sign up" },
  { id: 1, title: "Profile", description: "Set up your profile" },
  { id: 2, title: "First Habit", description: "Create your first habit" },
];

const HABIT_TEMPLATES = [
  { title: "Morning Exercise", icon: "🏃", frequency: ["mon", "tue", "wed", "thu", "fri"] as FrequencyDay[] },
  { title: "Read 30 Minutes", icon: "📚", frequency: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as FrequencyDay[] },
  { title: "Drink 8 Glasses of Water", icon: "💧", frequency: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as FrequencyDay[] },
  { title: "Meditate", icon: "🧘", frequency: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as FrequencyDay[] },
  { title: "Journal", icon: "✍️", frequency: ["mon", "tue", "wed", "thu", "fri"] as FrequencyDay[] },
];

const ALL_DAYS: FrequencyDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DEFAULT_TEMPLATE = HABIT_TEMPLATES[0];

function isMissingSchemaError(message?: string | null) {
  return Boolean(
    message &&
      (message.includes('relation "public.users" does not exist') ||
        message.includes('relation "users" does not exist') ||
        message.includes('relation "public.habits" does not exist') ||
        message.includes('relation "habits" does not exist'))
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);

  // Auth mode: 'email' for login/signup, 'google' for Google OAuth
  const [authMode, setAuthMode] = React.useState<"email" | "google">("email");
  const [isSignUp, setIsSignUp] = React.useState(false);

  // Email/Password form state
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  // Profile form state
  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [timezone, setTimezone] = React.useState("America/New_York");

  // Habit form state
  const [habitTitle, setHabitTitle] = React.useState(DEFAULT_TEMPLATE.title);
  const [habitIcon, setHabitIcon] = React.useState(DEFAULT_TEMPLATE.icon);
  const [habitColor, setHabitColor] = React.useState(HABIT_COLORS[0]);
  const [habitFrequency, setHabitFrequency] = React.useState<FrequencyDay[]>(DEFAULT_TEMPLATE.frequency);

  // Check for auth error in URL
  React.useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setIsLoading(false);
    }
  }, [searchParams]);

  // Check if user is already logged in
  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("timezone, name")
            .eq("id", user.id)
            .single();

          if (profileError && isMissingSchemaError(profileError.message)) {
            setError("Your Supabase database schema is missing. Run supabase/schema.sql in the SQL editor, then try again.");
            setStep(1);
            return;
          }

          if (!profile?.timezone || profile.timezone === "UTC") {
            setName(profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
            setStep(1);
          } else {
            router.push("/dashboard");
          }
        } else {
          setStep(0);
        }
      } catch (err) {
        console.error("Error checking user:", err);
        setStep(0);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, supabase, searchParams]);

  // Handle email/password sign in
  const handleEmailSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log("Attempting login with:", email.trim().toLowerCase());

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log("Login response:", { data, error: signInError });

      if (signInError) {
        console.log("Login error:", signInError.message);
        // If password login fails, try magic link
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid credentials. Try the Sign Up tab to create an account, or use Forgot Password.");
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log("Login success, user:", data.user.id);
        // Check if user profile exists
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("timezone, name")
          .eq("id", data.user.id)
          .single();

        if (profileError && isMissingSchemaError(profileError.message)) {
          setError("Your Supabase database schema is missing. Run supabase/schema.sql in the SQL editor, then try again.");
          setIsLoading(false);
          return;
        }

        if (!profile || !profile.timezone || profile.timezone === "UTC") {
          setName(profile?.name || data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "");
          setStep(1);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle magic link (no password needed)
  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (magicError) {
        setError(magicError.message);
        setIsLoading(false);
        return;
      }

      // Show success message
      setError("Check your email for the magic link!");
      setIsLoading(false);
    } catch (err) {
      console.error("Magic link error:", err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Handle email/password sign up
  const handleEmailSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to sign up with auto-confirm (no email confirmation required)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: email.split("@")[0],
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }

      // If user is created (even without confirmation), proceed
      if (data.user) {
        // If user was created without email confirmation, auto-login
        if (!data.session && signUpError === null) {
          // User needs to verify email - show message
          setError("Please check your email to confirm your account, then sign in.");
          setIsSignUp(false);
          setIsLoading(false);
          return;
        }

        // If session exists (auto-confirm), proceed to profile
        if (data.session) {
          setName(email.split("@")[0]);
          setStep(1);
        }
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = window.location.origin;
      console.log("Starting Google OAuth...");
      
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=/dashboard`,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      console.log("OAuth response:", { data, error: signInError });

      if (signInError) {
        console.error("Sign in error:", signInError.message);
        setError(signInError.message);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("An unexpected error occurred: " + err);
      setIsLoading(false);
    }
  };

  // Handle profile submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in");
        return;
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from("users")
        .select("username")
        .eq("username", username.toLowerCase().replace(/[^a-z0-9_]/g, "_"))
        .neq("id", user.id)
        .single();

      if (existingUser) {
        setError("Username already taken. Please choose another.");
        setIsLoading(false);
        return;
      }

      const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "_");

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            username: normalizedUsername,
            name: name || null,
            timezone,
          },
          {
            onConflict: "id",
          }
        );

      if (updateError) {
        if (isMissingSchemaError(updateError.message)) {
          setError("Your Supabase database schema is missing. Run supabase/schema.sql in the SQL editor, then try again.");
          return;
        }
        if (updateError.message.includes("unique")) {
          setError("Username already taken. Please choose another.");
        } else {
          setError(updateError.message);
        }
        return;
      }

      setStep(2);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle create habit
  const handleCreateHabit = async (habitData?: {
    title: string;
    icon: string;
    color: string;
    frequency: FrequencyDay[];
  }) => {
    const title = habitData?.title || habitTitle;
    if (!title.trim()) {
      setError("Please enter a habit name");
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log("Creating habit with title:", title);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current user:", user?.id);
      
      if (!user) {
        setError("You must be logged in - please sign in again");
        setIsLoading(false);
        return;
      }

      console.log("Inserting habit for user:", user.id);
      
      const { data, error } = await supabase.from("habits").insert({
        user_id: user.id,
        title: title,
        icon: habitData?.icon || habitIcon,
        color: habitData?.color || habitColor,
        frequency: habitData?.frequency || habitFrequency,
        is_public: true,
      }).select();

      console.log("Habit insert response:", { data, error });

      if (error) {
        console.error("Habit insert error:", error.message);
        if (isMissingSchemaError(error.message)) {
          setError("The habits table is missing in Supabase. Run supabase/schema.sql in the SQL editor, then try again.");
        } else {
          setError("Error creating habit: " + error.message);
        }
        setIsLoading(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      console.error("Create habit exception:", err);
      setError("An unexpected error occurred: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template: typeof HABIT_TEMPLATES[0]) => {
    setHabitTitle(template.title);
    setHabitIcon(template.icon);
    setHabitFrequency(template.frequency);
  };

  const toggleDay = (day: FrequencyDay) => {
    setHabitFrequency((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (isLoading && step === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-blue-50 px-4 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
          <Flame className="h-7 w-7 text-white" />
        </div>
        <span className="text-2xl font-bold">HabitTracker</span>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center gap-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "border-2 border-primary text-primary"
                    : "border-2 border-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : s.id + 1}
              </div>
              <span className={cn(
                "hidden text-sm md:block",
                i <= step ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "h-8 w-8 border-b-2",
                i < step ? "border-primary" : "border-muted"
              )} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 w-full max-w-md rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step Content */}
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          {/* Step 0: Sign In / Sign Up */}
          {step === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-bold">
                  {isSignUp ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-muted-foreground">
                  {isSignUp 
                    ? "Sign up to start tracking your habits"
                    : "Sign in to continue your journey"}
                </p>
              </div>

              {/* Auth Mode Toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("email")}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                    authMode === "email" 
                      ? "bg-background shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  <Mail className="mr-2 inline h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("google")}
                  className={cn(
                    "flex-1 rounded-md py-2 text-sm font-medium transition-all",
                    authMode === "google" 
                      ? "bg-background shadow-sm" 
                      : "text-muted-foreground"
                  )}
                >
                  Google
                </button>
              </div>

              {/* Email/Password Form */}
              {authMode === "email" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={isSignUp ? handleEmailSignUp : handleEmailSignIn}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {isSignUp ? "Sign Up" : "Sign In"}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleMagicLink}
                      disabled={isLoading || !email.trim()}
                      title="Send a magic link to your email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center text-sm">
                    {isSignUp ? (
                      <>
                        <span className="text-muted-foreground">Already have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false);
                            setError(null);
                          }}
                          className="text-primary hover:underline"
                        >
                          Sign In
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Don't have an account? </span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(true);
                            setError(null);
                          }}
                          className="text-primary hover:underline"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Google Auth */}
              {authMode === "google" && (
                <div className="space-y-4">
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    Continue with Google
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          )}

          {/* Step 1: Profile Setup */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="text-center">
                  <h1 className="mb-2 text-2xl font-bold">Set Up Your Profile</h1>
                  <p className="text-muted-foreground">
                    Customize how you appear to others.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                      yoursite.com/u/
                    </span>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      className="rounded-l-none"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will be your public profile URL.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for streak calculations and reminders.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Step 2: First Habit */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h1 className="mb-2 text-2xl font-bold">Create Your First Habit</h1>
                <p className="text-muted-foreground">
                  Start building a positive habit today.
                </p>
              </div>

              {/* Templates */}
              <div className="space-y-2">
                <Label>Quick Start Templates</Label>
                <div className="grid grid-cols-2 gap-2">
                  {HABIT_TEMPLATES.map((template) => (
                    <button
                      key={template.title}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border p-3 text-left transition-all hover:bg-accent",
                        habitTitle === template.title && "border-primary bg-primary/5"
                      )}
                    >
                      <span className="text-xl">{template.icon}</span>
                      <span className="text-sm">{template.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or create your own
                  </span>
                </div>
              </div>

              {/* Custom Habit Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Habit Name</Label>
                  <Input
                    placeholder="e.g., Morning Run"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.slice(0, 12).map((item) => (
                      <button
                        key={item.emoji}
                        type="button"
                        onClick={() => setHabitIcon(item.emoji)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all",
                          habitIcon === item.emoji
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-all",
                          habitFrequency.includes(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {DAY_SHORT_NAMES[day]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => handleCreateHabit()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Create Habit
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Skip for now
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
