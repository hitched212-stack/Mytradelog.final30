import { useAccount } from '@/hooks/useAccount';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function AccountSelector() {
  const { accounts, activeAccount, setActiveAccount } = useAccount();

  if (accounts.length <= 1) {
    return null;
  }

  return (
    <Select
      value={activeAccount?.id}
      onValueChange={(value) => {
        const account = accounts.find(a => a.id === value);
        if (account) setActiveAccount(account);
      }}
    >
      <SelectTrigger className="w-[200px] bg-card border-border">
        <SelectValue placeholder="Select account" />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-2">
              <span>{account.name}</span>
              <Badge variant="outline" className="text-xs">
                {account.role}
              </Badge>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
