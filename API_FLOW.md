# API Flow - Habit Tracker

## Overview

The Habit Tracker implements a hybrid API approach:
1. **Direct Supabase Client Calls** - For client-side operations (preferred)
2. **REST API Routes** - For server-side operations and complex logic

---

## API Route Structure

### Endpoints

```
/api
├── /account          # Account management
│   └── route.ts      # GET user account, PUT update profile
├── /habits           # Habit CRUD
│   ├── route.ts      # GET list, POST create
│   └── [id]/
│       └── route.ts  # PUT update, DELETE delete
└── /checkins         # Check-in operations
    └── route.ts      # GET list, POST create, DELETE undo
```

---

## 1. Habits API

### GET /api/habits

**Purpose**: Fetch all habits for the authenticated user.

**Location**: `app/api/habits/route.ts`

**Request**:
```http
GET /api/habits
Authorization: Bearer <supabase_token>
```

**Response**:
```json
{
  "habits": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "Morning Run",
      "icon": "🏃",
      "color": "#22c55e",
      "frequency": ["mon", "tue", "wed", "thu", "fri"],
      "is_public": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Implementation**:
```typescript
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ habits: data });
}
```

**Security**: Uses `createServerClient()` which reads auth cookies set by middleware.

---

### POST /api/habits

**Purpose**: Create a new habit.

**Location**: `app/api/habits/route.ts`

**Request**:
```http
POST /api/habits
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "title": "Read 30 minutes",
  "icon": "📚",
  "color": "#3b82f6",
  "frequency": ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  "is_public": true
}
```

**Validation**:
- `title` is required and must not be empty
- `frequency` must have at least one day

**Response** (201 Created):
```json
{
  "habit": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Read 30 minutes",
    ...
  }
}
```

**Implementation**:
```typescript
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, icon, color, frequency, is_public } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!frequency || frequency.length === 0) {
      return NextResponse.json(
        { error: "At least one frequency day is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title: title.trim(),
        icon: icon || "🎯",
        color: color || "#ef4444",
        frequency,
        is_public: is_public || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ habit: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
```

---

### PUT /api/habits/[id]

**Purpose**: Update an existing habit.

**Location**: `app/api/habits/[id]/route.ts`

**Request**:
```http
PUT /api/habits/[id]
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "title": "Updated Title",
  "frequency": ["mon", "wed", "fri"],
  "is_public": false
}
```

**Response** (200 OK):
```json
{
  "habit": {
    "id": "uuid",
    ...
  }
}
```

**Implementation**:
```typescript
// Similar to POST, but uses .update() and .eq("id", id)
```

---

### DELETE /api/habits/[id]

**Purpose**: Delete a habit and all associated check-ins.

**Location**: `app/api/habits/[id]/route.ts`

**Request**:
```http
DELETE /api/habits/[id]
Authorization: Bearer <supabase_token>
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Cascade**: Deleting a habit automatically removes associated check-ins due to `ON DELETE CASCADE` foreign key constraint.

---

## 2. Check-ins API

### GET /api/checkins

**Purpose**: Fetch all check-ins for the user's habits.

**Location**: `app/api/checkins/route.ts`

**Request**:
```http
GET /api/checkins
Authorization: Bearer <supabase_token>
```

**Response**:
```json
{
  "checkins": [
    {
      "habit_id": "uuid",
      "checked_date": "2024-01-15",
      "created_at": "2024-01-15T08:30:00Z"
    }
  ]
}
```

---

### POST /api/checkins

**Purpose**: Check in for a habit for today.

**Request**:
```http
POST /api/checkins
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "habit_id": "uuid"
}
```

**Validation**:
- `habit_id` is required
- User must own the habit
- Cannot check in twice in the same day (409 Conflict)

**Timezone Handling**:
```typescript
// Get user's timezone from profile
const { data: profile } = await supabase
  .from("users")
  .select("timezone")
  .eq("id", user.id)
  .single();

const timezone = profile?.timezone || "UTC";
const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");

// Check if already checked in
const { data: existing } = await supabase
  .from("checkins")
  .select("id")
  .eq("habit_id", habit_id)
  .eq("checked_date", todayStr)
  .single();

if (existing) {
  return NextResponse.json(
    { error: "Already checked in today" },
    { status: 409 }
  );
}
```

**Response** (201 Created):
```json
{
  "checkin": {
    "id": "uuid",
    "habit_id": "uuid",
    "user_id": "uuid",
    "checked_date": "2024-01-15",
    "created_at": "2024-01-15T08:30:00Z"
  }
}
```

---

### DELETE /api/checkins

**Purpose**: Undo today's check-in.

**Request**:
```http
DELETE /api/checkins
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "habit_id": "uuid"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Implementation**:
```typescript
// Get today's date in user's timezone
const todayStr = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");

// Delete today's check-in
const { error } = await supabase
  .from("checkins")
  .delete()
  .eq("habit_id", habit_id)
  .eq("user_id", user.id)
  .eq("checked_date", todayStr);
```

---

## 3. Account API

### GET /api/account

**Purpose**: Fetch current user's account details.

**Location**: `app/api/account/route.ts`

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "name": "John Doe",
    "avatar_url": "https://...",
    "timezone": "America/New_York",
    "is_pro": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /api/account

**Purpose**: Update user profile.

**Request**:
```http
PUT /api/account
Content-Type: application/json
Authorization: Bearer <supabase_token>

{
  "username": "johndoe",
  "name": "John Doe",
  "timezone": "America/New_York"
}
```

**Validation**:
- `username` must be unique
- `username` must be alphanumeric (with underscores)

---

## 4. Client-Side Direct Calls

Instead of using API routes, the application often calls Supabase directly from client components:

### Example: Check-in from HabitCard

```typescript
// components/HabitCard.tsx
const handleCheckIn = async (habitId: string) => {
  const supabase = createClient();
  const todayStr = formatInTimeZone(new Date(), user.timezone, "yyyy-MM-dd");

  if (habit.is_checked_in_today) {
    // Undo check-in
    await supabase
      .from("checkins")
      .delete()
      .eq("habit_id", habitId)
      .eq("checked_date", todayStr);
  } else {
    // Create check-in
    await supabase
      .from("checkins")
      .insert({
        habit_id: habitId,
        user_id: user.id,
        checked_date: todayStr,
      });
  }

  // Update local state
  updateHabit(habitId, { /* updates */ });
};
```

### Why Direct Calls?

| Approach | Pros | Cons |
|----------|------|------|
| **Direct Supabase** | Simpler, less code, real-time | All logic in client |
| **API Routes** | Server validation, hidden logic | More code, extra hop |

**Decision**: Use direct Supabase calls for CRUD operations. Use API routes when:
- Need server-side validation
- Need to hide business logic
- Called from external sources (webhooks)

---

## 5. Data Flow Examples

### Creating a Habit (Direct Call)

```
User fills habit form
        │
        ▼
HabitFormModal submits
        │
        ▼
supabase.from("habits").insert({...})
        │
        ▼
Supabase Database (RLS checks user_id)
        │
        ▼
Zustand store updated
        │
        ▼
UI re-renders with new habit
```

### Checking In (Optimistic Update)

```
User clicks check-in button
        │
        ▼
Optimistic UI update (immediate)
        │
        ▼
supabase.from("checkins").insert({...})
        │
        ▼
Check for milestone (7, 21, 30, 66, 100 days)
        │
        ▼
If milestone: show MilestoneModal
        │
        ▼
Update streak in Zustand store
```

### Fetching Dashboard Data

```
Page loads
        │
        ▼
useEffect runs
        │
        ▼
supabase.auth.getUser() → get current user
        │
        ▼
supabase.from("users").select("*") → get profile
        │
        ▼
supabase.from("habits").select("*") → get habits
        │
        ▼
supabase.from("checkins").select("*") → get all check-ins
        │
        ▼
calculateStreak() for each habit
        │
        ▼
setHabits() → Zustand store
        │
        ▼
UI renders with streaks
```

---

## 6. Error Handling

### API Route Errors

```typescript
// Consistent error response format
return NextResponse.json({ error: "Human readable message" }, { status: 400 });

// Common status codes
400  // Bad request (validation failure)
401  // Unauthorized (not logged in)
404  // Not found (resource doesn't exist)
409  // Conflict (already exists)
500  // Server error (database issue)
```

### Client-Side Error Handling

```typescript
// Inside component
const { error } = await supabase.from("habits").insert({...});

if (error) {
  addToast("Failed to create habit: " + error.message, "error");
  return;
}

// Success
addToast("Habit created!", "success");
```

---

## 7. API Security

### Authentication

All API routes verify user identity:

```typescript
const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### RLS Enforcement

Even with API routes, RLS policies still apply:

```sql
-- Users can only create habits for themselves
CREATE POLICY "Users can create habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

This prevents malicious API calls from creating habits for other users.

### Input Validation

All inputs are validated server-side:

```typescript
if (!title?.trim()) {
  return NextResponse.json({ error: "Title is required" }, { status: 400 });
}

if (!frequency || frequency.length === 0) {
  return NextResponse.json(
    { error: "At least one frequency day is required" },
    { status: 400 }
  );
}
```

---

## Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/habits` | GET | List user's habits |
| `/api/habits` | POST | Create new habit |
| `/api/habits/[id]` | PUT | Update habit |
| `/api/habits/[id]` | DELETE | Delete habit |
| `/api/checkins` | GET | List user's check-ins |
| `/api/checkins` | POST | Check in today |
| `/api/checkins` | DELETE | Undo check-in |
| `/api/account` | GET | Get profile |
| `/api/account` | PUT | Update profile |

### Key Design Decisions

1. **Direct Supabase for CRUD** - Simpler code, real-time
2. **Server client for API routes** - Uses cookies for auth
3. **RLS as security layer** - Database-level protection
4. **Timezone-aware dates** - Uses date-fns-tz for check-ins

---

*Generated: May 2026*
*Version: 1.0.0*