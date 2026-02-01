import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, AlertTriangle, Lightbulb, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
interface TradingInsightsProps {
  trades: Trade[];
}
interface ParsedInsights {
  strengths: string[];
  improvements: string[];
  psychology: string[];
  actions: string[];
}
function parseInsights(text: string): ParsedInsights {
  const sections: ParsedInsights = {
    strengths: [],
    improvements: [],
    psychology: [],
    actions: []
  };
  let currentSection: keyof ParsedInsights | null = null;
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().includes('strength')) {
      currentSection = 'strengths';
      continue;
    } else if (trimmed.toLowerCase().includes('improve') || trimmed.toLowerCase().includes('weakness')) {
      currentSection = 'improvements';
      continue;
    } else if (trimmed.toLowerCase().includes('psychology') || trimmed.toLowerCase().includes('emotional') || trimmed.toLowerCase().includes('mental')) {
      currentSection = 'psychology';
      continue;
    } else if (trimmed.toLowerCase().includes('action') || trimmed.toLowerCase().includes('step')) {
      currentSection = 'actions';
      continue;
    }
    if (currentSection && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
      const content = trimmed.replace(/^[•\-\*]\s*/, '').trim();
      if (content) {
        sections[currentSection].push(content);
      }
    }
  }
  return sections;
}
export function TradingInsights({
  trades
}: TradingInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Trades are now fetched server-side for security
      const {
        data,
        error: fnError
      } = await supabase.functions.invoke('analyze-trades');
      if (fnError) {
        throw new Error(fnError.message);
      }
      if (data?.error) {
        setError(data.error);
      } else {
        setInsights(data?.insights || 'No insights available.');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to analyze trades. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const parsed = insights ? parseInsights(insights) : null;
  
  return (
    <div className="space-y-4">
      {!insights && !isLoading && (
        <Button onClick={fetchInsights} className="w-full gap-2">
          <Sparkles className="h-4 w-4" />
          Get AI Insights
        </Button>
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      {parsed && (
        <div className="space-y-4">
          <Button onClick={fetchInsights} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          {parsed.strengths.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h4 className="font-medium text-emerald-500">Strengths</h4>
              </div>
              <ul className="space-y-1">
                {parsed.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {parsed.improvements.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h4 className="font-medium text-amber-500">Areas to Improve</h4>
              </div>
              <ul className="space-y-1">
                {parsed.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {parsed.psychology.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <h4 className="font-medium text-purple-500">Psychology</h4>
              </div>
              <ul className="space-y-1">
                {parsed.psychology.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {parsed.actions.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium text-blue-500">Action Steps</h4>
              </div>
              <ul className="space-y-1">
                {parsed.actions.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}