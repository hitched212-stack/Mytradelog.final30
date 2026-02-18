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
      className="fixed inset-0 bg-background"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      {/* Content wrapper with safe area */}
      <div 
        className="h-full flex flex-col"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        {/* Scrollable content area */}
        <div 
          className="flex-1 overflow-y-auto flex justify-center md:px-4 lg:px-8"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
          }}
        >
          <div className="w-full md:max-w-2xl">
            <TradeForm trade={trade} />
          </div>
        </div>
      </div>
    </div>
        }}
      >
        <div className="w-full md:max-w-2xl flex flex-col min-h-0">
          <TradeForm editTrade={trade} />
        </div>
      </div>
    </div>
  );
}
