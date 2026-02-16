import { useSearchParams } from 'react-router-dom';
import { TradeForm } from '@/components/trade/TradeForm';

export default function AddTrade() {
  const [searchParams] = useSearchParams();
  const defaultDate = searchParams.get('date');

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-background"
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
      <div className="flex-1 flex justify-center md:px-4 lg:px-8 min-h-0" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-full md:max-w-2xl flex flex-col min-h-0">
          <TradeForm />
        </div>
      </div>
    </div>
  );
}
