# Authentication Flow - Habit Tracker

## Overview

The Habit Tracker implements authentication via Supabase Auth with multiple authentication methods:
- Google OAuth
- Email/Password
- Magic Link (passwordless)

The implementation uses the PKCE (Proof Key for Code Exchange) flow for secure client-side authentication.

---

## Authentication Architecture

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Supabase Client (Browser) | `lib/supabase/client.ts` | PKCE flow for OAuth |
| Supabase Client (Server) | `lib/supabase/server.ts` | Cookie-based sessions |
| Middleware | `middleware.ts` | Session refresh & route protection |
| Auth Callback | `app/auth/callback/route.ts` | OAuth code exchange |
| Onboarding | `app/onboarding/page.tsx` | Auth UI & flow management |

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOWS                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Google OAuth │     │ Email/Password│     │  Magic Link  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE AUTH SERVICE                            │
│  - Issue tokens                                                     │
│  - Manage sessions                                                  │
│  - Provider security                                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 AUTH CALLBACK (/auth/callback)                      │
│  - Exchange code for session (PKCE)                                │
│  - Set cookies                                                     │
│  - Redirect to dashboard                                           │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE (middleware.ts)                     │
│  - Refresh session                                                  │
│  - Update cookies                                                  │
│  - Protect routes                                                  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 PROTECTED PAGES (/dashboard)                        │
│  - Access user data                                                │
│  - Perform actions                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Google OAuth Flow

### Step-by-Step

```typescript
// app/onboarding/page.tsx - handleGoogleSignIn
const handleGoogleSignIn = async () => {
  const baseUrl = window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
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
};
```

### Sequence Diagram

```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌───────────────┐
│  User   │    │ Onboard │    │ Supabase    │    │ Auth Callback │
│         │    │ Page    │    │ Auth        │    │ Route         │
└────┬────┘    └────┬────┘    └──────┬──────┘    └───────┬───────┘
     │              │                │                   │
     │ Click       │                │                   │
     │ "Continue   │                │                   │
     │  with       │                │                   │
     │ Google"     │                │                   │
     ├─────────────┼───────────────►│                   │
     │              │                │                   │
     │              │                │ Redirect to       │
     │              │                │ Google OAuth      │
     │              │                │ ◄────────────────┤
     │              │                │                   │
     │ ◄────────────┼────────────────│                   │
     │  (redirect)  │                │                   │
     │              │                │                   │
     │──────────────┼───────────────►│                   │
     │ Google login │                │                   │
     │              │                │                   │
     │              │                │ Redirect with     │
     │              │                │ auth code         │
     │              │                │ ◄────────────────┤
     │              │                │                   │
     │◄─────────────┼────────────────│                   │
     │ (to callback)│                │                   │
     │              │                │                   │
     │──────────────┼────────────────┼─────────────────►
     │ Code in URL  │                │ Exchange code    │
     │              │                │ for session      │
     │              │                │                   │
     │              │                │ Set session      │
     │              │                │ cookies          │
     │              │                │ ◄────────────────┤
     │              │                │                   │
     │◄─────────────┼────────────────│ Redirect to      │
     │              │                │ /dashboard        │
     │              │                │                   │
     ▼              ▼                ▼                   ▼
```

### Implementation Details

**Client Configuration** (`lib/supabase/client.ts`):
```typescript
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",  // Required for public clients
      },
    }
  );
}
```

**Callback Handler** (`app/auth/callback/route.ts`):
```typescript
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/onboarding", origin));
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/onboarding?error=${encodeURIComponent(error.message)}`, origin)
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
```

---

## 2. Email/Password Flow

### Sign Up

```typescript
// app/onboarding/page.tsx - handleEmailSignUp
const handleEmailSignUp = async () => {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password: password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: email.split("@")[0],
      },
    },
  });
};
```

### Sign In

```typescript
// app/onboarding/page.tsx - handleEmailSignIn
const handleEmailSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: password,
  });
};
```

### Password Requirements
- Minimum 6 characters (enforced in UI)
- No special validation in database (Supabase handles)

---

## 3. Magic Link Flow (Passwordless)

```typescript
// app/onboarding/page.tsx - handleMagicLink
const handleMagicLink = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};
```

**Flow**:
1. User enters email
2. Supabase sends magic link to email
3. User clicks link
4. Callback handler exchanges code for session
5. Redirect to dashboard

---

## 4. Session Management

### Server-Side Session (Cookies)

**Server Client** (`lib/supabase/server.ts`):
```typescript
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll();
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                sameSite: options?.sameSite ?? "lax",
                path: "/",
              });
            });
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  );
}
```

### Middleware Session Refresh

**Middleware** (`middleware.ts`):
```typescript
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  return response;
}
```

**Session Update** (`lib/supabase/middleware.ts`):
```typescript
// Refreshes expired sessions and updates cookies
// Returns updated response with user object
```

---

## 5. Route Protection

### Middleware Protection

```typescript
// middleware.ts
const protectedRoutes = ["/dashboard"];

