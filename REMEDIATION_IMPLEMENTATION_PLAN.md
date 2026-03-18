# Security Remediation Implementation Plan
**Status:** Ready for Implementation
**Target Completion:** 2 weeks for critical path

---

## PHASE 1: EMERGENCY FIXES (Hours 0-24)

### Fix #1: Remove Hardcoded API Keys ⚠️ CRITICAL

**Files to Change:**
- `/src/lib/supabase.ts`
- `/src/lib/stripe.ts`
- `/src/integrations/supabase/client.ts`

**Current State:**
```typescript
// ❌ EXPOSED
const supabaseUrl = 'https://euszgnaahwmdbfdewaky.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**After Fix:**
```typescript
// ✅ SAFE - From environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
```

**Steps:**
```
1. Create .env file from .env.local.example:
   VITE_SUPABASE_URL=https://euszgnaahwmdbfdewaky.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...

2. Update /src/lib/supabase.ts to use env.VITE_* variables only

3. Update /src/lib/stripe.ts:
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

4. Remove fallback hardcoded values

5. Verify .gitignore includes .env.local, .env.production.local

6. Test locally: npm run dev
```

**Verification:**
```bash
# Verify no hardcoded keys in source
grep -r "eyJhbGci" src/ 2>/dev/null  # Should return nothing
grep -r "euszgnaahwm" src/ 2>/dev/null  # Should return nothing

# Verify .env works
npm run dev  # Check console for "Missing" error if not set
```

---

### Fix #2: Re-enable AdminGuard ⚠️ CRITICAL

**File:** `/src/components/admin/AdminGuard.tsx`

**Current State:**
```typescript
export const AdminGuard = ({ children }: AdminGuardProps) => {
  // TODO: Re-enable admin check before production
  return <>{children}</>; // ❌ NO PROTECTION
};
```

**After Fix:**
```typescript
import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const navigate = useNavigate();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (!profile?.is_admin) {
      navigate('/');
      // Toast will show error
    }
  }, [profile?.is_admin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return null;
  }

  return <>{children}</>;
};
```

**Steps:**
```
1. Replace AdminGuard.tsx content above
2. Test non-admin user access to /admin → Should redirect to /
3. Test admin user access to /admin → Should work
4. Verify is_admin is set correctly in AuthContext
```

---

### Fix #3: Rotate All Exposed API Keys

**Supabase Side:**
```
1. Login to Supabase Console
2. Project > Settings > API > Anon Key
3. Click "Rotate" button
4. Copy new key → Add to .env
5. Run tests to verify
6. Deploy new version
7. Invalidate old key
```

**Stripe Side:**
```
1. Login to Stripe Dashboard
2. Developers > API Keys
3. Generate new Publishable Key
4. Add to .env: VITE_STRIPE_PUBLISHABLE_KEY=pk_...
5. Update in src/lib/stripe.ts
6. Invalidate old key
```

---

### Fix #4: Update .gitignore

**File:** `.gitignore`

**Add/Verify:**
```
# Environment variables
.env
.env.local
.env.*.local
.env.production.local
.env.development.local

# Secrets
*.pem
*.key
*.p12
.secrets/
secrets/

# Credentials (if any)
credentials.json
service-account-key.json
```

---

### Fix #5: Scan Git History for Secrets

**Steps:**
```bash
# Check for exposed secrets in history
git log --all -p | grep -i "apikey\|secret\|password\|token" | head -30

# Use git-secrets if available
git secrets --scan
# Or install: brew install git-secrets

# Use TruffleHog to scan
pip install truffleHog
truffleHog filesystem . --json
```

**If secrets found:**
```bash
# Rotate keys immediately
# Rewrite history (ONLY before production deployment)
git filter-branch --tree-filter 'grep -r "apikey" && exit 1 || exit 0' HEAD
# Or use BFG Repo-Cleaner: bfg --replace-text secrets.txt
```

---

## PHASE 2: CRITICAL FIXES (Days 1-7)

### Fix #6: Implement Supabase RLS Policies

**Create `/supabase/migrations/001_add_rls_policies.sql`:**

```sql
-- Enable RLS on all tables
ALTER TABLE viralize_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_audit_logs ENABLE ROW LEVEL SECURITY;

-- ========== USERS TABLE POLICIES ==========
-- Users can only see their own profile
CREATE POLICY "Users can view their own profile"
  ON viralize_users FOR SELECT
  USING (auth.uid() = id);

