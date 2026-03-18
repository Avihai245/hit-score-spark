-- Migration: Create Notifications System and RBAC Roles
-- Manages admin notifications and role-based access control

-- ============================================================================
-- ADMIN NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Message content
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- product_update, maintenance, billing, announcement, warning

  -- Audience
  audience text NOT NULL DEFAULT 'all', -- all, free_users, paid_users, specific_users

  -- Status
  status text NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, delivered
  sent_at timestamp,

  -- Admin who created it
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  scheduled_for timestamp,

  -- Constraints
  CONSTRAINT notification_type_check CHECK (type IN (
    'product_update', 'maintenance', 'billing', 'announcement', 'warning'
  )),
  CONSTRAINT audience_check CHECK (audience IN (
    'all', 'free_users', 'paid_users', 'pro_users', 'studio_users', 'specific_users'
  )),
  CONSTRAINT status_check CHECK (status IN (
    'draft', 'scheduled', 'sent', 'delivered', 'failed'
  ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_notif_status ON viralize_admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notif_sent ON viralize_admin_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notif_created ON viralize_admin_notifications(created_at DESC);

-- ============================================================================
-- USER NOTIFICATION DELIVERY TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to notification and user
  notification_id uuid NOT NULL REFERENCES viralize_admin_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status
  delivered_at timestamp,
  read_at timestamp,

  -- Timestamps
  created_at timestamp DEFAULT now(),

  UNIQUE(notification_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_notif_user ON viralize_user_notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_user_notif_created ON viralize_user_notifications(created_at DESC);

-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Role info
  name text UNIQUE NOT NULL,
  description text,

  -- Immutable
  is_system boolean DEFAULT false, -- Can't delete system roles

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viralize_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Permission info
  name text UNIQUE NOT NULL, -- user.read, user.write, admin.all, etc
  description text,
  category text, -- users, content, analytics, billing, support, system

  -- Timestamps
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS viralize_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  role_id uuid NOT NULL REFERENCES viralize_roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES viralize_permissions(id) ON DELETE CASCADE,

  -- Timestamp
  created_at timestamp DEFAULT now(),

  -- Unique constraint
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS viralize_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES viralize_roles(id) ON DELETE CASCADE,

  -- Who assigned it
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  assigned_at timestamp DEFAULT now(),
  expires_at timestamp, -- Temporary role assignments

  UNIQUE(user_id, role_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON viralize_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON viralize_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_role ON viralize_role_permissions(role_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE viralize_admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ADMIN NOTIFICATIONS RLS POLICIES
-- ============================================================================

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON viralize_admin_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
  ON viralize_admin_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update notifications
CREATE POLICY "Admins can update notifications"
  ON viralize_admin_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- USER NOTIFICATIONS RLS POLICIES
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON viralize_user_notifications FOR SELECT
  USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert user notifications"
  ON viralize_user_notifications FOR INSERT
  WITH CHECK (true);

-- Users can mark as read
CREATE POLICY "Users can update own notifications"
  ON viralize_user_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- ROLES RLS POLICIES
-- ============================================================================

-- Admins can view all roles
CREATE POLICY "Admins can view roles"
  ON viralize_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can manage non-system roles
CREATE POLICY "Admins can manage roles"
  ON viralize_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    ) AND NOT is_system
  );

-- ============================================================================
-- INITIALIZE DEFAULT ROLES
-- ============================================================================

-- Insert default roles
INSERT INTO viralize_roles (name, description, is_system) VALUES
  ('Super Admin', 'Full platform access', true),
  ('Admin', 'Manage users, content, support', true),
  ('Finance', 'Revenue and billing access', true),
  ('Support', 'Support tickets and user viewing', true),
  ('Analyst', 'Analytics and reporting access', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO viralize_permissions (name, category, description) VALUES
  ('users.read', 'users', 'View user information'),
  ('users.write', 'users', 'Modify user accounts'),
  ('users.delete', 'users', 'Delete user accounts'),
  ('content.read', 'content', 'View content management'),
  ('content.write', 'content', 'Manage content'),
  ('analytics.read', 'analytics', 'View analytics'),
  ('support.read', 'support', 'View support tickets'),
  ('support.write', 'support', 'Manage support tickets'),
  ('billing.read', 'billing', 'View billing information'),
  ('billing.write', 'billing', 'Manage billing'),
  ('admin.all', 'system', 'Full admin access')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Super Admin (all permissions)
INSERT INTO viralize_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM viralize_roles r
CROSS JOIN viralize_permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Admin
INSERT INTO viralize_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM viralize_roles r, viralize_permissions p
WHERE r.name = 'Admin'
AND p.name IN (
  'users.read', 'users.write',
  'content.read', 'content.write',
  'support.read', 'support.write',
  'analytics.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Finance
INSERT INTO viralize_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM viralize_roles r, viralize_permissions p
WHERE r.name = 'Finance'
AND p.name IN ('billing.read', 'billing.write', 'analytics.read')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Support
INSERT INTO viralize_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM viralize_roles r, viralize_permissions p
WHERE r.name = 'Support'
AND p.name IN ('users.read', 'support.read', 'support.write')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Assign permissions to Analyst
INSERT INTO viralize_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM viralize_roles r, viralize_permissions p
WHERE r.name = 'Analyst'
AND p.name = 'analytics.read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM viralize_user_roles ur
    JOIN viralize_role_permissions rp ON ur.role_id = rp.role_id
    JOIN viralize_permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
    AND p.name = p_permission
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$;

-- Get user roles
CREATE OR REPLACE FUNCTION get_user_roles()
RETURNS TABLE(role_id uuid, role_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role_id, r.name
  FROM viralize_user_roles ur
  JOIN viralize_roles r ON ur.role_id = r.id
  WHERE ur.user_id = auth.uid()
  AND (ur.expires_at IS NULL OR ur.expires_at > now());
END;
$$;

-- Send notification to audience
CREATE OR REPLACE FUNCTION send_notification(
  p_notification_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification record;
  v_audience_users uuid[];
BEGIN
  -- Get notification
  SELECT * INTO v_notification
  FROM viralize_admin_notifications
  WHERE id = p_notification_id;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Notification not found');
  END IF;

  -- Determine audience
  IF v_notification.audience = 'all' THEN
    SELECT array_agg(id) INTO v_audience_users
    FROM viralize_users;
  ELSIF v_notification.audience = 'free_users' THEN
    SELECT array_agg(id) INTO v_audience_users
    FROM viralize_users WHERE plan = 'free';
  ELSIF v_notification.audience = 'paid_users' THEN
    SELECT array_agg(id) INTO v_audience_users
    FROM viralize_users WHERE plan != 'free';
  END IF;

  -- Insert notifications for each user
  INSERT INTO viralize_user_notifications (notification_id, user_id)
  SELECT p_notification_id, unnest(v_audience_users);

  -- Update notification status
  UPDATE viralize_admin_notifications
  SET status = 'sent', sent_at = now()
  WHERE id = p_notification_id;

  RETURN json_build_object('success', true, 'count', array_length(v_audience_users, 1));
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE viralize_admin_notifications IS
'Notifications sent by admins to users. Status: draft, scheduled, sent, delivered';

COMMENT ON TABLE viralize_user_notifications IS
'Tracks which users received which notifications and if they read them';

COMMENT ON TABLE viralize_roles IS
'Role definitions for role-based access control (RBAC)';

COMMENT ON TABLE viralize_permissions IS
'Permission definitions. Users get permissions through roles.';

COMMENT ON TABLE viralize_user_roles IS
'Links users to roles. Can be temporary (expires_at) or permanent.';

COMMENT ON FUNCTION has_permission IS
'Check if current user has a specific permission';

COMMENT ON FUNCTION get_user_roles IS
'Get all roles assigned to current user';

COMMENT ON FUNCTION send_notification IS
'Send a notification to specified audience';
