import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, LogOut, Shield, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type PlanType = 'annual' | 'monthly';

export default function Paywall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  
  // Stripe Price IDs - replace these with your actual price IDs
  const priceIds: Record<PlanType, string> = {
    monthly: 'price_1SuHcmELJcgT10sLDsC9DpZ6', // Replace with your monthly price ID
    annual: 'price_1SuHcmELJcgT10sLOE2DoLrq',  // Replace with your annual price ID
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSubscribe = async (plan?: PlanType) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    const selectedPlanType = plan ?? selectedPlan;

    try {
      // Call your create-checkout-session Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: priceIds[selectedPlanType],
          userId: user.id,
          planType: selectedPlanType,
          userEmail: user.email,
          promoCode: promoCode.trim() || undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="gap-2 -ml-2 hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'transparent' }}
        >
          <LogOut className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.6)' }}>Sign Out</span>
        </Button>
        <div className="w-10 sm:w-20" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 pb-8 pt-2 sm:px-6 sm:py-12 sm:justify-center sm:items-center overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          {/* Header Text */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#ffffff' }}>Choose Your Plan</h1>
            <p className="text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>Unlock your trading potential</p>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden flex flex-col gap-4">
            {/* Annual Plan - Mobile */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                'relative p-5 rounded-2xl text-left transition-all duration-300 border',
                selectedPlan === 'annual'
                  ? 'shadow-[0_0_30px_rgba(124,92,255,0.15)]'
                  : ''
              )}
              style={{ 
                backgroundColor: '#12121a',
                borderColor: selectedPlan === 'annual' ? 'rgba(124,92,255,0.5)' : 'rgba(255,255,255,0.1)'
              }}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ backgroundColor: '#7c5cff', color: '#ffffff' }}
                >
                  Save 34% Recommended
                </div>
              </div>
              
              <div className="flex items-start justify-between gap-4 pt-2">
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Annual</h3>
                  <p className="italic text-xs" style={{ color: '#a78bfa' }}>"For serious traders"</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold" style={{ color: '#ffffff' }}>$19</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>/mo</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Billed $228/year</p>
                </div>
              </div>
              
              {/* Features - only show when selected */}
              <div className={cn(
                "space-y-2 pt-4",
                selectedPlan === 'annual' ? "block" : "hidden"
              )}>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#7c5cff' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Unlimited Trade Imports</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: '#7c5cff' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Advanced Analytics</span>
                </div>
              </div>
              
              {/* Selection indicator */}
              <div 
                className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ 
                  borderColor: selectedPlan === 'annual' ? '#7c5cff' : 'rgba(255,255,255,0.3)',
                  backgroundColor: selectedPlan === 'annual' ? '#7c5cff' : 'transparent'
                }}
              >
                {selectedPlan === 'annual' && <Check className="h-3 w-3" style={{ color: '#ffffff' }} />}
              </div>
            </button>

            {/* Monthly Plan - Mobile */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className="relative p-5 rounded-2xl text-left transition-all duration-300 border"
              style={{ 
                backgroundColor: '#0e0e14',
                borderColor: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="text-lg font-semibold" style={{ color: '#ffffff' }}>Monthly</h3>
                  <p className="italic text-xs" style={{ color: '#a78bfa' }}>"Flexible billing"</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold" style={{ color: '#ffffff' }}>$29</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>/mo</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Cancel anytime</p>
                </div>
              </div>
              
              {/* Features - only show when selected */}
              <div className={cn(
                "space-y-2 pt-4",
                selectedPlan === 'monthly' ? "block" : "hidden"
              )}>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Unlimited Trade Imports</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Advanced Analytics</span>
                </div>
              </div>
              
              {/* Selection indicator */}
              <div 
                className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ 
                  borderColor: selectedPlan === 'monthly' ? '#ffffff' : 'rgba(255,255,255,0.3)',
                  backgroundColor: selectedPlan === 'monthly' ? '#ffffff' : 'transparent'
                }}
              >
                {selectedPlan === 'monthly' && <Check className="h-3 w-3" style={{ color: '#000000' }} />}
              </div>
            </button>

            {/* Promo Code Input */}
            <div className="mt-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Tag className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                </div>
                <Input
                  type="text"
                  placeholder="Promo code (optional)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="h-12 pl-12 pr-4 rounded-xl border text-sm"
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#ffffff'
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Mobile CTA Button */}
            <Button
              onClick={() => handleSubscribe()}
              disabled={isLoading}
              className="w-full h-14 rounded-xl font-semibold text-base mt-4 border-0"
              style={{ 
                backgroundColor: selectedPlan === 'annual' ? '#ffffff' : 'rgba(255,255,255,0.1)',
                color: selectedPlan === 'annual' ? '#0a0a0f' : '#ffffff'
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: selectedPlan === 'annual' ? 'rgba(10,10,15,0.3)' : 'rgba(255,255,255,0.3)',
                      borderTopColor: selectedPlan === 'annual' ? '#0a0a0f' : '#ffffff'
                    }}
                  />
                  Processing...
                </div>
              ) : (
                <>Continue with {selectedPlan === 'annual' ? 'Annual' : 'Monthly'}</>
              )}
            </Button>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-6 pt-4">
            {/* Annual Plan */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                'relative p-8 rounded-2xl text-left transition-all duration-300 border',
                selectedPlan === 'annual' ? 'shadow-[0_0_30px_rgba(124,92,255,0.15)]' : ''
              )}
              style={{ 
                backgroundColor: '#12121a',
                borderColor: selectedPlan === 'annual' ? 'rgba(124,92,255,0.5)' : 'rgba(255,255,255,0.1)'
              }}
            >
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div 
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                  style={{ backgroundColor: '#7c5cff', color: '#ffffff' }}
                >
                  Save 34% Recommended
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                  Serious Trader (Annual)
                </h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold" style={{ color: '#ffffff' }}>$19</span>
                  <span className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>/mo</span>
                </div>
                
                <p className="italic text-sm" style={{ color: '#a78bfa' }}>
                  "For traders who actually plan to still be trading next year."
                </p>
                
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Billed $228 annually.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: '#7c5cff' }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: '#7c5cff' }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.9)' }}>Advanced Analytics</span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('annual');
                    handleSubscribe('annual');
                  }}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-base mt-4 border-0"
                  style={{ backgroundColor: '#ffffff', color: '#0a0a0f' }}
                >
                  {isLoading && selectedPlan === 'annual' ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(10,10,15,0.3)', borderTopColor: '#0a0a0f' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    'Commit for a Year'
                  )}
                </Button>
              </div>
            </button>

            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className="relative p-8 rounded-2xl text-left transition-all duration-300 border"
              style={{ 
                backgroundColor: '#0e0e14',
                borderColor: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)'
              }}
            >
              <div className="space-y-6">
                <h3 className="text-xl font-semibold" style={{ color: '#ffffff' }}>
                  Flexible (Monthly)
                </h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold" style={{ color: '#ffffff' }}>$29</span>
                  <span className="text-lg" style={{ color: 'rgba(255,255,255,0.5)' }}>/mo</span>
                </div>
                
                <p className="italic text-sm" style={{ color: '#a78bfa' }}>
                  "For people who are afraid of commitment."
                </p>
                
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Billed monthly. Cancel anytime.
                </p>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Advanced Analytics</span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('monthly');
                    handleSubscribe('monthly');
                  }}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full h-12 rounded-xl font-semibold text-base mt-4 border-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }}
                >
                  {isLoading && selectedPlan === 'monthly' ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    'Start Monthly'
                  )}
                </Button>
              </div>
            </button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs mt-6 sm:mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Secure payments via Stripe
            </span>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span>Cancel anytime</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