-- Users cannot update other users (admin update function will exist)
CREATE POLICY "Users cannot update profiles"
  ON viralize_users FOR UPDATE
  USING (false);

-- Admins can view and manage all users (through functions)
CREATE POLICY "Admins can view all users"
  ON viralize_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========== ANALYSES TABLE POLICIES ==========
CREATE POLICY "Users can view own analyses"
  ON viralize_analyses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert analyses"
  ON viralize_analyses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analyses"
  ON viralize_analyses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all analyses"
  ON viralize_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========== REMIXES TABLE POLICIES ==========
CREATE POLICY "Users can view own remixes"
  ON viralize_remixes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert remixes"
  ON viralize_remixes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all remixes"
  ON viralize_remixes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========== CREDITS TABLE POLICIES ==========
CREATE POLICY "Users can view own credits"
  ON viralize_credits FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage credits"
  ON viralize_credits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ========== AUDIT LOGS TABLE POLICIES ==========
CREATE POLICY "Admins can view audit logs"
  ON viralize_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON viralize_audit_logs FOR INSERT
  WITH CHECK (true);

-- ========== ADMIN FUNCTIONS (Server-side operations) ==========
-- Function to safely update user plan
CREATE OR REPLACE FUNCTION update_user_plan(
  target_user_id uuid,
  new_plan text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate plan value
  IF new_plan NOT IN ('free', 'pro', 'studio', 'business', 'unlimited') THEN
    RETURN json_build_object('error', 'Invalid plan');
  END IF;

  -- Update user
  UPDATE viralize_users
  SET plan = new_plan, updated_at = now()
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO viralize_audit_logs (
    user_id, admin_id, action, resource_type, resource_id,
    old_value, new_value, ip_address
  ) VALUES (
    target_user_id,
    auth.uid(),
    'plan_changed',
    'user',
    target_user_id::text,
    (SELECT plan FROM viralize_users WHERE id = target_user_id),
    new_plan,
    current_setting('request.headers')::json->>'cf-connecting-ip'
  );

  RETURN json_build_object('success', true);
END;
$$;

-- Function to safely add credits
CREATE OR REPLACE FUNCTION add_user_credits(
  target_user_id uuid,
  amount integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate amount
  IF amount < 0 OR amount > 100000 THEN
    RETURN json_build_object('error', 'Invalid amount');
  END IF;

  -- Add credits
  UPDATE viralize_users
  SET credits = credits + amount, updated_at = now()
  WHERE id = target_user_id;

  -- Log the action
  INSERT INTO viralize_audit_logs (
    user_id, admin_id, action, resource_type, resource_id, old_value, new_value
  ) VALUES (
    target_user_id,
    auth.uid(),
    'credits_added',
    'credits',
    target_user_id::text,
    '0',
    amount::text
  );

  RETURN json_build_object('success', true);
END;
$$;
```

**Steps:**
```
1. Create file: supabase/migrations/001_add_rls_policies.sql
2. Apply migration: supabase migration up
3. Test RLS policies:
   - Login as user1, verify can only see own data
   - Login as user2, verify cannot see user1 data
   - Login as admin, verify can see all data
4. Update admin pages to use new functions instead of direct updates
```

---

### Fix #7: Implement Audit Logging System

**Create Table:**
```sql
CREATE TABLE viralize_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL, -- 'user', 'credits', 'analysis', etc
  resource_id text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp DEFAULT now(),
  INDEX (user_id, created_at DESC),
  INDEX (admin_id, created_at DESC),
  INDEX (action, created_at DESC)
);

-- Prevent tampering
ALTER TABLE viralize_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view logs"
  ON viralize_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );
CREATE POLICY "System can insert logs"
  ON viralize_audit_logs FOR INSERT
  WITH CHECK (true);

-- Prevent deletion/update of logs
CREATE POLICY "Prevent log modification"
  ON viralize_audit_logs FOR UPDATE
  USING (false);
CREATE POLICY "Prevent log deletion"
  ON viralize_audit_logs FOR DELETE
  USING (false);
```

**Update Admin Pages to Log Actions:**

```typescript
// In /src/pages/admin/users.tsx
const handleChangePlan = async (userId: string, newPlan: string) => {
  try {
    // Call RLS function instead of direct update
    const { data, error } = await supabase.rpc('update_user_plan', {
      target_user_id: userId,
      new_plan: newPlan
    });

    if (error) {
      toast.error('Failed to update plan: ' + error.message);
      return;
    }

    if (data.error) {
      toast.error('Failed: ' + data.error);
      return;
    }

    toast.success('Plan updated and logged');
    fetchUsers();
  } catch (err) {
    console.error('Error:', err);
    toast.error('System error');
  }
};
```

---

### Fix #8: Add Input Validation with Zod

**Create `/src/lib/validation.ts`:**

```typescript
import { z } from 'zod';

