-- Create role enum
CREATE TYPE public.account_role AS ENUM ('owner', 'admin', 'member');

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Account',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account_users join table
CREATE TABLE public.account_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  role account_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id)
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_users ENABLE ROW LEVEL SECURITY;

-- Security definer function to check account membership
CREATE OR REPLACE FUNCTION public.is_account_member(_user_id UUID, _account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_users
    WHERE user_id = _user_id
      AND account_id = _account_id
  )
$$;

-- Security definer function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_account_role(_user_id UUID, _account_id UUID, _role account_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_users
    WHERE user_id = _user_id
      AND account_id = _account_id
      AND role = _role
  )
$$;

-- Get user's accounts (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_account_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT account_id
  FROM public.account_users
  WHERE user_id = _user_id
$$;

-- RLS policies for accounts
CREATE POLICY "Users can view accounts they belong to"
ON public.accounts
FOR SELECT
USING (id IN (SELECT public.get_user_account_ids(auth.uid())));

CREATE POLICY "Account owners can update their accounts"
ON public.accounts
FOR UPDATE
USING (public.has_account_role(auth.uid(), id, 'owner'));

CREATE POLICY "Users can create accounts"
ON public.accounts
FOR INSERT
WITH CHECK (true);

-- RLS policies for account_users
CREATE POLICY "Users can view members of their accounts"
ON public.account_users
FOR SELECT
USING (public.is_account_member(auth.uid(), account_id));

CREATE POLICY "Account owners/admins can add members"
ON public.account_users
FOR INSERT
WITH CHECK (
  public.has_account_role(auth.uid(), account_id, 'owner') OR 
  public.has_account_role(auth.uid(), account_id, 'admin') OR
  user_id = auth.uid()
);

CREATE POLICY "Account owners can remove members"
ON public.account_users
FOR DELETE
USING (
  public.has_account_role(auth.uid(), account_id, 'owner') OR
  user_id = auth.uid()
);

CREATE POLICY "Account owners can update member roles"
ON public.account_users
FOR UPDATE
USING (public.has_account_role(auth.uid(), account_id, 'owner'));

-- Trigger to update updated_at on accounts
CREATE TRIGGER update_accounts_updated_at
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default account on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create a default account for the new user
  INSERT INTO public.accounts (name)
  VALUES ('My Trading Account')
  RETURNING id INTO new_account_id;
  
  -- Link user to account as owner
  INSERT INTO public.account_users (user_id, account_id, role)
  VALUES (NEW.id, new_account_id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create account on signup
CREATE TRIGGER on_auth_user_created_account
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_account();