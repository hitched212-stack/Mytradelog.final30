import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

function parseImpact(impactClass: string): 'high' | 'medium' | 'low' {
  if (impactClass.includes('high') || impactClass.includes('red')) return 'high';
  if (impactClass.includes('medium') || impactClass.includes('ora') || impactClass.includes('yel')) return 'medium';
  return 'low';
}

function parseImpactText(impactText: string): 'high' | 'medium' | 'low' {
  const normalized = impactText.toLowerCase();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium') || normalized.includes('med')) return 'medium';
  return 'low';
}

// Convert 12-hour time format to 24-hour format
function convertTo24Hour(time12: string): string {
  if (!time12 || time12 === 'All Day' || time12 === 'Tentative' || time12 === 'Day 1' || time12 === 'Day 2') {
    return time12;
  }
  
  // Remove any extra whitespace
  time12 = time12.trim();
  
  // Check if it's already in 24-hour format (e.g., "14:30")
  if (/^\d{1,2}:\d{2}$/.test(time12) && !time12.toLowerCase().includes('am') && !time12.toLowerCase().includes('pm')) {
    return time12;
  }
  
  // Match patterns like "8:30am", "10:00pm", "2:15 PM"
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!match) {
    return time12; // Return original if pattern doesn't match
  }
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toLowerCase();
  
  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function toISODateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseFeedDate(dateText: string, fallbackYear: number): Date | null {
  const trimmed = dateText.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [part1, part2, part3] = trimmed.split('-').map(Number);
    if (Number.isNaN(part1) || Number.isNaN(part2) || Number.isNaN(part3)) return null;
    const monthFirst = part1 <= 12;
    const month = monthFirst ? part1 : part2;
    const day = monthFirst ? part2 : part1;
    const parsed = new Date(Date.UTC(part3, month - 1, day));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed;

  const withYear = new Date(`${trimmed} ${fallbackYear}`);
  return isNaN(withYear.getTime()) ? null : withYear;
}