export const planSchema = z.enum(['free', 'pro', 'studio', 'business', 'unlimited']);
export const creditSchema = z.number().int().min(0).max(100000);
export const emailSchema = z.string().email().toLowerCase();
export const userIdSchema = z.string().uuid();

export const validatePlan = (plan: unknown) => {
  return planSchema.safeParse(plan);
};

export const validateCredits = (credits: unknown) => {
  return creditSchema.safeParse(credits);
};

export const validateEmail = (email: unknown) => {
  return emailSchema.safeParse(email);
};

// Admin action schemas
export const updateUserPlanSchema = z.object({
  userId: userIdSchema,
  newPlan: planSchema,
});

export const addCreditsSchema = z.object({
  userId: userIdSchema,
  amount: creditSchema,
});

export const deleteUserSchema = z.object({
  userId: userIdSchema,
  reason: z.string().min(1).max(500), // Require reason
});
```

**Update Admin Pages:**

```typescript
// In /src/pages/admin/users.tsx
import { validatePlan, updateUserPlanSchema } from '@/lib/validation';

const handleChangePlan = async (userId: string, newPlan: string) => {
  // Validate input
  const validation = updateUserPlanSchema.safeParse({
    userId,
    newPlan,
  });

  if (!validation.success) {
    toast.error('Invalid input: ' + validation.error.message);
    return;
  }

  const { error } = await supabase.rpc('update_user_plan', {
    target_user_id: userId,
    new_plan: newPlan
  });

  if (error) {
    toast.error('Failed to change plan: ' + error.message);
  } else {
    toast.success('Plan updated successfully');
    fetchUsers();
  }
  setChangingPlan(null);
};
```

---

### Fix #9: Move Admin Checks to Server-Side

**Key Principle:** Never trust client-side authentication checks

**Update `/src/contexts/AuthContext.tsx`:**

```typescript
// Keep is_admin flag in context for UI purposes only
// BUT: Create server-side endpoint to verify before any action

