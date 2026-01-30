-- Add explicit DELETE policy for accounts table (defense in depth)
CREATE POLICY "Account owners can delete their accounts"
ON public.accounts
FOR DELETE
USING (has_account_role(auth.uid(), id, 'owner'::account_role));