import { useParams, useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { TradeForm } from '@/components/trade/TradeForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditTrade() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrade, isLoading } = useTrades();
  
  const trade = id ? getTrade(id) : undefined;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading trade...</p>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="mb-4 text-muted-foreground">Trade not found</p>
        <Button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Journal
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="md:hidden fixed inset-0 z-50 flex flex-col h-full bg-background"
      onClick={(e) => {
        // Prevent clicks on empty space from causing issues
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Full-screen container with safe-area padding */}
      <div className="flex-1 flex flex-col min-h-0 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <TradeForm editTrade={trade} />
      </div>
    </div>
  );
}
