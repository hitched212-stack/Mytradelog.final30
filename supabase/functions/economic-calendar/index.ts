import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RapidAPI configuration from environment variables
const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
const RAPIDAPI_HOST = Deno.env.get('RAPIDAPI_HOST') || 'economic-calendar-api.p.rapidapi.com';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const MONTHLY_RAPIDAPI_LIMIT = 100;

// Input validation schema
const RequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid date format').optional().nullable(),
  range: z.enum(['day', 'week']).default('day')
});

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
  actual: string | null;
  description: string;
  whyItMatters: string;
  higherThanExpected: string;
  asExpected: string;
  lowerThanExpected: string;
}

// Currency to country mapping
const currencyCountry: Record<string, string> = {
  USD: 'United States',
  EUR: 'European Union',
  GBP: 'United Kingdom',
  JPY: 'Japan',
  AUD: 'Australia',
  CAD: 'Canada',
  CHF: 'Switzerland',
  NZD: 'New Zealand',
  CNY: 'China',
};

// Enhanced event descriptions with outcomes
interface EventDetail {
  description: string;
  whyItMatters: string;
  higherThanExpected: string;
  asExpected: string;
  lowerThanExpected: string;
}

const eventDetails: Record<string, EventDetail> = {
  'Non-Farm Payrolls': {
    description: 'Measures how many jobs were added or lost in the US economy last month (excluding farms, government, and a few other sectors). Think of it as a monthly health check for the job market.',
    whyItMatters: 'Jobs mean income, and income drives spending. Strong job growth signals a healthy economy, which can influence interest rates and currency values.',
    higherThanExpected: 'More jobs than expected often suggests a strong economy. This can strengthen USD and may lead to expectations of higher interest rates.',
    asExpected: 'Markets may stay relatively calm as the data aligns with expectations. No major surprises typically mean less volatility.',
    lowerThanExpected: 'Fewer jobs can signal economic slowdown. This often weakens USD and may lead to expectations of lower interest rates.',
  },
  'Interest Rate Decision': {
    description: 'The central bank\'s decision on borrowing costs. When rates go up, borrowing becomes more expensive; when they go down, borrowing becomes cheaper.',
    whyItMatters: 'Interest rates affect everything from mortgages to savings accounts. They\'re a key tool central banks use to control inflation and economic growth.',
    higherThanExpected: 'Rate hikes typically strengthen the currency as they attract foreign investment seeking higher returns.',
    asExpected: 'Markets often price in expected decisions in advance, so a match may cause little movement.',
    lowerThanExpected: 'Rate cuts can weaken the currency but may boost stocks as borrowing becomes cheaper for businesses.',
  },
  'GDP': {
    description: 'The total value of all goods and services produced in a country over a period. It\'s like measuring the size of the entire economy.',
    whyItMatters: 'GDP tells us if an economy is growing or shrinking. Strong growth usually means more jobs and prosperity.',
    higherThanExpected: 'Stronger growth signals a healthy economy, which typically strengthens the currency and boosts confidence.',
    asExpected: 'Growth in line with forecasts suggests stability. Markets may show limited reaction.',
    lowerThanExpected: 'Weaker growth can signal trouble ahead. This often leads to currency weakness and concerns about recession.',
  },
  'CPI': {
    description: 'Tracks price changes for everyday items like food, gas, and rent. It\'s the main way we measure inflation—how fast prices are rising.',
    whyItMatters: 'Rising prices affect your purchasing power. Central banks watch inflation closely to decide on interest rates.',
    higherThanExpected: 'Higher inflation often leads to rate hikes to cool prices, which can strengthen the currency.',
    asExpected: 'Inflation as expected suggests current policies are working. Markets may remain stable.',
    lowerThanExpected: 'Lower inflation may lead to rate cuts or stimulus measures, potentially weakening the currency.',
  },
  'Retail Sales': {
    description: 'Measures how much people are spending at stores and restaurants. It\'s a snapshot of consumer confidence and spending habits.',
    whyItMatters: 'Consumer spending makes up a huge part of the economy. Strong retail sales suggest people feel confident about their finances.',
    higherThanExpected: 'More spending indicates consumer confidence and economic health, often strengthening the currency.',
    asExpected: 'Spending in line with forecasts suggests a steady economy with no major surprises.',
    lowerThanExpected: 'Weak retail sales may signal consumer caution or financial stress, potentially weakening the currency.',
  },
  'Employment': {
    description: 'Reports on job creation, unemployment rates, or hiring trends. Different countries report this in various ways.',
    whyItMatters: 'Jobs are fundamental to economic health. When people have work, they spend money and the economy grows.',
    higherThanExpected: 'Strong employment figures signal economic health and can strengthen the currency.',
    asExpected: 'Employment meeting expectations suggests a stable labor market.',
    lowerThanExpected: 'Weak employment can raise concerns about economic slowdown and may weaken the currency.',
  },
  'PMI': {
    description: 'A survey asking business managers about current conditions—are things getting better or worse? A reading above 50 means growth; below 50 means contraction.',
    whyItMatters: 'PMI is a leading indicator—it often predicts where the economy is heading before other data confirms it.',
    higherThanExpected: 'PMI above expectations signals stronger growth ahead, typically bullish for the currency.',
    asExpected: 'PMI meeting forecasts confirms the current economic trajectory is on track.',
    lowerThanExpected: 'Weaker PMI may signal a slowdown, potentially causing currency weakness.',
  },
  'Unemployment Rate': {
    description: 'The percentage of people who want to work but can\'t find jobs. Lower is generally better for the economy.',
    whyItMatters: 'High unemployment means less spending and potential social challenges. Low unemployment suggests a strong job market.',
    higherThanExpected: 'Rising unemployment signals economic weakness and can lead to currency depreciation.',
    asExpected: 'Unemployment in line with forecasts suggests labor market stability.',
    lowerThanExpected: 'Lower unemployment is positive, signaling economic strength and potentially leading to currency appreciation.',
  },
  'Trade Balance': {
    description: 'The difference between what a country exports (sells abroad) and imports (buys from abroad). A surplus means more exports; a deficit means more imports.',
    whyItMatters: 'Trade balances affect currency demand. Countries with strong exports often see their currency strengthen.',
    higherThanExpected: 'A better trade balance (more exports) is typically positive for the currency.',
    asExpected: 'Trade balance meeting expectations suggests stable international trade dynamics.',
    lowerThanExpected: 'A worse trade balance may weaken the currency as it signals reduced demand for exports.',
  },
  'Consumer Confidence': {
    description: 'A survey asking regular people how they feel about the economy and their own finances. Higher numbers mean more optimism.',
    whyItMatters: 'Confident consumers spend more, driving economic growth. Low confidence can mean cautious spending.',
    higherThanExpected: 'Higher confidence suggests consumers will spend more, positive for the economy and currency.',
    asExpected: 'Confidence as expected indicates stable consumer sentiment.',
    lowerThanExpected: 'Lower confidence may signal reduced spending ahead, potentially weakening the currency.',
  },
  'FOMC': {
    description: 'The US Federal Reserve\'s policy meeting where they decide on interest rates and discuss the economy. Their statements are closely analyzed.',
    whyItMatters: 'The Fed\'s decisions affect global markets. Their tone (hawkish = tough on inflation, dovish = supportive of growth) matters as much as actual decisions.',
    higherThanExpected: 'A more hawkish stance than expected typically strengthens USD.',
    asExpected: 'No surprises usually mean limited market reaction.',
    lowerThanExpected: 'A more dovish stance may weaken USD but could boost risk assets like stocks.',
  },
  'Bank Holiday': {
    description: 'A public holiday when banks and many businesses are closed. Trading may be thinner than usual.',
    whyItMatters: 'Less trading activity can mean unusual price movements or very quiet markets.',
    higherThanExpected: 'Not applicable—this is a scheduled event, not data.',
    asExpected: 'Markets typically experience lower liquidity and may be more volatile or very quiet.',
    lowerThanExpected: 'Not applicable—this is a scheduled event, not data.',
  },
  'Crude Oil Inventories': {
    description: 'How much oil US companies have stored. Think of it as measuring the supply of oil available in the market.',
    whyItMatters: 'Oil prices affect everything from gas prices to inflation. Supply changes can move prices significantly.',
    higherThanExpected: 'More supply than expected can push oil prices lower, affecting oil-linked currencies like CAD.',
    asExpected: 'Inventory meeting forecasts suggests balanced supply and demand.',
    lowerThanExpected: 'Less supply than expected can push oil prices higher, potentially strengthening oil-linked currencies.',
  },
  'Housing': {
    description: 'Data about home sales, prices, or construction activity. It shows the health of the property market.',
    whyItMatters: 'Housing is a major part of the economy and household wealth. Strong housing data suggests consumer confidence.',
    higherThanExpected: 'Strong housing data signals economic health and consumer confidence.',
    asExpected: 'Housing data in line with expectations suggests a stable property market.',
    lowerThanExpected: 'Weak housing may signal reduced consumer confidence or economic concerns.',
  },
  'Natural Gas Storage': {
    description: 'How much natural gas is stored for future use. Important for energy markets and winter heating.',
    whyItMatters: 'Natural gas prices affect heating costs and energy companies. Supply changes can cause price swings.',
    higherThanExpected: 'More supply can push prices lower.',
    asExpected: 'Storage meeting forecasts suggests balanced supply.',
    lowerThanExpected: 'Less supply can push prices higher.',
  },
};

