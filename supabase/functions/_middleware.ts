import { FunctionToServe } from 'https://deno.land/x/serve@3.13.0/mod.ts';

export const onRequest: FunctionToServe = async (req, _ctx) => {
  // Allow stripe-webhook to be accessed without authentication
  if (req.url.includes('/stripe-webhook')) {
    return;
  }

  // For other functions, require authorization (optional - adjust as needed)
  return;
};
