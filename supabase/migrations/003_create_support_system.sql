-- Migration: Create Support Tickets System
-- Tracks user support requests and admin responses

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ticket info
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,

  -- Status and priority
  status text NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  priority text NOT NULL DEFAULT 'medium', -- low, medium, high

  -- Assignment
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  resolved_at timestamp,

  -- Search and filter indexes
  CONSTRAINT status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  CONSTRAINT priority_check CHECK (priority IN ('low', 'medium', 'high'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON viralize_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON viralize_support_tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON viralize_support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON viralize_support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON viralize_support_tickets(created_at DESC);

-- ============================================================================
-- SUPPORT TICKET REPLIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS viralize_support_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to ticket
  ticket_id uuid NOT NULL REFERENCES viralize_support_tickets(id) ON DELETE CASCADE,

  -- Sender info
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin boolean DEFAULT false,

  -- Message
  message text NOT NULL,

  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON viralize_support_replies(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_replies_user ON viralize_support_replies(user_id);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE viralize_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE viralize_support_replies ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUPPORT TICKETS RLS POLICIES
-- ============================================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON viralize_support_tickets FOR SELECT
  USING (user_id = auth.uid());

-- Users can create tickets
CREATE POLICY "Users can create tickets"
  ON viralize_support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own tickets (except status)
CREATE POLICY "Users can update own tickets"
  ON viralize_support_tickets FOR UPDATE
  USING (user_id = auth.uid() AND status != 'resolved');

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
  ON viralize_support_tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update tickets
CREATE POLICY "Admins can update tickets"
  ON viralize_support_tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================================================
-- SUPPORT REPLIES RLS POLICIES
-- ============================================================================

-- Users can view replies to their tickets
CREATE POLICY "Users can view replies to own tickets"
  ON viralize_support_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Users can reply to their own tickets
CREATE POLICY "Users can reply to own tickets"
  ON viralize_support_replies FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM viralize_support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- Admins can view all replies
CREATE POLICY "Admins can view all replies"
  ON viralize_support_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can reply to any ticket
CREATE POLICY "Admins can reply to tickets"
  ON viralize_support_replies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM viralize_users
      WHERE id = auth.uid() AND is_admin = true
    ) AND is_admin = true
  );

-- ============================================================================
-- HELPER FUNCTION: Create Support Ticket
-- ============================================================================

CREATE OR REPLACE FUNCTION create_support_ticket(
  p_subject text,
  p_description text
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_ticket_id uuid;
BEGIN
  INSERT INTO viralize_support_tickets (
    user_id,
    subject,
    description
  ) VALUES (
    auth.uid(),
    p_subject,
    p_description
  ) RETURNING id INTO v_ticket_id;

  RETURN json_build_object(
    'success', true,
    'ticket_id', v_ticket_id,
    'message', 'Support ticket created'
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Reply to Support Ticket
-- ============================================================================

CREATE OR REPLACE FUNCTION reply_to_ticket(
  p_ticket_id uuid,
  p_message text
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  v_is_admin boolean;
  v_reply_id uuid;
BEGIN
  -- Check if user is owner or admin
  SELECT is_admin INTO v_is_admin FROM viralize_users WHERE id = auth.uid();

  IF NOT v_is_admin THEN
    -- User must be ticket owner
    IF NOT EXISTS (
      SELECT 1 FROM viralize_support_tickets
      WHERE id = p_ticket_id AND user_id = auth.uid()
    ) THEN
      RETURN json_build_object('error', 'Unauthorized');
    END IF;
  END IF;

  INSERT INTO viralize_support_replies (
    ticket_id,
    user_id,
    message,
    is_admin
  ) VALUES (
    p_ticket_id,
    auth.uid(),
    p_message,
    COALESCE(v_is_admin, false)
  ) RETURNING id INTO v_reply_id;

  -- Update ticket updated_at
  UPDATE viralize_support_tickets
  SET updated_at = now()
  WHERE id = p_ticket_id;

  RETURN json_build_object(
    'success', true,
    'reply_id', v_reply_id
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTION: Close Support Ticket (Admin Only)
-- ============================================================================

CREATE OR REPLACE FUNCTION close_support_ticket(
  p_ticket_id uuid,
  p_status text DEFAULT 'resolved'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify admin
  IF NOT EXISTS (
    SELECT 1 FROM viralize_users
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RETURN json_build_object('error', 'Unauthorized');
  END IF;

  -- Validate status
  IF p_status NOT IN ('resolved', 'closed') THEN
    RETURN json_build_object('error', 'Invalid status');
  END IF;

  UPDATE viralize_support_tickets
  SET status = p_status, resolved_at = now(), updated_at = now()
  WHERE id = p_ticket_id;

  RETURN json_build_object('success', true, 'message', 'Ticket ' || p_status);
END;
$$;

-- ============================================================================
-- COMMENTS FOR USAGE
-- ============================================================================

COMMENT ON TABLE viralize_support_tickets IS
'Support tickets from users. Status: open, in_progress, resolved, closed';

COMMENT ON TABLE viralize_support_replies IS
'Replies to support tickets from users and admins';

COMMENT ON FUNCTION create_support_ticket IS
'Create a new support ticket for the current user';

COMMENT ON FUNCTION reply_to_ticket IS
'Reply to a support ticket (user owner or admin only)';

COMMENT ON FUNCTION close_support_ticket IS
'Close a support ticket (admin only)';