function getEventDetails(title: string): EventDetail {
  // Try exact match first
  if (eventDetails[title]) {
    return eventDetails[title];
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(eventDetails)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return {
    description: 'An economic report that provides insight into market conditions and the overall health of the economy.',
    whyItMatters: 'Economic data helps traders and investors understand where the economy is heading, which influences currency and market movements.',
    higherThanExpected: 'A better-than-expected result often signals economic strength, which can be positive for the currency.',
    asExpected: 'When data matches expectations, markets may show limited reaction as the result was already priced in.',
    lowerThanExpected: 'A weaker-than-expected result may signal economic challenges, potentially leading to currency weakness.',
  };
}

function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function incrementMonthlyUsage(monthKey: string): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase service role configuration missing');
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_rapidapi_usage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_month: monthKey }),
  });

  if (!response.ok) {
    console.error(`Failed to increment RapidAPI usage: ${response.status}`);
    return null;
  }

  const data = await response.json();
  if (typeof data === 'number') {
    return data;
  }
  return null;
}

// Fetch from RapidAPI Economic Calendar
async function fetchFromRapidAPI(baseDate: Date, range: 'day' | 'week'): Promise<EconomicEvent[] | null> {
  if (!RAPIDAPI_KEY) {
    console.log('RapidAPI key not configured');
    return null;
  }

  try {
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let endpoint = '';
    let queryParams = '';
    
    if (range === 'week') {
      // Calculate week start (Monday)
      const refDate = new Date(baseDate);
      const dayOfWeek = refDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + mondayOffset);
      
      // Calculate week end (Sunday)
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const startDate = formatDate(monday);
      const endDate = formatDate(sunday);
      
      endpoint = `/calendar/history/tomorrow`;
      queryParams = `?from=${startDate}&to=${endDate}`;
      
      console.log(`Fetching RapidAPI week data from ${startDate} to ${endDate}`);
    } else {
      const dateStr = formatDate(baseDate);
      
      // Check if it's today, tomorrow, or yesterday for optimized endpoints
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const todayStr = formatDate(today);
      const tomorrowStr = formatDate(tomorrow);
      const yesterdayStr = formatDate(yesterday);
      
      if (dateStr === todayStr) {
        endpoint = `/calendar/history/tomorrow`;
      } else if (dateStr === tomorrowStr) {
        endpoint = `/calendar/history/tomorrow`;
      } else if (dateStr === yesterdayStr) {
        endpoint = `/calendar/history/yesterday`;
      } else {
        endpoint = `/calendar/history/last-week`;
      }
      
      console.log(`Fetching RapidAPI data for ${dateStr} using endpoint ${endpoint}`);
    }

    const url = `https://${RAPIDAPI_HOST}${endpoint}${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      console.error(`RapidAPI HTTP error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Parse RapidAPI response format
    if (!data || !Array.isArray(data)) {
      console.error('Invalid RapidAPI response format');
      return null;
    }

    const events: EconomicEvent[] = [];
    let eventIndex = 0;

    for (const item of data) {
      // Map RapidAPI fields to our format
      const currency = item.currency || item.country_code || 'USD';
      const impact = item.importance === 'high' ? 'high' : 
                     item.importance === 'medium' ? 'medium' : 'low';
      
      // Parse date and time
      let eventDate = baseDate.toISOString().split('T')[0];
      let eventTime = 'TBD';
      
      if (item.date) {
        const dateObj = new Date(item.date);
        if (!isNaN(dateObj.getTime())) {
          eventDate = dateObj.toISOString().split('T')[0];
          eventTime = dateObj.toTimeString().split(' ')[0].substring(0, 5);
        }
      }
      
      const title = item.event || item.title || 'Economic Event';
      const details = getEventDetails(title);

      events.push({
        id: `rapidapi-${eventDate}-${eventIndex++}`,
        title,
        country: currencyCountry[currency] || item.country || currency,
        currency,
        date: eventDate,
        time: eventTime,
        impact: impact,
        forecast: item.forecast || item.consensus || '-',
        previous: item.previous || item.prior || '-',
        actual: item.actual || null,
        description: details.description,
        whyItMatters: details.whyItMatters,
        higherThanExpected: details.higherThanExpected,
        asExpected: details.asExpected,
        lowerThanExpected: details.lowerThanExpected,
      });
    }

    console.log(`RapidAPI returned ${events.length} events`);
    return events;

  } catch (error) {
    console.error('Error fetching from RapidAPI:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let body = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON, use defaults
    }

    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Input validation failed:", validationResult.error.errors);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid input parameters',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          data: []
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { date, range } = validationResult.data;
    
    // Safely parse the date
    let baseDate: Date;
    if (date) {
      baseDate = new Date(date);
      if (isNaN(baseDate.getTime())) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Invalid date value',
            data: []
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      baseDate = new Date();
    }
    
    console.log('Fetching economic calendar for date:', baseDate.toISOString(), 'range:', range);
    
    const monthKey = getMonthKey(baseDate);
    const usageCount = await incrementMonthlyUsage(monthKey);
    if (usageCount === null) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'RapidAPI usage tracking is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
          data: [],
          lastUpdated: new Date().toISOString()
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (usageCount > MONTHLY_RAPIDAPI_LIMIT) {
      console.log(`RapidAPI monthly limit exceeded: ${usageCount}/${MONTHLY_RAPIDAPI_LIMIT}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `RapidAPI monthly request limit exceeded (${MONTHLY_RAPIDAPI_LIMIT}).`,
          data: [],
          lastUpdated: new Date().toISOString()
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch from RapidAPI
    const events = await fetchFromRapidAPI(baseDate, range);
    
    if (!events || events.length === 0) {
      console.log('No data returned from RapidAPI');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Unable to fetch economic calendar data. Please check your API configuration.',
          data: [],
          lastUpdated: new Date().toISOString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Sort events by date then time
    events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      if (a.time === 'All Day' || a.time === 'TBD') return -1;
      if (b.time === 'All Day' || b.time === 'TBD') return 1;
      return a.time.localeCompare(b.time);
    });
    
    console.log(`Returning ${events.length} economic events`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: events,
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error fetching economic calendar:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        data: [],
        lastUpdated: new Date().toISOString(),
        error: 'An unexpected error occurred while fetching calendar data'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
