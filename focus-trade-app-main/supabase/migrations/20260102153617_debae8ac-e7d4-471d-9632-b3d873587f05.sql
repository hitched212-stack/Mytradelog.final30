-- Fix the accounts INSERT policy to properly allow authenticated users to create accounts
DROP POLICY IF EXISTS "Users can create accounts" ON public.accounts;

CREATE POLICY "Authenticated users can create accounts" 
ON public.accounts 
FOR INSERT 
TO authenticated
WITH CHECK (true);