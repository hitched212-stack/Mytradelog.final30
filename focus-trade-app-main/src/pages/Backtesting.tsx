import { useState, useRef, useEffect } from 'react';
import { Plus, Search, X, FolderPlus, Calendar } from 'lucide-react';
import { SymbolIcon } from '@/components/ui/SymbolIcon';
import { PageTransition } from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageZoomDialog } from '@/components/ui/ImageZoomDialog';
import { ExpandableGalleryCard } from '@/components/ui/ExpandableGalleryCard';
import { FolderAccordion } from '@/components/folders/FolderAccordion';
import { FolderDialog } from '@/components/folders/FolderDialog';
import { ImageUpload } from '@/components/trade/ImageUpload';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/hooks/usePreferences';
import { useBacktests, BacktestInsert, Backtest } from '@/hooks/useBacktests';
import { useFolders, Folder } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { getFilteredTimeframes, getTimeframeLabel } from '@/lib/timeframes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { NewsEventSelector } from '@/components/trade/NewsEventSelector';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCard } from '@/components/ui/SortableCard';

const SESSIONS = ['London', 'New York', 'Asian', 'Sydney', 'Overlap'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Backtesting() {
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const { user } = useAuth();
  const { folders, isLoading: foldersLoading, createFolder, updateFolder, deleteFolder, duplicateFolder, reorderFolders } = useFolders('backtest');
  const { backtests: allBacktests = [], isLoading: backtestsLoading } = useBacktests();

  // Track if initial load has completed (regardless of whether data exists)
  const [hasHydrated, setHasHydrated] = useState(() => {
    return sessionStorage.getItem('backtesting-hydrated') === 'true';
  });
  
  useEffect(() => {
    // Mark as hydrated once loading is complete (even if no data exists)
    if (!foldersLoading && !backtestsLoading) {
      setHasHydrated(true);
      sessionStorage.setItem('backtesting-hydrated', 'true');
    }
  }, [foldersLoading, backtestsLoading]);

  // Only show skeleton on very first load when we haven't hydrated before
  const showSkeleton = (foldersLoading || backtestsLoading) && !hasHydrated;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = folders.findIndex((f) => f.id === active.id);
      const newIndex = folders.findIndex((f) => f.id === over.id);
      
      const newOrder = arrayMove(folders, oldIndex, newIndex);
      reorderFolders.mutate(newOrder.map(f => f.id));
    }
  };
  
  // Persist expanded folders in localStorage
  const BACKTEST_EXPANDED_KEY = 'backtest-expanded-folders';
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(BACKTEST_EXPANDED_KEY);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState<Backtest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<Folder | null>(null);
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Folder dialogs
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const { createBacktest, updateBacktest, deleteBacktest, reorderBacktests } = useBacktests(activeFolderId);
  
  const { selectedTimeframes } = useTradingPreferences();
  const timeframeOptions = getFilteredTimeframes(selectedTimeframes);
  
  // Multi-chart state
  interface ChartAnalysis {
    id: string;
    timeframe: string;
    images: string[];
    notes: string;
  }
  
  const createEmptyChart = (): ChartAnalysis => ({
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  });
  
  const [charts, setCharts] = useState<ChartAnalysis[]>([createEmptyChart()]);
  
  const addChart = () => setCharts([...charts, createEmptyChart()]);
  const updateChart = (id: string, field: keyof ChartAnalysis, value: any) => {
    setCharts(charts.map(chart => chart.id === id ? { ...chart, [field]: value } : chart));
  };
  const removeChart = (id: string) => {
    if (charts.length > 1) setCharts(charts.filter(chart => chart.id !== id));
  };
  
  // Form state
  const [formData, setFormData] = useState<BacktestInsert>({
    name: '',
    folder_id: '',
    strategy: '',
    symbol: '',
    timeframe: '4h',
    win_rate: 0,
    profit_factor: 0,
    total_trades: 0,
    net_pnl: 0,
    notes: '',
    images: [],
    wins: 0,
    losses: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    day_of_week: '',
    session: '',
    entry_time: '',
    has_news: false,
    news_impact: '',
    news_events: [],
  });
  
  // Get backtests for a folder
  const getBacktestsForFolder = (folderId: string) => 
    allBacktests.filter(b => b.folder_id === folderId);

  const getBacktestCount = (folderId: string) => getBacktestsForFolder(folderId).length;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      // Persist to localStorage
      localStorage.setItem(BACKTEST_EXPANDED_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Calculate folder win rate from all backtests in folder
  const getFolderWinRate = (folderId: string) => {
    const backtests = getBacktestsForFolder(folderId);
    if (backtests.length === 0) return 0;
    const totalWins = backtests.reduce((sum, b) => sum + (b.wins || 0), 0);
    const totalLosses = backtests.reduce((sum, b) => sum + (b.losses || 0), 0);
    return calculateWinRate(totalWins, totalLosses);
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    folder.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getBacktestsForFolder(folder.id).some(b => 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.strategy?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Calculate win rate from wins/losses
  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return (wins / total) * 100;
  };

  const handleCreate = async () => {
    if (!activeFolderId) {
      toast.error('Please select a folder');
      return;
    }
    
    const nameToUse = formData.name.trim() || 'Untitled';
    
    const winRate = calculateWinRate(formData.wins || 0, formData.losses || 0);
    const totalTrades = (formData.wins || 0) + (formData.losses || 0);
    
    // Combine all chart images and notes
    const allImages = charts.flatMap(c => c.images);
    const allNotes = charts
      .filter(c => c.images.length > 0 || c.notes.trim())
      .map(c => `[${getTimeframeLabel(c.timeframe)}]\n${c.notes}`)
      .join('\n\n');
    
    await createBacktest.mutateAsync({
      ...formData,
      name: nameToUse,
      folder_id: activeFolderId,
      win_rate: winRate,
      total_trades: totalTrades,
      images: allImages,
      notes: allNotes,
    });
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedBacktest) {
      return;
    }
    
    const nameToUse = formData.name.trim() || 'Untitled';
    
    const winRate = calculateWinRate(formData.wins || 0, formData.losses || 0);
    const totalTrades = (formData.wins || 0) + (formData.losses || 0);
    
    // Combine all chart images and notes
    const allImages = charts.flatMap(c => c.images);
    const allNotes = charts
      .filter(c => c.images.length > 0 || c.notes.trim())
      .map(c => `[${getTimeframeLabel(c.timeframe)}]\n${c.notes}`)
      .join('\n\n');
    
    await updateBacktest.mutateAsync({
      id: selectedBacktest.id,
      ...formData,
      name: nameToUse,
      win_rate: winRate,
      total_trades: totalTrades,
      images: allImages,
      notes: allNotes,
    });
    setIsEditOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      folder_id: '',
      strategy: '',
      symbol: '',
      timeframe: '4h',
      win_rate: 0,
      profit_factor: 0,
      total_trades: 0,
      net_pnl: 0,
      notes: '',
      images: [],
      wins: 0,
      losses: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      day_of_week: '',
      session: '',
      entry_time: '',
      has_news: false,
      news_impact: '',
      news_events: [],
    });
    setCharts([createEmptyChart()]);
  };

  const handleDelete = async (id: string) => {
    await deleteBacktest.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  const openView = (backtest: Backtest) => {
    setSelectedBacktest(backtest);
    setIsViewOpen(true);
  };

  // Parse notes to extract chart sections
  const parseNotesToCharts = (notes: string, images: string[]) => {
    if (!notes && images.length === 0) return [createEmptyChart()];
    
    const regex = /\[([^\]]+)\]\n?([\s\S]*?)(?=\[|$)/g;
    const parsedCharts: ChartAnalysis[] = [];
    let match;
    let imageIndex = 0;
    
    while ((match = regex.exec(notes)) !== null) {
      const timeframeLabel = match[1];
      const chartNotes = match[2]?.trim() || '';
      const timeframe = timeframeOptions.find(tf => getTimeframeLabel(tf.value) === timeframeLabel)?.value || '4h';
      
      parsedCharts.push({
        id: crypto.randomUUID(),
        timeframe,
        images: images.slice(imageIndex, imageIndex + 1),
        notes: chartNotes
      });
      imageIndex++;
    }
    
    // If no timeframe markers found, create single chart with all data
    if (parsedCharts.length === 0) {
      return [{
        id: crypto.randomUUID(),
        timeframe: '4h',
        images: images,
        notes: notes
      }];
    }
    
    return parsedCharts;
  };

  const openEdit = (backtest: Backtest) => {
    setSelectedBacktest(backtest);
    setActiveFolderId(backtest.folder_id || null);
    setFormData({
      name: backtest.name,
      folder_id: backtest.folder_id || '',
      strategy: backtest.strategy || '',
      symbol: backtest.symbol || '',
      timeframe: backtest.timeframe || '4h',
      win_rate: backtest.win_rate || 0,
      profit_factor: backtest.profit_factor || 0,
      total_trades: backtest.total_trades || 0,
      net_pnl: backtest.net_pnl || 0,
      notes: backtest.notes || '',
      images: backtest.images || [],
      wins: backtest.wins || 0,
      losses: backtest.losses || 0,
      date: backtest.date || format(new Date(), 'yyyy-MM-dd'),
      day_of_week: backtest.day_of_week || '',
      session: backtest.session || '',
      entry_time: backtest.entry_time || '',
      has_news: backtest.has_news || false,
      news_impact: backtest.news_impact || '',
      news_events: backtest.news_events || [],
    });
    // Parse existing notes/images into charts
    setCharts(parseNotesToCharts(backtest.notes || '', backtest.images || []));
    setIsEditOpen(true);
  };

  const openCreateInFolder = (folderId: string) => {
    setActiveFolderId(folderId);
    resetForm();
    setIsCreateOpen(true);
  };

  const handleFolderSave = async (name: string, description: string, color: string) => {
    if (editingFolder) {
      await updateFolder.mutateAsync({ id: editingFolder.id, name, description, color });
    } else {
      await createFolder.mutateAsync({ name, description, color, type: 'backtest' });
    }
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
  };

  const handleFolderDelete = async () => {
    if (deleteFolderConfirm) {
      await deleteFolder.mutateAsync(deleteFolderConfirm.id);
      setDeleteFolderConfirm(null);
    }
  };

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-5 py-4">
      {/* Basic Info */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Name</Label>
          <Input
            placeholder="E.g., EURUSD Breakout Strategy"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="h-10 rounded-xl bg-muted/30 border-border/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Strategy</Label>
            <Input
              placeholder="E.g., Breakout"
              value={formData.strategy || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy: e.target.value }))}
              className="h-10 rounded-xl bg-muted/30 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Symbol</Label>
            <Input
              placeholder="E.g., EURUSD"
              value={formData.symbol || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              className="h-10 rounded-xl bg-muted/30 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Win/Loss Counter */}
      <div className="space-y-3">
        <Label className="text-xs font-medium text-muted-foreground">Results</Label>
        <div className="flex items-center justify-center gap-6">
          {/* Wins */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, wins: Math.max(0, (prev.wins || 0) - 1) }))}
                className="w-8 h-8 rounded-full border border-pnl-positive/30 bg-pnl-positive/10 flex items-center justify-center text-pnl-positive hover:bg-pnl-positive/20 transition-colors"
              >
                <span className="text-base leading-none">−</span>
              </button>
              <span className="w-10 text-center text-xl font-semibold font-outfit text-pnl-positive">{formData.wins || 0}</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, wins: (prev.wins || 0) + 1 }))}
                className="w-8 h-8 rounded-full border border-pnl-positive/30 bg-pnl-positive/10 flex items-center justify-center text-pnl-positive hover:bg-pnl-positive/20 transition-colors"
              >
                <span className="text-base leading-none">+</span>
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase">Wins</span>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-border" />

          {/* Losses */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, losses: Math.max(0, (prev.losses || 0) - 1) }))}
                className="w-8 h-8 rounded-full border border-pnl-negative/30 bg-pnl-negative/10 flex items-center justify-center text-pnl-negative hover:bg-pnl-negative/20 transition-colors"
              >
                <span className="text-base leading-none">−</span>
              </button>
              <span className="w-10 text-center text-xl font-semibold font-outfit text-pnl-negative">{formData.losses || 0}</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, losses: (prev.losses || 0) + 1 }))}
                className="w-8 h-8 rounded-full border border-pnl-negative/30 bg-pnl-negative/10 flex items-center justify-center text-pnl-negative hover:bg-pnl-negative/20 transition-colors"
              >
                <span className="text-base leading-none">+</span>
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase">Losses</span>
          </div>
        </div>
        
        {/* Win Rate Display */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="text-center">
            <p className="text-lg font-bold font-outfit text-foreground">
              {calculateWinRate(formData.wins || 0, formData.losses || 0).toFixed(0)}%
            </p>
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-outfit text-foreground">
              {(formData.wins || 0) + (formData.losses || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Profit Factor</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="0.00"
            value={formData.profit_factor || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, profit_factor: parseFloat(e.target.value) || 0 }))}
            className="h-10 rounded-xl bg-muted/30 border-border/50 font-outfit"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Net P&L</Label>
          <Input
            type="number"
            placeholder="0.00"
            value={formData.net_pnl || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, net_pnl: parseFloat(e.target.value) || 0 }))}
            className="h-10 rounded-xl bg-muted/30 border-border/50 font-outfit"
          />
        </div>
      </div>

      {/* Date, Day, Session & Timing */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date</Label>
            <div className="flex rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
              <div className="flex items-center justify-center px-3 bg-muted/50">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="w-px bg-border/50" />
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="flex-1 h-10 bg-transparent text-sm px-3 text-foreground focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 dark:[&::-webkit-calendar-picker-indicator]:invert"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Day of Week</Label>
            <Select
              value={formData.day_of_week || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, day_of_week: value }))}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/50">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Session</Label>
            <Select
              value={formData.session || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, session: value }))}
            >
              <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/50">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS.map((session) => (
                  <SelectItem key={session} value={session}>{session}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Entry Time</Label>
            <Input
              type="time"
              value={formData.entry_time || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, entry_time: e.target.value }))}
              className="h-10 rounded-xl bg-muted/30 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* News Section */}
      <NewsEventSelector
        date={formData.date || null}
        hasNews={formData.has_news || false}
        selectedEvents={formData.news_events || []}
        newsImpact={formData.news_impact || ''}
        onHasNewsChange={(hasNews) => setFormData(p => ({ ...p, has_news: hasNews }))}
        onNewsSelect={(title, impact) => setFormData(p => ({ ...p, news_impact: impact }))}
        onMultiNewsSelect={(events) => setFormData(p => ({ 
          ...p, 
          news_events: events,
          news_impact: events.length > 0 ? events[0].impact : ''
        }))}
      />

      {/* Multi-Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">Chart Analysis</Label>
          <Button type="button" variant="outline" size="sm" onClick={addChart} className="h-7 text-xs">
            <Plus className="mr-1 h-3 w-3" />
            Add Chart
          </Button>
        </div>
        
        {charts.map((chart) => (
          <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2">
              <Select 
                value={chart.timeframe} 
                onValueChange={(value) => updateChart(chart.id, 'timeframe', value)}
              >
                <SelectTrigger className="w-28 h-7 bg-muted/50 border-border text-xs">
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {timeframeOptions.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {charts.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive" 
                  onClick={() => removeChart(chart.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <ImageUpload 
              images={chart.images} 
              onChange={(images) => updateChart(chart.id, 'images', images)} 
              maxImages={5} 
              timeframeLabel={getTimeframeLabel(chart.timeframe)} 
            />
            <Textarea 
              placeholder="Your analysis notes for this timeframe..." 
              value={chart.notes} 
              onChange={(e) => updateChart(chart.id, 'notes', e.target.value)} 
              className="min-h-[60px] bg-muted/50 border-border resize-none text-sm" 
            />
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <PageTransition>
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 relative">
        <div className="flex items-center justify-between px-4 py-4 md:px-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Backtesting</h1>
            <p className="text-sm text-muted-foreground">Test and analyze your strategies</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => {
              setEditingFolder(null);
              setIsFolderDialogOpen(true);
            }}
          >
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 space-y-4 relative z-10">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search folders and backtests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-muted/50 border-border/50"
          />
        </div>

        {/* Content */}
        {showSkeleton ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filteredFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FolderPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No folders yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first folder to organize your backtests</p>
            <Button onClick={() => setIsFolderDialogOpen(true)} className="rounded-xl gap-2">
              <FolderPlus className="h-4 w-4" />
              Create Folder
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredFolders.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {filteredFolders.map((folder) => {
                  const folderBacktests = getBacktestsForFolder(folder.id);
                  return (
                    <FolderAccordion
                      key={folder.id}
                      folder={folder}
                      itemCount={folderBacktests.length}
                      isExpanded={expandedFolders.has(folder.id)}
                      onToggle={() => toggleFolder(folder.id)}
                      winRate={getFolderWinRate(folder.id)}
                      showWinRate={true}
                      onEdit={() => {
                        setEditingFolder(folder);
                        setIsFolderDialogOpen(true);
                      }}
                      onDuplicate={() => duplicateFolder.mutate(folder)}
                      onDelete={() => setDeleteFolderConfirm(folder)}
                    >
                      {folderBacktests.length === 0 ? (
                        <div className="flex items-center justify-between py-4 px-2 text-sm text-muted-foreground">
                          <span>No backtests yet</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-xs gap-1.5"
                            onClick={() => openCreateInFolder(folder.id)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Backtest
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => {
                              const { active, over } = event;
                              if (over && active.id !== over.id) {
                                const oldIndex = folderBacktests.findIndex((b) => b.id === active.id);
                                const newIndex = folderBacktests.findIndex((b) => b.id === over.id);
                                const newOrder = arrayMove(folderBacktests, oldIndex, newIndex);
                                reorderBacktests.mutate(newOrder.map(b => b.id));
                              }
                            }}
                          >
                            <SortableContext
                              items={folderBacktests.map(b => b.id)}
                              strategy={rectSortingStrategy}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {folderBacktests.map((backtest) => (
                                  <SortableCard key={backtest.id} id={backtest.id}>
                                    <ExpandableGalleryCard
                                      title={backtest.name}
                                      subtitle={backtest.symbol || backtest.strategy || ''}
                                      image={backtest.images?.[0]}
                                      symbol={backtest.symbol}
                                      onViewClick={() => openView(backtest)}
                                      onEditClick={() => openEdit(backtest)}
                                      onDeleteClick={() => setDeleteConfirmId(backtest.id)}
                                      isGlassEnabled={isGlassEnabled}
                                      details={[
                                        { label: 'Symbol', value: backtest.symbol || '-' },
                                        { label: 'Win Rate', value: `${backtest.win_rate?.toFixed(0) || 0}%` },
                                        { label: 'Trades', value: String(backtest.total_trades || 0) },
                                      ]}
                                      onImageClick={() => {
                                        if (backtest.images?.length) {
                                          setZoomImages(backtest.images);
                                          setZoomOpen(true);
                                        }
                                      }}
                                    />
                                  </SortableCard>
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => openCreateInFolder(folder.id)}
                          >
                            <Plus className="h-3 w-3" />
                            Add Backtest
                          </Button>
                        </div>
                      )}
                    </FolderAccordion>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Folder Dialog */}
      <FolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folder={editingFolder}
        onSave={handleFolderSave}
        isLoading={createFolder.isPending || updateFolder.isPending}
        type="backtest"
      />

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolderConfirm} onOpenChange={() => setDeleteFolderConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteFolderConfirm?.name}" and all backtests inside it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFolderDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Backtest Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md sm:max-h-[85vh] p-0 gap-0 overflow-hidden" fullScreenOnMobile hideCloseButton>
          <div className="flex flex-col h-full max-h-[inherit] overflow-hidden">
            {/* Sticky Header with safe area padding on mobile */}
            <div className="flex-shrink-0 sticky top-0 z-10 bg-card px-5 py-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-5 sm:px-6 border-b border-border/30">
              <div className="flex items-center justify-between">
                <DialogHeader className="text-left">
                  <DialogTitle>New Backtest</DialogTitle>
                </DialogHeader>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors sm:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 sm:pt-4 min-h-0">
              {renderForm(false)}
            </div>
            
            {/* Fixed footer with safe area */}
            <div className="flex-shrink-0 px-5 pt-3 sm:px-6 flex gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 border-t border-border/30">
              <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl h-12" onClick={handleCreate} disabled={createBacktest.isPending}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Backtest Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md sm:max-h-[85vh] p-0 gap-0 overflow-hidden" fullScreenOnMobile hideCloseButton>
          <div className="flex flex-col h-full max-h-[inherit] overflow-hidden">
            {/* Sticky Header with safe area padding on mobile */}
            <div className="flex-shrink-0 sticky top-0 z-10 bg-card px-5 py-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:pt-5 sm:px-6 border-b border-border/30">
              <div className="flex items-center justify-between">
                <DialogHeader className="text-left">
                  <DialogTitle>Edit Backtest</DialogTitle>
                </DialogHeader>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors sm:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 sm:pt-4 min-h-0 overscroll-y-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              {renderForm(true)}
            </div>
            
            {/* Fixed footer with safe area */}
            <div className="flex-shrink-0 px-5 pt-3 sm:px-6 flex gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 border-t border-border/30 bg-card">
              <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl h-12" onClick={handleEdit} disabled={updateBacktest.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Backtest Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden" fullScreenOnMobile hideCloseButton>
          <div className={cn(
            "flex flex-col h-full overflow-hidden relative",
            isGlassEnabled
              ? "bg-card/95 dark:bg-card/80 backdrop-blur-xl"
              : "bg-card"
          )}>
            {/* Dot pattern removed - these pages should not have dot background */}
            {/* Header matching TradeViewDialog style */}
            <div className="flex-shrink-0 px-4 md:px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-border/50 bg-muted/30 dark:bg-white/[0.02] relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {selectedBacktest?.symbol && <SymbolIcon symbol={selectedBacktest.symbol} size="md" />}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-semibold text-foreground">{selectedBacktest?.name}</span>
                    </div>
                    {selectedBacktest?.symbol && (
                      <p className="text-sm text-muted-foreground font-mono">{selectedBacktest.symbol}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsViewOpen(false)}
                  className="p-2 -m-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Info row with date, day, session, strategy */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                {selectedBacktest?.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedBacktest.date}
                  </span>
                )}
                {selectedBacktest?.day_of_week && (
                  <span>{selectedBacktest.day_of_week}</span>
                )}
                {selectedBacktest?.entry_time && (
                  <span className="tabular-nums">{selectedBacktest.entry_time}</span>
                )}
                {selectedBacktest?.session && (
                  <span className="px-2 py-0.5 rounded bg-muted text-foreground text-[10px] font-medium">
                    {selectedBacktest.session}
                  </span>
                )}
                {selectedBacktest?.strategy && (
                  <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                    {selectedBacktest.strategy}
                  </span>
                )}
              </div>
            </div>
            
            {/* Scrollable content with proper overflow containment */}
            {selectedBacktest && (
              <div 
                className="flex-1 overflow-y-auto p-5 sm:p-6 sm:pt-4 min-h-0 space-y-4 overscroll-y-contain relative z-10"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-lg font-bold font-outfit">{selectedBacktest.total_trades || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Trades</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-lg font-bold font-outfit">{selectedBacktest.win_rate?.toFixed(0) || 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className="text-lg font-bold font-outfit">{selectedBacktest.profit_factor?.toFixed(1) || '-'}</p>
                    <p className="text-[10px] text-muted-foreground">PF</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <p className={cn(
                      'text-lg font-bold font-outfit',
                      (selectedBacktest.net_pnl || 0) >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
                    )}>
                      {(selectedBacktest.net_pnl || 0) >= 0 ? '+' : '-'}${Math.abs(selectedBacktest.net_pnl || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Net P&L</p>
                  </div>
                </div>

                {/* News Section */}
                {selectedBacktest?.has_news && (
                  <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                      <span className="text-sm font-medium text-foreground">Economic News</span>
                    </div>
                    
                    {/* Display full news events if available */}
                    {selectedBacktest.news_events && selectedBacktest.news_events.length > 0 ? (
                      <div className="space-y-2">
                        {selectedBacktest.news_events.map((event, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/30">
                            <div className="flex flex-wrap gap-4">
                              <div className="flex-1 min-w-[150px] space-y-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Event</span>
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                              </div>
                              {event.currency && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Currency</span>
                                  <p className="text-sm font-medium text-foreground">{event.currency}</p>
                                </div>
                              )}
                              {event.time && (
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</span>
                                  <p className="text-sm font-medium text-foreground tabular-nums">{event.time}</p>
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact</span>
                                <p className={cn(
                                  "text-sm font-medium capitalize",
                                  event.impact === 'high' && 'text-red-500',
                                  event.impact === 'medium' && 'text-orange-500',
                                  event.impact === 'low' && 'text-yellow-500'
                                )}>
                                  {event.impact}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : selectedBacktest.news_impact ? (
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-2">
                        <div className="flex flex-wrap gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact</span>
                            <p className={cn(
                              "text-sm font-medium capitalize",
                              selectedBacktest.news_impact === 'high' && 'text-red-500',
                              selectedBacktest.news_impact === 'medium' && 'text-orange-500',
                              selectedBacktest.news_impact === 'low' && 'text-yellow-500'
                            )}>
                              {selectedBacktest.news_impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Chart Analysis Cards - matching TradeViewDialog style */}
                {(() => {
                  const charts = parseNotesToCharts(selectedBacktest.notes || '', selectedBacktest.images || []);
                  return charts.map((chart, idx) => (
                    <div key={chart.id || idx} className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/20">
                      {/* Timeframe badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded bg-muted text-sm font-medium text-foreground">
                          {getTimeframeLabel(chart.timeframe)}
                        </span>
                      </div>
                      
                      {/* Chart image with proper containment */}
                      {chart.images && chart.images.length > 0 && chart.images[0] && (
                        <div className="relative rounded-lg border border-border/50 overflow-hidden bg-muted/30">
                          <img 
                            src={chart.images[0]} 
                            alt={getTimeframeLabel(chart.timeframe)}
                            className="w-full h-auto cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              imageRendering: 'auto',
                              display: 'block',
                              maxWidth: '100%',
                              objectFit: 'contain',
                            }}
                            onClick={() => {
                              setZoomImages(selectedBacktest.images || []);
                              setZoomOpen(true);
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Notes below the chart */}
                      {chart.notes && (
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{chart.notes}</p>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
            
            {/* Fixed footer with safe area */}
            <div className="flex-shrink-0 px-5 pt-3 sm:px-6 flex gap-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 border-t border-border/30">
              <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setIsViewOpen(false)}>
                Close
              </Button>
              <Button 
                className="flex-1 rounded-xl h-12" 
                onClick={() => {
                  setIsViewOpen(false);
                  if (selectedBacktest) openEdit(selectedBacktest);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Backtest Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backtest</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this backtest? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Zoom Dialog */}
      <ImageZoomDialog
        images={zoomImages}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
      />
    </div>
    </PageTransition>
  );
}