async function fetchForexFactoryCalendarFeed(referenceDate: Date): Promise<Map<string, EconomicEvent[]>> {
  const eventsByDate = new Map<string, EconomicEvent[]>();

  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml,text/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Forex Factory feed HTTP error: ${response.status}`);
      return eventsByDate;
    }

    const xml = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');

    if (!doc) {
      console.error('Failed to parse Forex Factory XML feed');
      return eventsByDate;
    }

    const items = doc.querySelectorAll('event');
    let eventIndex = 0;

    for (const item of items) {
      const event = item as Element;
      const title = event.querySelector('title')?.textContent?.trim() || '';
      const currency = (event.querySelector('currency')?.textContent || event.querySelector('country')?.textContent || '').trim();
      const dateText = event.querySelector('date')?.textContent?.trim() || '';
      const timeText = event.querySelector('time')?.textContent?.trim() || '';
      const impactText = event.querySelector('impact')?.textContent?.trim() || '';
      const forecast = event.querySelector('forecast')?.textContent?.trim() || '';
      const previous = event.querySelector('previous')?.textContent?.trim() || '';
      const actual = event.querySelector('actual')?.textContent?.trim() || '';

      if (!title || !currency || !dateText) continue;

      const parsedDate = parseFeedDate(dateText, referenceDate.getFullYear());
      if (!parsedDate) continue;

      const dateKey = toISODateString(parsedDate);
      const details = getEventDetails(title);
      const eventTime = convertTo24Hour(timeText) || 'TBD';

      const normalizedEvent: EconomicEvent = {
        id: `${dateKey}-feed-${eventIndex++}`,
        title,
        country: currencyCountry[currency] || currency,
        currency,
        date: dateKey,
        time: eventTime,
        impact: parseImpactText(impactText),
        forecast: forecast || '-',
        previous: previous || '-',
        actual: actual && actual !== '' ? actual : null,
        description: details.description,
        whyItMatters: details.whyItMatters,
        higherThanExpected: details.higherThanExpected,
        asExpected: details.asExpected,
        lowerThanExpected: details.lowerThanExpected,
      };

      const existing = eventsByDate.get(dateKey) || [];
      existing.push(normalizedEvent);
      eventsByDate.set(dateKey, existing);
    }
  } catch (error) {
    console.error('Error fetching Forex Factory XML feed:', error);
  }

  return eventsByDate;
}

async function fetchForexFactoryCalendar(baseDate: Date): Promise<EconomicEvent[]> {
  const events: EconomicEvent[] = [];
  
  try {
    // Format date for Forex Factory URL
    const month = baseDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const day = baseDate.getDate();
    const year = baseDate.getFullYear();
    
    console.log(`Fetching Forex Factory calendar for ${month}${day}.${year}`);
    
    const url = `https://www.forexfactory.com/calendar?day=${month}${day}.${year}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      console.error(`HTTP error: ${response.status}`);
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (!doc) {
      console.error('Failed to parse HTML');
      throw new Error('Failed to parse HTML');
    }
    
    // Parse calendar rows
    const rows = doc.querySelectorAll('.calendar__row');
    let currentDate = baseDate.toISOString().split('T')[0];
    let currentTime = '';
    let eventIndex = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Element;
      
      // Check for date cell (spans multiple rows)
      const dateCell = row.querySelector('.calendar__date');
      if (dateCell) {
        const dateText = dateCell.textContent?.trim();
        if (dateText && dateText.length > 0) {
          // Parse the date from the cell - format is like "Mon Dec 30"
          const parts = dateText.split(/\s+/);
          if (parts.length >= 3) {
            const dayNum = parseInt(parts[2]);
            if (!isNaN(dayNum)) {
              const tempDate = new Date(baseDate);
              tempDate.setDate(dayNum);
              currentDate = tempDate.toISOString().split('T')[0];
            }
          } else if (parts.length >= 2) {
            const dayNum = parseInt(parts[1]);
            if (!isNaN(dayNum)) {
              const tempDate = new Date(baseDate);
              tempDate.setDate(dayNum);
              currentDate = tempDate.toISOString().split('T')[0];
            }
          }
        }
      }
      
      // Get time cell - time applies to subsequent rows until a new time is found
      const timeCell = row.querySelector('.calendar__time');
      if (timeCell) {
        const timeText = timeCell.textContent?.trim();
        if (timeText && timeText.length > 0) {
          // Convert to 24-hour format
          currentTime = convertTo24Hour(timeText);
        }
      }
      
      const currencyCell = row.querySelector('.calendar__currency');
      const impactCell = row.querySelector('.calendar__impact span');
      const eventCell = row.querySelector('.calendar__event');
      const actualCell = row.querySelector('.calendar__actual');
      const forecastCell = row.querySelector('.calendar__forecast');
      const previousCell = row.querySelector('.calendar__previous');
      
      if (eventCell && currencyCell) {
        const title = eventCell.textContent?.trim() || '';
        const currency = currencyCell.textContent?.trim() || '';
        const impactClass = impactCell?.className || '';
        const actual = actualCell?.textContent?.trim() || null;
        const forecast = forecastCell?.textContent?.trim() || '';
        const previous = previousCell?.textContent?.trim() || '';
        
        if (title && currency) {
          const details = getEventDetails(title);
          
          // Determine the time to use
          let eventTime = currentTime;
          if (!eventTime || eventTime === '') {
            // Check if this is an all-day event type
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('holiday') || lowerTitle.includes('bank') || 
                lowerTitle.includes('day ') || lowerTitle.includes('speaks') ||
                lowerTitle.includes('meeting') || lowerTitle.includes('summit')) {
              eventTime = 'All Day';
            } else {
              eventTime = 'TBD';
            }
          }
          
          events.push({
            id: `${currentDate}-${eventIndex++}`,
            title,
            country: currencyCountry[currency] || currency,
            currency,
            date: currentDate,
            time: eventTime,
            impact: parseImpact(impactClass),
            forecast: forecast || '-',
            previous: previous || '-',
            actual: actual && actual !== '' ? actual : null,
            description: details.description,
            whyItMatters: details.whyItMatters,
            higherThanExpected: details.higherThanExpected,
            asExpected: details.asExpected,
            lowerThanExpected: details.lowerThanExpected,
          });
        }
      }
    }
    
    console.log(`Parsed ${events.length} events from HTML`);
    
  } catch (error) {
    console.error('Error fetching Forex Factory:', error);
  }
  
  return events;
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
    
    const isWeekView = range === 'week';
    
    console.log('Fetching economic calendar for date:', baseDate.toISOString(), 'range:', range);
    
    let events: EconomicEvent[] = [];
    let feedEventsByDate: Map<string, EconomicEvent[]> | null = null;
    const getFeedEventsForDate = async (dateValue: Date): Promise<EconomicEvent[]> => {
      if (!feedEventsByDate) {
        feedEventsByDate = await fetchForexFactoryCalendarFeed(dateValue);
      }
      return feedEventsByDate.get(toISODateString(dateValue)) || [];
    };
    
    if (isWeekView) {
      // For week view, calculate current week (Mon-Sun) based on the passed date
      const refDate = new Date(baseDate);
      const dayOfWeek = refDate.getDay();
      // If Sunday (0), go back 6 days to get Monday. Otherwise go back (dayOfWeek - 1) days
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      
      console.log(`Week view: Reference date is ${refDate.toISOString().split('T')[0]}, Monday is ${monday.toISOString().split('T')[0]}`);
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + i);
        
        console.log(`Fetching day ${i}: ${dayDate.toISOString().split('T')[0]}`);
        
        // Fetch from Forex Factory - fallback to XML feed if HTML scraping fails
        const dayEvents = await fetchForexFactoryCalendar(dayDate);
        if (dayEvents.length > 0) {
          events.push(...dayEvents);
        } else {
          const feedEvents = await getFeedEventsForDate(dayDate);
          events.push(...feedEvents);
        }
      }
    } else {
      // For day view, fetch single day - always use real data
      events = await fetchForexFactoryCalendar(baseDate);
      if (events.length === 0) {
        events = await getFeedEventsForDate(baseDate);
      }
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
    
    // Return empty data on error - no fallback fake data
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: [],
        lastUpdated: new Date().toISOString(),
        error: 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
