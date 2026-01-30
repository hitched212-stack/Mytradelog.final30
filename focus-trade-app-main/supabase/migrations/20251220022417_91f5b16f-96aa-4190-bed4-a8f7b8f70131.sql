-- Fix: Remove self-assignment vulnerability from account_users INSERT policy
-- This prevents users from adding themselves to any account without invitation

DROP POLICY IF EXISTS "Account owners/admins can add members" ON public.account_users;

CREATE POLICY "Account owners/admins can add members"
ON public.account_users
FOR INSERT
WITH CHECK (
  has_account_role(auth.uid(), account_id, 'owner'::account_role) OR 
  has_account_role(auth.uid(), account_id, 'admin'::account_role)
);