if (isProtectedRoute && !user) {
  return NextResponse.redirect(new URL("/onboarding"));
}
```

### Client-Side Checks

```typescript
// app/dashboard/page.tsx
React.useEffect(() => {
  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/onboarding");
      return;
    }
    // ... fetch data
  };

  fetchData();
}, []);
```

### Server Component Checks

```typescript
// app/page.tsx (redirects based on auth state)
export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/onboarding");
  }
}
```

---

## 6. Onboarding Flow

### Multi-Step Process

```
Step 0: Sign In/Sign Up
├── Google OAuth
├── Email/Password Sign In
├── Email/Password Sign Up
└── Magic Link

        │
        ▼

Step 1: Profile Setup
├── Username (unique, for public URL)
├── Display Name
└── Timezone (for streak calculation)

        │
        ▼

Step 2: First Habit (Optional)
├── Template selection
├── Custom habit creation
├── Icon selection
└── Frequency selection

        │
        ▼

        ───► /dashboard
```

### Profile Setup Validation

```typescript
// app/onboarding/page.tsx - handleProfileSubmit
const handleProfileSubmit = async (e: React.FormEvent) => {
  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from("users")
    .select("username")
    .eq("username", normalizedUsername)
    .neq("id", user.id)
    .single();

  if (existingUser) {
    setError("Username already taken. Please choose another.");
    return;
  }

  // Update user profile
  await supabase
    .from("users")
    .upsert({
      id: user.id,
      email: user.email,
      username: normalizedUsername,
      name: name || null,
      timezone,
    }, {
      onConflict: "id",
    });
};
```

---

## 7. Auto-Create User Profile

### Database Trigger

```sql
-- supabase/schema.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name, avatar_url, timezone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**What it does**:
1. Fires when a new user is created in Supabase Auth
2. Automatically creates a profile in the `users` table
3. Uses metadata from OAuth provider (Google) or sign-up data
4. Generates a default username if not provided

---

## 8. Error Handling

### Auth Error Detection

```typescript
// app/onboarding/page.tsx
function isMissingSchemaError(message?: string | null) {
  return Boolean(
    message &&
      (message.includes('relation "public.users" does not exist') ||
        message.includes('relation "users" does not exist'))
  );
}

// Usage
if (isMissingSchemaError(profileError.message)) {
  setError("Your Supabase database schema is missing. Run supabase/schema.sql...");
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid login credentials" | Wrong email/password | Show sign-up option |
| "User already registered" | Email already exists | Show sign-in option |
| "Email not confirmed" | Sign-up requires confirmation | Show confirmation message |
| Schema missing | Tables not created | Run schema.sql |

---

## 9. Security Considerations

### PKCE Flow

- Required for public clients (no secret key)
- Prevents authorization code interception attacks
- Code verifier stored in memory, not cookies

### Cookie Security

```typescript
// Cookies set with:
sameSite: "lax"  // CSRF protection
path: "/"        // Available on all routes
httpOnly: true   // Not accessible from JavaScript
```

### RLS Policies

- Users can only access their own data
- Public data accessible without auth
- Write operations require authentication

---

## 10. Sign Out Flow

```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  router.push("/onboarding");
};
```

**What happens**:
1. Clears Supabase session
2. Removes auth cookies
3. Redirects to onboarding

---

## Summary

| Auth Method | Use Case | Security |
|-------------|----------|----------|
| Google OAuth | Fast sign-in | Highest (provider) |
| Email/Password | Traditional login | Medium (Supabase) |
| Magic Link | Passwordless | High (email verification) |

### Key Takeaways

1. **PKCE is required** for client-side authentication
2. **Cookies** handle server-side session
3. **Middleware** protects routes and refreshes sessions
4. **Auto-profile creation** via database trigger
5. **RLS** ensures data security at the database level

---

*Generated: May 2026*
*Version: 1.0.0*