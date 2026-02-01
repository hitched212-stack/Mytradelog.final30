-- Create a function to create account and link user atomically
CREATE OR REPLACE FUNCTION public.create_account_for_user(
  _name TEXT,
  _type account_type DEFAULT 'personal',
  _broker_name TEXT DEFAULT NULL,
  _currency TEXT DEFAULT 'USD',
  _starting_balance NUMERIC DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_id UUID;
  current_user_id UUID;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Create the account
  INSERT INTO public.accounts (name, type, broker_name, currency, starting_balance, status)
  VALUES (_name, _type, _broker_name, _currency, _starting_balance, 'active')
  RETURNING id INTO new_account_id;
  
  -- Link user as owner
  INSERT INTO public.account_users (user_id, account_id, role)
  VALUES (current_user_id, new_account_id, 'owner');
  
  RETURN new_account_id;
END;
$$;