// Add helper function
export const verifyAdminAccess = async (
  action: string
): Promise<{ isAdmin: boolean; error?: string }> => {
  try {
    // Call edge function to verify
    const response = await fetch(`${supabaseUrl}/functions/v1/verify-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action }),
    });

    const data = await response.json();
    return data;
  } catch (err) {
    return { isAdmin: false, error: 'Verification failed' };
  }
};
```

**Create Supabase Edge Function `/functions/verify-admin/index.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  // Get auth header
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Missing token' }),
      { status: 401 }
    );
  }

  // Verify token and get user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Invalid token' }),
      { status: 401 }
    );
  }

  // Check is_admin in database
  const { data: profile, error: profileError } = await supabase
    .from('viralize_users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    return new Response(
      JSON.stringify({ isAdmin: false, error: 'Not authorized' }),
      { status: 403 }
    );
  }

  return new Response(
    JSON.stringify({ isAdmin: true }),
    { status: 200 }
  );
});
```

---

### Fix #10: Implement Stripe Webhook Verification

**Create Supabase Edge Function `/functions/stripe-webhook/index.ts`:**

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'Missing signature' }),
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400 }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  // Handle events
  switch (event.type) {
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      // Find user by stripe_customer_id
      const { data: user } = await supabase
        .from('viralize_users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user) {
        // Update subscription status
        await supabase
          .from('viralize_users')
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: subscription.id,
            plan_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', user.id);

        // Log action
        await supabase
          .from('viralize_audit_logs')
          .insert({
            user_id: user.id,
            action: 'subscription_updated',
            resource_type: 'subscription',
            resource_id: subscription.id,
            new_value: { status: subscription.status },
          });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      // Find user and send alert
      const { data: user } = await supabase
        .from('viralize_users')
        .select('id, email')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user) {
        // TODO: Send email to user about payment failure
        console.log(`Payment failed for ${user.email}`);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
```

---

### Fix #11: Add Rate Limiting

**Create Supabase Edge Function `/functions/rate-limit-check/index.ts`:**

```typescript
import { createClient } from '@supabase/supabase-js';

interface RateLimitConfig {
  requests: number;
  windowMs: number; // milliseconds
}

const LIMITS: Record<string, RateLimitConfig> = {
  'analysis': { requests: 5, windowMs: 60000 }, // 5 per minute
  'remix': { requests: 3, windowMs: 60000 },
  'signup': { requests: 3, windowMs: 3600000 }, // 3 per hour
  'auth': { requests: 5, windowMs: 300000 }, // 5 per 5 minutes
};

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  const { action, userId, ipAddress } = await req.json();
  const config = LIMITS[action];

  if (!config) {
    return new Response(
      JSON.stringify({ allowed: true }),
      { status: 200 }
    );
  }

  const identifier = userId || ipAddress;
  const key = `rate:${action}:${identifier}`;
  const windowStart = Date.now() - config.windowMs;

  // Count requests in time window (using auth.users caching or Redis alternative)
  // This is simplified; use Redis in production

  // For now, return allowed (implement actual rate limiting with Redis)
  return new Response(
    JSON.stringify({ allowed: true, remaining: config.requests }),
    { status: 200 }
  );
});
```

**In Client Code:**

```typescript
const checkRateLimit = async (action: string): Promise<boolean> => {
  const response = await fetch(`${supabaseUrl}/functions/v1/rate-limit-check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action,
      userId: user?.id,
      ipAddress: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip),
    }),
  });

  const { allowed, remaining } = await response.json();

  if (!allowed) {
    toast.error(`Rate limited. ${remaining} requests remaining.`);
  }

  return allowed;
};

// Use before expensive operations
const handleAnalysis = async () => {
  if (!await checkRateLimit('analysis')) return;
  // ... proceed with analysis
};
```

---

### Fix #12: Implement Role-Based Access Control (RBAC)

**Create Roles Table:**

```sql
CREATE TABLE viralize_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE viralize_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES viralize_roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE viralize_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES viralize_users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES viralize_roles(id) ON DELETE CASCADE,
  assigned_at timestamp DEFAULT now(),
  assigned_by uuid REFERENCES viralize_users(id),
  UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO viralize_roles (name, description) VALUES
  ('super_admin', 'Full platform access'),
  ('admin', 'Manage users, content, support'),
  ('finance', 'Revenue and billing access'),
  ('support', 'Support tickets and user viewing'),
  ('analyst', 'Analytics and reporting access');

-- Insert permissions for each role
INSERT INTO viralize_role_permissions (role_id, permission)
SELECT id, permission FROM (
  SELECT r.id, v.permission
  FROM viralize_roles r
  CROSS JOIN UNNEST(ARRAY[
    'users.read', 'users.write', 'users.delete',
    'content.read', 'content.write',
    'support.read', 'support.write',
    'analytics.read',
    'revenue.read',
    'billing.read', 'billing.write'
  ]) AS v(permission)
  WHERE r.name = 'super_admin'
) t;
```

**Function to Check Permission:**

```typescript
// Create Supabase function
CREATE OR REPLACE FUNCTION check_permission(required_permission text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_permission boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM viralize_user_roles ur
    JOIN viralize_role_permissions rp ON ur.role_id = rp.role_id
    WHERE ur.user_id = auth.uid()
      AND rp.permission = required_permission
  ) INTO has_permission;

  RETURN has_permission;
END;
$$;
```

---

## PHASE 3: HIGH SEVERITY FIXES (Days 7-14)

### Fix #13: Add CSRF Protection

**Install Dependencies:**
```bash
npm install csurf cookie-parser
```

**Implement Middleware (for API calls):**

```typescript
// In admin pages that modify data
const generateCSRFToken = (): string => {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
};

const csrfToken = useMemo(() => {
  const stored = sessionStorage.getItem('_csrf_token');
  if (stored) return stored;

  const token = generateCSRFToken();
  sessionStorage.setItem('_csrf_token', token);
  return token;
}, []);

// Send token with all state-changing requests
const handleAction = async (userId: string, action: string) => {
  const response = await fetch(`/api/admin/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ userId, action }),
  });
};
```

---

### Fix #14: Remove Console Errors & Add Sentry

**Install:**
```bash
npm install @sentry/react @sentry/tracing
```

**Initialize in main.tsx:**

```typescript
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}
```

**Remove Console Logs:**

```typescript
// Replace:
// console.error('Error:', err);
// With:
if (import.meta.env.DEV) {
  console.error('Error:', err);
}
Sentry.captureException(err);
```

---

### Fix #15: Add CORS Configuration

**Create Supabase Edge Function `/functions/cors-handler/index.ts`:**

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    if (!allowedOrigins.includes(origin || '')) {
      return new Response('Forbidden', { status: 403 });
    }

    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin || '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Handle actual request...
});
```

