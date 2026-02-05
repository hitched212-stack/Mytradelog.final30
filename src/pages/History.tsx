import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrades } from '@/hooks/useTrades';
import { useSettings } from '@/hooks/useSettings';
import { useAccount } from '@/hooks/useAccount';
import { usePreferences } from '@/hooks/usePreferences';
import { getCurrencySymbol } from '@/types/trade';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  ArrowUpDown,
  Eye,
  SlidersHorizontal,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  CalendarIcon,
  Clock,
  Check,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { TradeViewDialogContent } from '@/components/trade/TradeViewDialog';
import { Trade, Currency } from '@/types/trade';
import { cn } from '@/lib/utils';
import { ImageZoomDialog } from '@/components/ui/ImageZoomDialog';
import { SymbolIcon } from '@/components/ui/SymbolIcon';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function History() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { trades, isLoading, deleteTrade, duplicateTrade } = useTrades();
  const { settings } = useSettings();
  const { activeAccount } = useAccount();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 10 : 25);
  
  // Update itemsPerPage when screen size changes
  useEffect(() => {
    setItemsPerPage(isMobile ? 10 : 25);
    setCurrentPage(1);
  }, [isMobile]);
  
  const [sortField, setSortField] = useState<'date' | 'symbol' | 'pnl'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [deleteTradeId, setDeleteTradeId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  const currency = (activeAccount?.currency || settings.currency) as Currency;
  const currencySymbol = getCurrencySymbol(currency);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let result = [...trades];

    // Date range filter
    if (dateRange.from) {
      result = result.filter(trade => {
        const tradeDate = new Date(trade.date);
        tradeDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(dateRange.from!);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = dateRange.to ? new Date(dateRange.to) : fromDate;
        toDate.setHours(23, 59, 59, 999);
        return tradeDate >= fromDate && tradeDate <= toDate;
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(trade => 
        trade.symbol.toLowerCase().includes(query) ||
        trade.direction.toLowerCase().includes(query) ||
        trade.strategy?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === 'pnl') {
        comparison = a.pnlAmount - b.pnlAmount;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [trades, searchQuery, sortField, sortDirection, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: 'date' | 'symbol' | 'pnl') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setViewDialogOpen(true);
  };

  const formatPnl = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return amount >= 0 ? `+${currencySymbol}${formatted}` : `-${currencySymbol}${formatted}`;
  };

  // Calculate exit time from entry time + holding time
  const calculateExitTime = (entryTime: string, holdingTime: string): string => {
    if (!entryTime || !holdingTime) return '—';
    
    // Parse entry time (e.g., "09:30", "14:15")
    const [entryHours, entryMinutes] = entryTime.split(':').map(Number);
    if (isNaN(entryHours) || isNaN(entryMinutes)) return '—';
    
    // Parse holding time (e.g., "1h 30m", "45m", "2h")
    let holdingMinutes = 0;
    const hoursMatch = holdingTime.match(/(\d+)\s*h/i);
    const minutesMatch = holdingTime.match(/(\d+)\s*m/i);
    
    if (hoursMatch) holdingMinutes += parseInt(hoursMatch[1]) * 60;
    if (minutesMatch) holdingMinutes += parseInt(minutesMatch[1]);
    
    if (holdingMinutes === 0) return '—';
    
    // Calculate exit time
    const totalMinutes = entryHours * 60 + entryMinutes + holdingMinutes;
    const exitHours = Math.floor(totalMinutes / 60) % 24;
    const exitMins = totalMinutes % 60;
    
    return `${exitHours.toString().padStart(2, '0')}:${exitMins.toString().padStart(2, '0')}`;
  };

  const handleImageClick = (images: string[], index: number) => {
    setZoomImages(images);
    setZoomIndex(index);
    setZoomOpen(true);
  };

  const handleDeleteTrade = async () => {
    if (deleteTradeId) {
      await deleteTrade(deleteTradeId);
      setDeleteTradeId(null);
      toast({ title: 'Trade deleted' });
    }
  };

  const handleDuplicateTrade = async (tradeId: string) => {
    await duplicateTrade(tradeId);
    toast({ title: 'Trade duplicated' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 pb-32 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTrades.length} total trades
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:w-72 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol, direction..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 gap-2",
                  dateRange.from ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                  ) : (
                    format(dateRange.from, 'MMM dd')
                  )
                ) : 'Date Range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined });
                  setCurrentPage(1);
                }}
                numberOfMonths={2}
                initialFocus
                className="p-3 pointer-events-auto"
              />
              {dateRange.from && (
                <div className="p-3 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-muted-foreground"
                    onClick={() => {
                      setDateRange({ from: undefined, to: undefined });
                      setCurrentPage(1);
                    }}
                  >
                    Clear date filter
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
          
          {/* Sort Filter */}
          <Select 
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as ['date' | 'pnl', 'asc' | 'desc'];
              setSortField(field);
              setSortDirection(direction);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] md:w-[160px]">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="pnl-desc">Best Trade</SelectItem>
              <SelectItem value="pnl-asc">Worst Trade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View - Clean Cards */}
      <div className="md:hidden space-y-3">
        {paginatedTrades.length === 0 ? (
          <div className="rounded-xl border border-border bg-card text-center py-12 text-muted-foreground">
            {searchQuery ? 'No trades match your search' : 'No trades recorded yet'}
          </div>
        ) : (
          <>
            {paginatedTrades.map((trade) => (
              <div
                key={trade.id}
                onClick={() => handleViewTrade(trade)}
                className={cn(
                  "rounded-xl border p-4 cursor-pointer active:bg-muted/30 transition-colors relative overflow-hidden",
                  isGlassEnabled
                    ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                    : "border-border/50 bg-card"
                )}
              >
                {/* Dot pattern - only show when glass is enabled */}
                {isGlassEnabled && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id={`history-card-${trade.id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#history-card-${trade.id})`} />
                  </svg>
                )}
                {/* Top Row: Symbol + Date | P&L */}
                <div className="flex items-start justify-between gap-3 relative">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <SymbolIcon symbol={trade.symbol} size="md" />
                    <div className="min-w-0">
                      <span className="text-base font-semibold text-foreground block truncate">{trade.symbol}</span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.date), 'MMM dd, yyyy')} · {trade.entryTime}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {(trade.isPaperTrade || trade.noTradeTaken) ? (
                      <span className="text-sm text-muted-foreground">—</span>
                    ) : (
                      <span className={cn(
                        "text-base font-display font-bold tabular-nums",
                        trade.pnlAmount >= 0 ? "text-pnl-positive" : "text-pnl-negative"
                      )}>
                        {formatPnl(trade.pnlAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Holding Time, News, Rules, Grade */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {trade.holdingTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{trade.holdingTime}</span>
                    </div>
                  )}
                  {trade.hasNews && (
                    <div className="flex items-center gap-1 text-pnl-positive">
                      <Check className="h-3 w-3" />
                      <span>News</span>
                    </div>
                  )}
                  {trade.brokenRules && trade.brokenRules.length > 0 ? (
                    <div className="flex items-center gap-1 text-pnl-negative">
                      <XCircle className="h-3 w-3" />
                      <span>{trade.brokenRules.length} broken</span>
                    </div>
                  ) : trade.followedRulesList && trade.followedRulesList.length > 0 ? (
                    <div className="flex items-center gap-1 text-pnl-positive">
                      <Check className="h-3 w-3" />
                      <span>Rules</span>
                    </div>
                  ) : null}
                  {trade.performanceGrade && (
                    <div className={cn(
                      "flex items-center gap-1",
                      trade.performanceGrade >= 3 ? "text-pnl-positive" :
                      trade.performanceGrade >= 2 ? "text-amber-500" : "text-pnl-negative"
                    )}>
                      <span>Grade: {trade.performanceGrade}/3</span>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Status + Side badges */}
                <div className="flex items-center gap-2 mt-2">
                  {/* Status Badge */}
                  {trade.isPaperTrade ? (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] font-medium bg-muted/50 text-muted-foreground px-2 py-0.5"
                    >
                      Paper
                    </Badge>
                  ) : trade.noTradeTaken ? (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] font-medium bg-muted/50 text-muted-foreground px-2 py-0.5"
                    >
                      No Trade
                    </Badge>
                  ) : trade.status === 'open' ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pnl-positive/10">
                      <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-pnl-positive" />
                      <span className="text-[10px] font-medium text-pnl-positive">Open</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">Closed</span>
                    </div>
                  )}

                  {/* Side Badge */}
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      trade.direction === 'long' 
                        ? "bg-pnl-positive/10 text-pnl-positive border-pnl-positive/30" 
                        : "bg-pnl-negative/10 text-pnl-negative border-pnl-negative/30"
                    )}
                  >
                    {trade.direction === 'long' ? 'Long' : 'Short'}
                  </Badge>

                  {/* Strategy if exists */}
                  {trade.strategy && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      {trade.strategy}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between px-1 py-3">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages || 1} · {filteredTrades.length} trades
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || totalPages <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop Table View - Professional Binance-style */}
      <div className={cn(
        "hidden md:block rounded-xl border overflow-hidden relative",
        isGlassEnabled
          ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
          : "border-border/50 bg-card"
      )}>
        {/* Dot pattern - only show when glass is enabled */}
        {isGlassEnabled && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="history-table-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#history-table-dots)" />
          </svg>
        )}
        <div className="overflow-x-auto relative">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 w-[70px]">Status</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors"
                    onClick={() => handleSort('symbol')}
                  >
                    Pair
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3">Side</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-center">
                  <div 
                    className="flex items-center justify-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    Date
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3">Entry • Exit</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-center">Duration</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-center">Strategy</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-center">Rules</TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-center">Grade</TableHead>
                <TableHead 
                  className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 text-right cursor-pointer hover:text-foreground/80 transition-colors"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end gap-2">
                    P&L
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                  </div>
                </TableHead>
                <TableHead className="h-12 font-semibold text-foreground text-xs uppercase tracking-wider px-4 py-3 w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-16 text-muted-foreground">
                    <div className="space-y-2">
                      <p className="text-sm">{searchQuery ? 'No trades match your search' : 'No trades recorded yet'}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrades.map((trade, idx) => (
                  <TableRow 
                    key={trade.id}
                    className={cn(
                      "border-b border-border/30 hover:bg-muted/40 transition-colors cursor-pointer h-14",
                      idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                    )}
                    onClick={() => handleViewTrade(trade)}
                  >
                    {/* Status */}
                    <TableCell className="px-4">
                      {trade.status === 'open' ? (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-pnl-positive/10 border border-pnl-positive/30">
                          <div className="w-1.5 h-1.5 rounded-full bg-pnl-positive animate-pulse" />
                          <span className="text-xs font-semibold text-pnl-positive">OPEN</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/50 border border-muted/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                          <span className="text-xs font-semibold text-muted-foreground">CLOSED</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Pair - Symbol with icon */}
                    <TableCell className="font-semibold text-foreground px-4">
                      <div className="flex items-center gap-2">
                        <SymbolIcon symbol={trade.symbol} size="sm" />
                        <span className="text-sm font-medium">{trade.symbol}</span>
                      </div>
                    </TableCell>
                    
                    {/* Side */}
                    <TableCell className="px-4">
                      <Badge 
                        className={cn(
                          "text-[11px] font-semibold px-2.5 py-1 rounded-md border-0",
                          trade.direction === 'long' 
                            ? "bg-pnl-positive/15 text-pnl-positive" 
                            : "bg-pnl-negative/15 text-pnl-negative"
                        )}
                      >
                        {trade.direction === 'long' ? 'LONG' : 'SHORT'}
                      </Badge>
                    </TableCell>
                    
                    {/* Date */}
                    <TableCell className="px-4 text-center text-sm text-muted-foreground">
                      {format(new Date(trade.date), 'MMM dd')}
                    </TableCell>
                    
                    {/* Entry • Exit Time */}
                    <TableCell className="px-4 text-sm">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground text-xs">{trade.entryTime || '—'}</div>
                        <div className="text-xs text-muted-foreground">{calculateExitTime(trade.entryTime, trade.holdingTime)}</div>
                      </div>
                    </TableCell>
                    
                    {/* Duration */}
                    <TableCell className="px-4 text-center">
                      <span className="text-sm text-muted-foreground font-medium">
                        {trade.holdingTime || '—'}
                      </span>
                    </TableCell>
                    
                    {/* Strategy */}
                    <TableCell className="px-4 text-center">
                      {trade.strategy ? (
                        <span className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded inline-block max-w-[120px] truncate">
                          {trade.strategy}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    {/* Rules Status */}
                    <TableCell className="px-4 text-center">
                      {trade.brokenRules && trade.brokenRules.length > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-pnl-negative/60"></div>
                          <span className="text-xs font-medium text-pnl-negative">{trade.brokenRules.length}</span>
                        </div>
                      ) : trade.followedRulesList && trade.followedRulesList.length > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-pnl-positive/60"></div>
                          <span className="text-xs font-medium text-pnl-positive">✓</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    {/* Performance Grade */}
                    <TableCell className="px-4 text-center">
                      {trade.performanceGrade ? (
                        <span className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-md",
                          trade.performanceGrade >= 3 ? "bg-pnl-positive/15 text-pnl-positive" :
                          trade.performanceGrade >= 2 ? "bg-amber-500/15 text-amber-500" : "bg-pnl-negative/15 text-pnl-negative"
                        )}>
                          {trade.performanceGrade}/3
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    
                    {/* P&L */}
                    <TableCell className="px-4 text-right">
                      {trade.isPaperTrade ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50 text-muted-foreground border-muted/50">
                          Paper
                        </Badge>
                      ) : trade.noTradeTaken ? (
                        <Badge variant="outline" className="text-[10px] font-semibold bg-muted/50 text-muted-foreground border-muted/50">
                          No Trade
                        </Badge>
                      ) : (
                        <span className={cn(
                          "font-display font-bold tabular-nums text-sm",
                          trade.pnlAmount >= 0 ? "text-pnl-positive" : "text-pnl-negative"
                        )}>
                          {formatPnl(trade.pnlAmount)}
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-muted/50 active:bg-muted/50 rounded-md"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleViewTrade(trade);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit/${trade.id}`);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTrade(trade.id);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTradeId(trade.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Desktop Pagination */}
        {filteredTrades.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(option => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || totalPages <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || totalPages <= 1}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent 
          className="max-w-4xl sm:max-h-[90vh] p-0 gap-0 sm:overflow-hidden"
          hideCloseButton
          fullScreenOnMobile
        >
          {selectedTrade && (
            <TradeViewDialogContent
              trade={selectedTrade}
              forecasts={{}}
              currencySymbol={currencySymbol}
              formatPnl={formatPnl}
              onClose={() => setViewDialogOpen(false)}
              onEdit={() => {
                setViewDialogOpen(false);
                navigate(`/edit/${selectedTrade.id}`);
              }}
              onViewForecast={() => {}}
              onImageClick={handleImageClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <ImageZoomDialog
        images={zoomImages}
        initialIndex={zoomIndex}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTradeId} onOpenChange={(open) => !open && setDeleteTradeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrade} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
