import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!sig) {
    return new Response('No signature', { status: 400 });
  }

  // Custom Stripe webhook signature verification for Deno
  let event;
  try {
    // Stripe signature header format: t=timestamp,v1=signature1,v1=signature2,...
    const parts = sig.split(',');
    let timestamp = null;
    const v1Signatures: string[] = [];
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') v1Signatures.push(value);
    }
    
    if (!timestamp || v1Signatures.length === 0) {
      throw new Error('Invalid Stripe signature header format');
    }
    
    const signedPayload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(STRIPE_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    
    const signatureHex = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (!v1Signatures.some((s) => s === signatureHex)) {
      throw new Error('Invalid Stripe signature');
    }
    
    event = JSON.parse(body);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      
      if (!userId) {
        console.error('No user_id in session metadata');
        return new Response('No user_id', { status: 400 });
      }

      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          status: 'active',
          plan_type: session.metadata?.plan_type || 'monthly',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error updating subscription:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const status = subscription.status === 'active' ? 'active' : 'canceled';

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (error) {
        console.error('Error updating subscription:', error);
        return new Response('Database error', { status: 500 });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
