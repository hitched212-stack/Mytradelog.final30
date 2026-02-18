import { useSearchParams } from 'react-router-dom';
import { TradeForm } from '@/components/trade/TradeForm';

export default function AddTrade() {
  const [searchParams] = useSearchParams();
  const defaultDate = searchParams.get('date');

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
            <TradeForm />
          </div>
        </div>
      </div>
    </div>
  );
}
