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
      className="fixed inset-0 flex flex-col bg-card"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        // Prevent clicks on empty space from causing issues
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Blurred backdrop effect - only on desktop */}
      <div className="hidden md:block fixed inset-0 bg-background/80 backdrop-blur-md -z-10 pointer-events-none" />
      
      {/* Full screen on mobile, centered on desktop */}
      <div 
        className="flex-1 flex justify-center md:px-4 lg:px-8 min-h-0" 
        style={{ 
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="w-full md:max-w-2xl flex flex-col min-h-0">
          <TradeForm editTrade={trade} />
        </div>
      </div>
    </div>
  );
}
