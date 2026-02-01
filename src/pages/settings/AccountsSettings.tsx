import { useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, MoreHorizontal, Pencil, Archive, Trash2, CheckCircle2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount, Account, AccountType, AccountStatus } from '@/hooks/useAccount';
import { useSettings } from '@/hooks/useSettings';
import { useTrades } from '@/hooks/useTrades';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Account icon component using wallet icon
const AccountIcon = memo(({ className }: { className?: string }) => {
  return (
    <Wallet className={cn('text-foreground', className)} strokeWidth={1.5} />
  );
});

AccountIcon.displayName = 'AccountIcon';

const accountTypeConfig: Record<AccountType, { label: string }> = {
  prop_firm: { label: 'Prop Firm' },
  personal: { label: 'Personal' },
  funded: { label: 'Funded' },
  demo: { label: 'Demo' },
};

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

interface AccountFormData {
  name: string;
  type: AccountType;
  broker_name: string;
  currency: string;
  starting_balance: string;
}

const formatBalance = (balance: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(balance);
};

// Memoized Account Card - defined outside component to prevent recreation
interface AccountCardProps {
  account: Account;
  isActive: boolean;
  balance: number;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

const AccountCard = memo(({ 
  account, 
  isActive, 
  balance, 
  onSelect, 
  onEdit, 
  onArchive, 
  onDelete,
  canDelete 
}: AccountCardProps) => {
  const config = accountTypeConfig[account.type] || accountTypeConfig.personal;
  const isArchived = account.status === 'archived';

  return (
    <div
      onClick={() => !isArchived && onSelect()}
      className={cn(
        'group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer',
        isActive
          ? 'border-foreground/20 bg-card shadow-lg'
          : 'border-border/50 bg-card/50 hover:border-foreground/10 hover:bg-card/80',
        isArchived && 'opacity-50 cursor-default'
      )}
    >
      <div className="relative p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Icon and info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl transition-colors overflow-hidden',
              isActive ? 'bg-foreground/10' : 'bg-foreground/5 group-hover:bg-foreground/10'
            )}>
              <AccountIcon className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground truncate">
                  {account.name}
                </h3>
                {isActive && (
                  <CheckCircle2 className="h-4 w-4 text-pnl-positive flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-foreground/5">
                  {config.label}
                </span>
                {account.broker_name && (
                  <>
                    <span>·</span>
                    <span className="truncate">{account.broker_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Balance and actions */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground font-outfit tabular-nums">
                {formatBalance(balance, account.currency)}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-transparent active:bg-transparent"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-card border-border">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }}>
                  <Archive className="h-4 w-4 mr-2" />
                  {isArchived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                      className="text-pnl-negative focus:text-pnl-negative"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
});

AccountCard.displayName = 'AccountCard';

// Isolated form component to prevent parent re-renders
interface AccountFormProps {
  initialData: AccountFormData;
  onSubmit: (data: AccountFormData) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
}

const AccountForm = memo(({ initialData, onSubmit, submitLabel, isSubmitting }: AccountFormProps) => {
  const [formData, setFormData] = useState<AccountFormData>(initialData);

  const updateField = useCallback((field: keyof AccountFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">Account Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g. FTMO 100k Challenge"
          className="h-11 bg-background border-border/50 focus:border-foreground/20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium">Account Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value: AccountType) => updateField('type', value)}
        >
          <SelectTrigger className="h-11 bg-background border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(accountTypeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="broker" className="text-sm font-medium">Broker / Firm Name</Label>
        <Input
          id="broker"
          value={formData.broker_name}
          onChange={(e) => updateField('broker_name', e.target.value)}
          placeholder="e.g. FTMO, IC Markets"
          className="h-11 bg-background border-border/50 focus:border-foreground/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => updateField('currency', value)}
          >
            <SelectTrigger className="h-11 bg-background border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="balance" className="text-sm font-medium">Starting Balance</Label>
          <Input
            id="balance"
            type="number"
            value={formData.starting_balance}
            onChange={(e) => updateField('starting_balance', e.target.value)}
            placeholder="0"
            className="h-11 bg-background border-border/50 focus:border-foreground/20"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-11 bg-foreground text-background hover:opacity-90 font-medium mt-2"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </div>
  );
});

AccountForm.displayName = 'AccountForm';

export default function AccountsSettings() {
  const navigate = useNavigate();
  const { accounts, refreshAccounts, activeAccount, setActiveAccount } = useAccount();
  const { settings } = useSettings();
  const { trades: allTrades } = useTrades();
  

  // Calculate account balance (starting balance + P&L) for each account
  const getAccountBalance = useCallback((account: Account) => {
    const accountTrades = allTrades.filter(t => t.accountId === account.id);
    const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    return account.starting_balance + totalPnl;
  }, [allTrades]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccountState] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultFormData = useCallback((): AccountFormData => ({
    name: '',
    type: 'personal',
    broker_name: '',
    currency: settings.currency || 'USD',
    starting_balance: '0',
  }), [settings.currency]);

  const activeAccounts = accounts.filter(a => a.status === 'active');
  const archivedAccounts = accounts.filter(a => a.status === 'archived');

  const handleCreate = useCallback(async (formData: AccountFormData) => {
    if (!formData.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('create_account_for_user', {
        _name: formData.name.trim(),
        _type: formData.type,
        _broker_name: formData.broker_name.trim() || null,
        _currency: formData.currency,
        _starting_balance: parseFloat(formData.starting_balance) || 0,
      });

      if (error) throw error;

      toast.success('Account added successfully');
      setIsCreateOpen(false);
      await refreshAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshAccounts]);

  const handleUpdate = useCallback(async (formData: AccountFormData) => {
    if (!editingAccount || !formData.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: formData.name.trim(),
          type: formData.type as any,
          broker_name: formData.broker_name.trim() || null,
          currency: formData.currency,
          starting_balance: parseFloat(formData.starting_balance) || 0,
        })
        .eq('id', editingAccount.id);

      if (error) throw error;

      toast.success('Account updated successfully');
      setEditingAccount(null);
      await refreshAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account');
    } finally {
      setIsSubmitting(false);
    }
  }, [editingAccount, refreshAccounts]);

  const handleArchive = useCallback(async (account: Account) => {
    try {
      const newStatus: AccountStatus = account.status === 'active' ? 'archived' : 'active';
      
      const { error } = await supabase
        .from('accounts')
        .update({ status: newStatus as any })
        .eq('id', account.id);

      if (error) throw error;

      if (newStatus === 'archived' && activeAccount?.id === account.id) {
        const otherActive = accounts.find(a => a.id !== account.id && a.status === 'active');
        if (otherActive) {
          setActiveAccount(otherActive);
        }
      }

      toast.success(newStatus === 'archived' ? 'Account archived' : 'Account restored');
      await refreshAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update account');
    }
  }, [accounts, activeAccount?.id, refreshAccounts, setActiveAccount]);

  const handleDelete = useCallback(async () => {
    if (!deleteAccount) return;

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', deleteAccount.id);

      if (error) throw error;

      if (activeAccount?.id === deleteAccount.id) {
        const other = accounts.find(a => a.id !== deleteAccount.id);
        if (other) {
          setActiveAccount(other);
        }
      }

      toast.success('Account deleted');
      setDeleteAccountState(null);
      await refreshAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  }, [accounts, activeAccount?.id, deleteAccount, refreshAccounts, setActiveAccount]);

  const handleSetActive = useCallback((account: Account) => {
    if (account.status === 'active') {
      setActiveAccount(account);
      toast.success(`Switched to ${account.name}`);
    }
  }, [setActiveAccount]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 h-14">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Trading Accounts</h1>
            <p className="text-xs text-muted-foreground">Manage your portfolios</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 -mr-2 rounded-xl hover:bg-foreground/5 transition-colors"
          >
            <X className="h-5 w-5 text-foreground" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Top Row: Stats + Add Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Quick Stats */}
          <div className="flex gap-3">
            <div className="px-4 py-2 rounded-xl bg-card border border-border/50 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-foreground">{accounts.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-card border border-border/50 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-foreground">{activeAccounts.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="px-4 py-2 rounded-xl bg-card border border-border/50 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-foreground">{archivedAccounts.length}</p>
              <p className="text-xs text-muted-foreground">Archived</p>
            </div>
          </div>

          {/* Create Button */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                className="h-11 bg-foreground text-background hover:opacity-90 rounded-xl text-sm font-medium px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-2xl">
              <DialogHeader>
                <DialogTitle>Add Account</DialogTitle>
              </DialogHeader>
              <AccountForm
                key="create"
                initialData={getDefaultFormData()}
                onSubmit={handleCreate}
                submitLabel="Add Account"
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Account Cards Grid */}
        {activeAccounts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Active Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isActive={activeAccount?.id === account.id}
                  balance={getAccountBalance(account)}
                  onSelect={() => handleSetActive(account)}
                  onEdit={() => setEditingAccount(account)}
                  onArchive={() => handleArchive(account)}
                  onDelete={() => setDeleteAccountState(account)}
                  canDelete={account.role === 'owner' && accounts.length > 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Archived Accounts */}
        {archivedAccounts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground px-1">Archived</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {archivedAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  isActive={activeAccount?.id === account.id}
                  balance={getAccountBalance(account)}
                  onSelect={() => handleSetActive(account)}
                  onEdit={() => setEditingAccount(account)}
                  onArchive={() => handleArchive(account)}
                  onDelete={() => setDeleteAccountState(account)}
                  canDelete={account.role === 'owner' && accounts.length > 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {accounts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-foreground/5 flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No accounts yet</h3>
            <p className="text-sm text-muted-foreground">
              Create your first trading account to get started
            </p>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <AccountForm
              key={editingAccount.id}
              initialData={{
                name: editingAccount.name,
                type: editingAccount.type,
                broker_name: editingAccount.broker_name || '',
                currency: editingAccount.currency,
                starting_balance: editingAccount.starting_balance.toString(),
              }}
              onSubmit={handleUpdate}
              submitLabel="Save Changes"
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAccount} onOpenChange={(open) => !open && setDeleteAccountState(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAccount?.name}"? This action cannot be undone
              and all associated data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
