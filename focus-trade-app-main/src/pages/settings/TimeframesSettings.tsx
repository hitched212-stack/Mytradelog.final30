import { useNavigate } from 'react-router-dom';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ALL_TIMEFRAMES } from '@/lib/timeframes';
import { Checkbox } from '@/components/ui/checkbox';

export default function TimeframesSettings() {
  const navigate = useNavigate();
  const {
    selectedTimeframes,
    isLoading,
    setSelectedTimeframes,
    toggleTimeframe
  } = useTradingPreferences();
  const { toast } = useToast();

  const handleToggleTimeframe = async (value: string) => {
    await toggleTimeframe(value);
    toast({
      title: selectedTimeframes.includes(value) ? 'Timeframe removed' : 'Timeframe added'
    });
  };

  const selectAllTimeframes = async () => {
    const all = ALL_TIMEFRAMES.map((tf) => tf.value);
    await setSelectedTimeframes(all);
    toast({ title: 'All timeframes selected' });
  };

  const clearAllTimeframes = async () => {
    await setSelectedTimeframes([]);
    toast({ title: 'All timeframes cleared' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const TimeframeGroup = ({
    label,
    filter
  }: {
    label: string;
    filter: string;
  }) => {
    const timeframes = ALL_TIMEFRAMES.filter((tf) => tf.value.endsWith(filter));
    if (timeframes.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => handleToggleTimeframe(tf.value)}
              className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                selectedTimeframes.includes(tf.value)
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
              }`}
            >
              <Checkbox
                checked={selectedTimeframes.includes(tf.value)}
                className="pointer-events-none"
              />
              <span className="text-sm">{tf.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        />
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Chart Timeframes</h1>
            <p className="text-sm text-muted-foreground">
              Select the timeframes you use for trading
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedTimeframes.length} timeframe
              {selectedTimeframes.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllTimeframes}
                className="h-7 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllTimeframes}
                className="h-7 text-xs text-muted-foreground"
              >
                Clear
              </Button>
            </div>
          </div>

          <TimeframeGroup label="Seconds" filter="s" />
          <TimeframeGroup label="Minutes" filter="m" />
          <TimeframeGroup label="Hours" filter="h" />
          <TimeframeGroup label="Days" filter="d" />
          <TimeframeGroup label="Weeks" filter="w" />
          <TimeframeGroup label="Months" filter="M" />
        </div>
      </div>
    </div>
  );
}