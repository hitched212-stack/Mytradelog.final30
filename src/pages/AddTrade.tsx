import { useSearchParams } from 'react-router-dom';
import { TradeForm } from '@/components/trade/TradeForm';

export default function AddTrade() {
  const [searchParams] = useSearchParams();
  const defaultDate = searchParams.get('date');

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
        <TradeForm />
      </div>
    </div>
  );
}
