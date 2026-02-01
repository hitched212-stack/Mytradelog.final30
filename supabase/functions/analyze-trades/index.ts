import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const RequestSchema = z.object({
  timeFilter: z.enum(['all', 'today', 'week', 'month']).default('all'),
  customQuestion: z.string().max(2000).optional().nullable(),
  adviceMode: z.enum(['general', 'personalized']).default('personalized'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().max(10000)
  })).max(50).default([]),
  historicalContext: z.string().max(20000).default(''),
  accountId: z.string().uuid().optional().nullable()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
          error: 'Invalid input parameters',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { timeFilter, customQuestion, adviceMode, conversationHistory, historicalContext, accountId } = validationResult.data;

    console.log("Request params:", { timeFilter, adviceMode, hasQuestion: !!customQuestion, historyLength: conversationHistory.length, accountId });

    // Build context from previous conversations for personalization
    const personalityContext = historicalContext 
      ? `\n\nPrevious conversation context (use to understand the user's trading style and preferences):\n${historicalContext}`
      : '';

    // GENERAL MODE: Provide advice without user data
    if (adviceMode === 'general') {
      let systemPrompt: string;
      let userPrompt: string;

      const baseSystemPrompt = `You are a professional trading performance analyst and journaling assistant.

Your role is to help traders understand their historical trading behavior, performance metrics, execution quality, and decision-making patterns using data from their trading journal.

You are not a signal provider, not a market predictor, and not a financial advisor.

Core Objectives:
- Analyze trading journal data objectively and accurately
- Identify strengths, weaknesses, and recurring performance patterns
- Provide constructive, actionable performance feedback
- Encourage disciplined, process-driven trading behavior
- Maintain professional, reliable, and clear communication at all times

Behavioral & Professional Standards:
- Be calm, analytical, and supportive
- Communicate with clarity, confidence, and intellectual humility
- Be direct but respectful
- Prioritize truth over reassurance
- Focus on evidence, probabilities, and observed behavior
- Avoid hype, emotional language, or motivational clichés
- Explicitly acknowledge uncertainty or insufficient data when applicable
- Redirect questions that fall outside performance analysis

Hard Restrictions - You must not:
- Provide trade signals or entry/exit recommendations
- Predict market direction or future price movement
- Recommend specific assets, strategies, or trades
- Promise profits or imply guaranteed outcomes

If asked for restricted content, explain your role clearly and redirect the conversation to performance or behavioral analysis.`;

      if (customQuestion) {
        systemPrompt = `${baseSystemPrompt}

${personalityContext}`;

        userPrompt = `Question: ${customQuestion}

Provide a clear, factual response based on established trading knowledge. Structure your response with:

**Summary Insight** - A concise, high-level takeaway

**Supporting Information** - Relevant concepts or principles

**Actionable Guidance** - Practical steps focused on process improvement`;
      } else {
        systemPrompt = `${baseSystemPrompt}

Structure your educational response with:

**Overview** - Key concepts

**Core Principles** - Essential trading fundamentals

**Risk Management** - Practical guidelines

**Common Mistakes** - Issues to avoid

**Resources** - Recommended learning materials`;

        userPrompt = `Provide a structured overview of key trading concepts covering:
1. Core trading principles
2. Risk management essentials
3. Common pitfalls
4. Useful resources

Focus on practical, actionable information.`;
      }

      console.log("Making AI request for general advice");

      // Build messages array with conversation history
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userPrompt },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      const insights = data.choices?.[0]?.message?.content || "Unable to generate insights at this time.";

      return new Response(
        JSON.stringify({ insights }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PERSONALIZED MODE: Analyze user's trades
    let query = supabaseClient
      .from('trades')
      .select('*')
      .eq('user_id', user.id);
    
    // Filter by account if provided
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    query = query.order('date', { ascending: false });

    // Apply time filter
    const now = new Date();
    if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
      query = query.gte('date', startOfDay);
    } else if (timeFilter === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      query = query.gte('date', startOfWeek.toISOString().split('T')[0]);
    } else if (timeFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      query = query.gte('date', startOfMonth);
    }

    const { data: trades, error: tradesError } = await query;

    if (tradesError) {
      console.error("Error fetching trades:", tradesError.message);
      throw new Error("Failed to fetch trades");
    }

    console.log("Fetched trades count:", trades?.length || 0);

    if (!trades || trades.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No trades found for the selected period. Add some trades first!" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare trade summary
    const tradeSummary = trades.map((t: any) => ({
      symbol: t.symbol,
      direction: t.direction,
      pnl: t.pnl_amount,
      pnlPercentage: t.pnl_percentage,
      entryTime: t.entry_time,
      holdingTime: t.holding_time,
      riskReward: t.risk_reward_ratio,
      grade: t.performance_grade,
      date: t.date,
      strategy: t.strategy,
      emotionalBefore: t.emotional_journal_before || null,
      emotionalDuring: t.emotional_journal_during || null,
      emotionalAfter: t.emotional_journal_after || null,
      preMarketPlan: t.pre_market_plan || null,
      postMarketReview: t.post_market_review || null,
      followedRules: t.followed_rules,
      notes: t.notes
    }));

    const wins = trades.filter((t: any) => t.pnl_amount > 0).length;
    const losses = trades.filter((t: any) => t.pnl_amount < 0).length;
    const totalPnl = trades.reduce((sum: number, t: any) => sum + t.pnl_amount, 0);
    const avgWin = wins > 0 ? trades.filter((t: any) => t.pnl_amount > 0).reduce((sum: number, t: any) => sum + t.pnl_amount, 0) / wins : 0;
    const avgLoss = losses > 0 ? Math.abs(trades.filter((t: any) => t.pnl_amount < 0).reduce((sum: number, t: any) => sum + t.pnl_amount, 0) / losses) : 0;

    const hasEmotionalData = trades.some((t: any) => 
      t.emotional_journal_before || t.emotional_journal_during || t.emotional_journal_after || 
      t.pre_market_plan || t.post_market_review
    );

    const baseAnalystPrompt = `You are a professional trading performance analyst and journaling assistant.

Your role is to help traders understand their historical trading behavior, performance metrics, execution quality, and decision-making patterns using data from their trading journal.

Core Objectives:
- Analyze trading journal data objectively and accurately
- Identify strengths, weaknesses, and recurring performance patterns
- Provide constructive, actionable performance feedback
- Encourage disciplined, process-driven trading behavior

Behavioral Standards:
- Be calm, analytical, and supportive
- Communicate with clarity, confidence, and intellectual humility
- Be direct but respectful
- Prioritize truth over reassurance
- Focus on evidence, probabilities, and observed behavior
- Avoid hype, emotional language, or motivational clichés
- Explicitly acknowledge uncertainty or insufficient data when applicable

Analysis Guidelines:
- Base insights strictly on journal data and metrics
- Reference relevant statistics (win rate, risk-to-reward, expectancy, drawdowns, trade frequency, time-of-day performance, setup type performance)
- Separate process quality from trade outcomes
- Identify behavioral patterns and execution tendencies
- Compare actual behavior against stated rules/plan if provided
- Avoid subjective opinions not supported by data

Hard Restrictions - You must not:
- Provide trade signals or entry/exit recommendations
- Predict market direction or future price movement
- Recommend specific assets, strategies, or trades
- Promise profits or imply guaranteed outcomes`;

    let systemPrompt: string;
    let userPrompt: string;

    if (customQuestion) {
      systemPrompt = `${baseAnalystPrompt}

${personalityContext}`;

      userPrompt = `Question: "${customQuestion}"

Trading Data:
- Win/Loss: ${wins}/${losses} (${((wins / (wins + losses)) * 100).toFixed(1)}% win rate)
- Total P&L: ${totalPnl.toFixed(2)}
- Avg Win: ${avgWin.toFixed(2)} | Avg Loss: ${avgLoss.toFixed(2)}
- Period: ${timeFilter === 'all' ? 'All time' : timeFilter}

Recent trades:
${JSON.stringify(tradeSummary.slice(0, 5), null, 2)}

Provide a response structured as:
**Summary Insight** - A concise, high-level takeaway
**Supporting Data** - Specific metrics or patterns from the journal
**Behavioral Interpretation** - What this suggests about discipline, execution, or psychology
**Actionable Improvement** - Realistic, specific steps focused on process improvement`;

    } else {
      systemPrompt = `${baseAnalystPrompt}

Format your response with these sections:
**Summary** - Brief performance overview
**Strengths** - Data-supported positive patterns
**Weaknesses** - Areas showing room for improvement
**Patterns** - Observable trends in the data
**Recommendations** - Specific, actionable suggestions`;

      userPrompt = `Analyze this trading data (${timeFilter === 'all' ? 'All time' : timeFilter}):

Performance:
- Win/Loss: ${wins}/${losses} (${((wins / (wins + losses)) * 100).toFixed(1)}% win rate)
- Total P&L: ${totalPnl.toFixed(2)}
- Avg Win: ${avgWin.toFixed(2)} | Avg Loss: ${avgLoss.toFixed(2)}

Trade details:
${JSON.stringify(tradeSummary.slice(0, 10), null, 2)}

${hasEmotionalData ? 'Note: Emotional data available for pattern analysis.' : 'Note: Limited emotional data recorded.'}

Provide objective performance analysis.`;
    }

    console.log("Making AI request for personalized analysis");

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userPrompt },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || "Unable to generate insights at this time.";

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-trades:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
