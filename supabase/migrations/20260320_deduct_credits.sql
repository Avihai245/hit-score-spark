-- deduct_credits: atomic credit deduction with balance check
-- Returns true if deduction succeeded, false if insufficient credits
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT credits INTO v_current
  FROM viralize_users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check balance
  IF v_current IS NULL OR v_current < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct
  UPDATE viralize_users
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer) TO service_role;
