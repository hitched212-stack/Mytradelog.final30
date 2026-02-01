import { useAccount, AccountType } from '@/hooks/useAccount';
import { Check, ChevronDown, Building2, User, Trophy, TestTube, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const accountTypeIcons: Record<AccountType, typeof Building2> = {
  prop_firm: Building2,
  personal: User,
  funded: Trophy,
  demo: TestTube,
};

const accountTypeLabels: Record<AccountType, string> = {
  prop_firm: 'Prop Firm',
  personal: 'Personal',
  funded: 'Funded',
  demo: 'Demo',
};

interface AccountSwitcherProps {
  collapsed?: boolean;
}

export function AccountSwitcher({ collapsed = false }: AccountSwitcherProps) {
  const { accounts, activeAccount, setActiveAccount } = useAccount();
  const navigate = useNavigate();

  // Filter to only show active accounts
  const activeAccounts = accounts.filter(a => a.status === 'active');

  if (!activeAccount) return null;

  const TypeIcon = accountTypeIcons[activeAccount.type] || User;

  const formatBalance = (balance: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(balance);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 w-full rounded-xl transition-all',
            'bg-foreground/5 hover:bg-foreground/10 border border-border/50',
            collapsed ? 'p-2 justify-center' : 'px-3 py-2.5'
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/10 flex-shrink-0">
            <TypeIcon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
          </div>
          
          {!collapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activeAccount.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {accountTypeLabels[activeAccount.type]}
                  {activeAccount.broker_name && ` · ${activeAccount.broker_name}`}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        align="start" 
        className="w-64 bg-card border-border"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Account
        </DropdownMenuLabel>
        
        {activeAccounts.map((account) => {
          const Icon = accountTypeIcons[account.type] || User;
          const isActive = account.id === activeAccount.id;
          
          return (
            <DropdownMenuItem
              key={account.id}
              onClick={() => setActiveAccount(account)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                isActive && 'bg-foreground/5'
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground/10 flex-shrink-0">
                <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {account.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {accountTypeLabels[account.type]}
                  {account.broker_name && ` · ${account.broker_name}`}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatBalance(account.starting_balance, account.currency)}
                </span>
                {isActive && (
                  <Check className="h-4 w-4 text-pnl-positive" strokeWidth={2} />
                )}
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => navigate('/settings/accounts')}
          className="flex items-center gap-3 cursor-pointer text-muted-foreground"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-dashed border-border flex-shrink-0">
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          </div>
          <span className="text-sm">Manage Accounts</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}