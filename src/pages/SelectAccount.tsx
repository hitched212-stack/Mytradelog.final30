import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from '@/hooks/useAccount';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export default function SelectAccount() {
  const navigate = useNavigate();
  const { accounts, activeAccount, setActiveAccount, loading } = useAccount();

  useEffect(() => {
    // If only one account, auto-select and redirect
    if (!loading && accounts.length === 1) {
      setActiveAccount(accounts[0]);
      navigate('/dashboard');
    }
  }, [accounts, loading, navigate, setActiveAccount]);

  useEffect(() => {
    // If account already selected, redirect
    if (activeAccount) {
      navigate('/dashboard');
    }
  }, [activeAccount, navigate]);

  const handleSelectAccount = (account: typeof accounts[0]) => {
    setActiveAccount(account);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Select Account
          </CardTitle>
          <p className="text-muted-foreground text-sm mt-2">
            Choose which account you want to access
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account) => (
            <Button
              key={account.id}
              variant="outline"
              className="w-full h-auto py-4 px-4 justify-start gap-3 bg-background hover:bg-accent"
              onClick={() => handleSelectAccount(account)}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">{account.name}</div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(account.created_at).toLocaleDateString()}
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {account.role}
              </Badge>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
