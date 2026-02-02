import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId, userId, planType, userEmail, promoCode } = await req.json();

    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const origin = (req.headers.get('origin') || '').replace(/\/$/, '');

    const successUrl = `${origin}/app/dashboard?fromStripe=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/app/paywall`;

    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      allow_promotion_codes: true,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_type: planType || 'monthly',
      },
    };

    // Add promo code if provided
    if (promoCode) {
      const promoResult = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });

      const matchedPromo = promoResult.data?.[0];
      if (matchedPromo) {
        sessionConfig.discounts = [{ promotion_code: matchedPromo.id }];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
