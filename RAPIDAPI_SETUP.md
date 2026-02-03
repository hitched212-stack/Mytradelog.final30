# RapidAPI Setup Guide

This guide will help you set up RapidAPI for the economic calendar feature in your trading app.

## Step 1: Get Your RapidAPI Key

1. Go to [RapidAPI.com](https://rapidapi.com/)
2. Sign up or log in to your account
3. Navigate to your profile (top right) → "My Apps"
4. Find your default application or create a new one
5. Copy your API key (it will look like: `1234567890abcdef1234567890abcdef`)

## Step 2: Subscribe to an Economic Calendar API

Popular options on RapidAPI:
- **Real-Time Finance Data API** - Financial news and economic calendar
- **Economic Calendar API** - Provides economic events and forecasts
- **Forex Factory API** - Economic calendar data
- **Trading Economics API** - Global economic indicators

To subscribe:
1. Search for "economic calendar" on RapidAPI
2. Choose an API that fits your needs
3. Subscribe to a plan (many have free tiers)
4. Note the API host name (e.g., `economic-calendar.p.rapidapi.com`)

## Step 3: Update Your Environment Variables

1. Open the `.env` file in the project root
2. Replace `your-rapidapi-key-here` with your actual API key
3. Update `RAPIDAPI_HOST` if you're using a different API

```env
RAPIDAPI_KEY="1234567890abcdef1234567890abcdef"
RAPIDAPI_HOST="economic-calendar.p.rapidapi.com"
```

## Step 4: Configure Supabase Edge Function

Since the RapidAPI key will be used in a Supabase Edge Function, you need to set it as a secret:

### Using Supabase CLI:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref zmljovqdgtshyytgqlyl

# Set the secret
supabase secrets set RAPIDAPI_KEY=your-rapidapi-key-here
supabase secrets set RAPIDAPI_HOST=economic-calendar.p.rapidapi.com
```

### Using Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" → "Manage secrets"
3. Add the following secrets:
   - `RAPIDAPI_KEY`: your API key
   - `RAPIDAPI_HOST`: the API host name

## Step 5: Update the Economic Calendar Function

The economic calendar function (`supabase/functions/economic-calendar/index.ts`) needs to be updated to use RapidAPI instead of scraping. Example implementation is ready to be added when you have your API key.

## Step 6: Test the Integration

After setting up:

1. Deploy your edge function: `supabase functions deploy economic-calendar`
2. Test in your app's Economic News page
3. Check the console for any errors

## API Rate Limits

Be aware of your API plan's rate limits:
- Free tier: Usually 100-500 requests/month
- Basic tier: 1,000-10,000 requests/month
- Pro tier: Higher limits

Consider implementing caching to reduce API calls (already implemented in the app).

## Troubleshooting

**Error: 403 Forbidden**
- Check if your API key is correct
- Verify you're subscribed to the API
- Ensure the API host is correct

**Error: 429 Too Many Requests**
- You've hit your rate limit
- Wait for the limit to reset or upgrade your plan
- Implement better caching

**No data returned**
- Check the API documentation for correct endpoint usage
- Verify the date format matches what the API expects
- Check the Edge Function logs in Supabase

## Next Steps

Would you like me to:
1. Update the economic calendar function to use RapidAPI?
2. Add fallback to web scraping if RapidAPI fails?
3. Implement better error handling and retry logic?