---

### Fix #16: Add Password Requirements

**Create Password Strength Component:**

```typescript
import { useState } from 'react';

export const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const strength = calculateStrength(password);

  const requirements = [
    { label: 'Min 8 characters', met: password.length >= 8 },
    { label: 'Has uppercase', met: /[A-Z]/.test(password) },
    { label: 'Has lowercase', met: /[a-z]/.test(password) },
    { label: 'Has number', met: /[0-9]/.test(password) },
    { label: 'Has special char', met: /[!@#$%^&*]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount <= 2 ? 'weak' : metCount <= 3 ? 'medium' : 'strong';

  return (
    <div className="space-y-2">
      <div className={`h-2 rounded-full ${
        strength === 'weak' ? 'bg-red-500' :
        strength === 'medium' ? 'bg-yellow-500' :
        'bg-green-500'
      }`} style={{ width: `${(metCount / 5) * 100}%` }} />

      <ul className="text-xs space-y-1">
        {requirements.map(req => (
          <li key={req.label} className={req.met ? 'text-green-500' : 'text-gray-400'}>
            {req.met ? '✓' : '○'} {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

---

### Fix #17: Add Session Timeout

**Create useSessionTimeout Hook:**

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before logout

export const useSessionTimeout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let absoluteTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);

      warningTimer = setTimeout(() => {
        toast.warning('Your session will expire in 2 minutes', {
          action: {
            label: 'Stay logged in',
            onClick: resetTimers,
          },
        });
      }, IDLE_TIMEOUT - WARNING_TIME);

      idleTimer = setTimeout(() => {
        toast.info('Session expired due to inactivity');
        signOut();
        navigate('/');
      }, IDLE_TIMEOUT);
    };

    // Absolute timeout (regardless of activity)
    absoluteTimer = setTimeout(() => {
      toast.info('Session expired for security');
      signOut();
      navigate('/');
    }, ABSOLUTE_TIMEOUT);

    // Reset on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimers);
    });

    resetTimers();

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      clearTimeout(absoluteTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimers);
      });
    };
  }, [signOut, navigate]);
};

// Use in App.tsx
export const App = () => {
  useSessionTimeout();
  // ... rest of app
};
```

---

### Fix #18: Run Dependency Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check outdated packages
npm outdated

# Update to latest versions (be careful)
npm update

# Check for supply chain attacks
npx snyk test

# Generate SBOM (Software Bill of Materials)
npx cyclonedx-npm --output-file sbom.json
```

---

### Fix #19: Add Error Boundaries

**Create `/src/components/ErrorBoundary.tsx`:**

```typescript
import React, { ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error);
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Sentry.withErrorBoundary(ErrorBoundary, {
  fallback: <h1>An error has occurred</h1>,
  showDialog: false,
});
```

**Use in App.tsx:**

```typescript
<ErrorBoundary>
  {/* All app content */}
</ErrorBoundary>
```

---

## Testing Checklist

```
✅ Phase 1 (24 hours):
[ ] No hardcoded keys in source
[ ] AdminGuard blocks non-admins
[ ] API keys rotated
[ ] .env working locally
[ ] git history cleaned of secrets

✅ Phase 2 (7 days):
[ ] RLS policies block unauthorized access
[ ] Audit logs show all admin actions
[ ] Input validation prevents bad data
[ ] Stripe webhooks have signatures
[ ] Rate limiting prevents abuse
[ ] RBAC functions work correctly

✅ Phase 3 (14 days):
[ ] CSRF tokens validated
[ ] No console errors in production
[ ] Sentry capturing errors
[ ] CORS configured correctly
[ ] Password requirements enforced
[ ] Session timeout working
[ ] npm audit clean
[ ] Error boundaries catch crashes
```

---

## Deployment Checklist

```
Before Production:
[ ] All fixes implemented and tested
[ ] Security audit passed
[ ] Performance load test passed
[ ] Backup system operational
[ ] Monitoring configured
[ ] Incident response plan ready
[ ] Team trained on security
[ ] Security.txt published
[ ] Privacy policy updated
```

---

## Success Criteria

✅ **System is production-ready when:**
1. Zero CRITICAL vulnerabilities
2. AdminGuard enforced server-side
3. All data encrypted in transit & at rest
4. Audit logs complete and immutable
5. RLS policies active
6. Rate limiting active
7. Error tracking active
8. Zero exposed credentials in git
9. All dependencies up-to-date
10. Team certified on procedures

