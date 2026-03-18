

# Fix RLS Infinite Recursion + Harden Auth Fallback

## Analysis

**BUG 1 (Route mismatch): NOT a real bug.** The code navigates to `/results` with location state (lines 321, 375 of Analyze.tsx). The route `/results` exists in App.tsx and renders the Results component. There is no navigation to `/song/${id}` anywhere. If a 404 occurs, it's because the Results page redirects to `/analyze` when `location.state` is missing — which happens when the analysis fails to complete due to BUG 2.

**BUG 2 (RLS infinite recursion): CONFIRMED and CRITICAL.** Console shows `infinite recursion detected in policy for relation "viralize_users"`. Looking at the RLS policies:

- "Admins can delete any user" → `EXISTS (SELECT 1 FROM viralize_users WHERE id = auth.uid() AND is_admin = true)` — **self-referencing, causes recursion**
- "Admins can view all users" → same pattern — **causes recursion**
- "Users can update own profile safely" → WITH CHECK has subqueries like `SELECT vu.is_admin FROM viralize_users vu WHERE vu.id = auth.uid()` — **causes recursion**

The "Users can view own profile" policy (`id = auth.uid()`) is correct and doesn't recurse. But the admin policies and the protected-field update policy all query `viralize_users` from within `viralize_users` RLS — infinite loop.

## Plan

### 1. SQL Migration: Fix all recursive RLS policies

Create a `SECURITY DEFINER` function to check admin status without triggering RLS:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.viralize_users WHERE id = _user_id),
    false
  );
$$;
```

Then create a helper to get protected field values for the update check:

```sql
CREATE OR REPLACE FUNCTION public.get_user_protected_fields(_user_id uuid)
RETURNS TABLE(is_admin boolean, credits int, plan text, ...)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ ... $$;
```

Drop and recreate all 7 problematic policies on `viralize_users`:
- Replace `EXISTS (SELECT 1 FROM viralize_users ...)` with `public.is_admin(auth.uid())`
- Replace protected-field subqueries in WITH CHECK with the security definer function

Also fix the same pattern on other tables (`admin_audit_logs`, `admin_settings`, `viral_dna_cache`, `viralize_analyses`, `viralize_remixes`, `admin_impersonation_sessions`) — all their admin policies use `EXISTS (SELECT 1 FROM viralize_users WHERE ...)` which also triggers the recursion.

### 2. Code change: Add graceful fallback in AuthContext

In `fetchOrCreateProfile` (AuthContext.tsx), catch the "infinite recursion" error and fall back to a minimal profile built from `auth.user()` data, so the app doesn't break entirely if the DB policy issue recurs:

```typescript
if (error?.message?.includes('infinite recursion')) {
  console.warn('RLS recursion fallback — using auth.user() data');
  return {
    id: u.id,
    email: u.email || '',
    display_name: u.user_metadata?.full_name || u.email?.split('@')[0] || null,
    plan: 'free' as Plan,
    // ... zero defaults for usage fields
  } as ViralizeProfile;
}
```

### Files changed
- **New migration**: Fix all recursive RLS policies across all tables using `SECURITY DEFINER` functions
- **`src/contexts/AuthContext.tsx`**: Add infinite recursion fallback in `fetchOrCreateProfile`

