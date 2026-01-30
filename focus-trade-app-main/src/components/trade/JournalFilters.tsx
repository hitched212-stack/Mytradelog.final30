import { useState } from 'react';
import { JournalFilters as Filters } from '@/types/trade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Filter, X, ChevronDown } from 'lucide-react';

interface JournalFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  availableSymbols: string[];
  availableStrategies: string[];
}

export function JournalFilters({
  filters,
  onFiltersChange,
  availableSymbols,
  availableStrategies,
}: JournalFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = 
    filters.dateFrom || 
    filters.dateTo || 
    filters.symbol || 
    filters.strategy || 
    (filters.outcome && filters.outcome !== 'all');

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '' || value === undefined || value === 'all') {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                !
              </span>
            )}
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-4 space-y-4 rounded-lg border border-border bg-card p-4">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">From Date</Label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Symbol & Strategy */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Symbol</Label>
            <Select
              value={filters.symbol || 'all'}
              onValueChange={(v) => updateFilter('symbol', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All symbols" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All symbols</SelectItem>
                {availableSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Strategy</Label>
            <Select
              value={filters.strategy || 'all'}
              onValueChange={(v) => updateFilter('strategy', v === 'all' ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All strategies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All strategies</SelectItem>
                {availableStrategies.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Outcome */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Outcome</Label>
          <div className="flex gap-2">
            {(['all', 'win', 'loss'] as const).map((outcome) => (
              <Button
                key={outcome}
                type="button"
                variant={
                  (filters.outcome || 'all') === outcome ? 'default' : 'outline'
                }
                size="sm"
                className="flex-1 capitalize"
                onClick={() => updateFilter('outcome', outcome)}
              >
                {outcome}
              </Button>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
