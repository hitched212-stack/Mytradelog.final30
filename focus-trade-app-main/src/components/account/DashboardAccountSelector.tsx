import { useAccount, AccountType, Account } from '@/hooks/useAccount';
import { useTrades } from '@/hooks/useTrades';
import { Check, ChevronDown, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const accountTypeConfig: Record<AccountType, { label: string }> = {
  prop_firm: { label: 'Prop Firm' },
  personal: { label: 'Personal' },
  funded: { label: 'Funded' },
  demo: { label: 'Demo' },
};

export function DashboardAccountSelector() {
  const { accounts, activeAccount, setActiveAccount, loading } = useAccount();
  const { trades: allTrades } = useTrades();
  const navigate = useNavigate();

  const activeAccounts = accounts.filter(a => a.status === 'active');

  // Calculate account balance (starting balance + P&L) for each account
  const getAccountBalance = (account: Account) => {
    const accountTrades = allTrades.filter(t => t.accountId === account.id);
    const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    return account.starting_balance + totalPnl;
  };

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  if (loading) {
    return (
      <div className="h-10 w-48 rounded-full bg-foreground/5 animate-pulse" />
    );
  }

  if (!activeAccount) return null;

  const config = accountTypeConfig[activeAccount.type] || accountTypeConfig.personal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
            'bg-foreground/[0.08] hover:bg-foreground/[0.12]',
            'border border-foreground/10',
            'text-sm font-medium text-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20'
          )}
        >
          <User className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="truncate max-w-[120px]">{activeAccount.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="center" 
        className="w-64 bg-card/95 backdrop-blur-xl border-border rounded-xl p-1.5"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {activeAccounts.map((account) => {
            const accConfig = accountTypeConfig[account.type] || accountTypeConfig.personal;
            const isActive = account.id === activeAccount.id;
            
            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => setActiveAccount(account)}
                className={cn(
                  'flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 transition-all',
                  isActive 
                    ? 'bg-foreground/10' 
                    : 'hover:bg-foreground/5'
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/5">
                  <User className="h-4 w-4 text-foreground" strokeWidth={1.5} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {account.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {accConfig.label}
                    {account.broker_name && ` · ${account.broker_name}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatBalance(getAccountBalance(account), account.currency)}
                  </span>
                  {isActive && (
                    <Check className="h-4 w-4 text-pnl-positive" strokeWidth={2} />
                  )}
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
        
        <DropdownMenuSeparator className="my-1.5" />
        
        <DropdownMenuItem
          onClick={() => navigate('/settings/accounts')}
          className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-border">
            <Settings className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <span className="text-sm">Manage Accounts</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
