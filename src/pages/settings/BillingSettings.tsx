import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, XCircle, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { Skeleton } from '@/components/ui/skeleton';

export default function BillingSettings() {
  const navigate = useNavigate();
  const { subscription, loading, isActive, renewalDate, planName, monthlyPrice } = useSubscription();

  const handleCancelSubscription = () => {
    // TODO: Implement Stripe cancellation logic via webhook
    toast.success('Subscription cancelled. You will have access until the end of your billing period.');
  };

  const handleUpdatePaymentMethod = () => {
    // TODO: Implement Stripe customer portal redirect
    toast.info('Payment method update coming soon');
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </header>
        <div className="px-4 md:px-6 lg:px-8 space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // No subscription found
  if (!subscription) {
    return (
      <div className="min-h-screen pb-24">
        <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
              <p className="text-sm text-muted-foreground">Manage your subscription and payment</p>
            </div>
          </div>
        </header>

        <div className="px-4 md:px-6 lg:px-8">
          <div className="rounded-2xl border border-border/50 bg-card p-6 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No Active Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have an active subscription. Subscribe to unlock all Pro features.
            </p>
            <Button onClick={() => navigate('/paywall')}>
              View Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusColor = isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500';
  const statusText = subscription.cancel_at_period_end ? 'Cancelling' : 
                     isActive ? 'Active' : 
                     subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="text-sm text-muted-foreground">Manage your subscription and payment</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        {/* Current Plan */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{planName}</h3>
                    <Badge className={`text-xs ${statusColor}`}>
                      {statusText}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {monthlyPrice}/month • {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} {renewalDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Subscription Details
          </h2>
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="divide-y divide-border/50">
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium text-foreground">{planName}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={`text-xs ${statusColor}`}>{statusText}</Badge>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {subscription.cancel_at_period_end ? 'Access Until' : 'Next Billing Date'}
                </span>
                <span className="text-sm font-medium text-foreground">{renewalDate}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing Amount</span>
                <span className="text-sm font-medium text-foreground">
                  {subscription.plan_type === 'annual' ? '$79/year' : '$9.99/month'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Subscription - only show if not already cancelling */}
        {isActive && !subscription.cancel_at_period_end && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Cancel Subscription
            </h2>
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Cancel your subscription</p>
                    <p className="text-sm text-muted-foreground">
                      You'll lose access to Pro features at the end of your billing period. Your data will be preserved.
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will retain access to Pro features until {renewalDate}.
                        After that, your account will be downgraded to the free plan. Your data will be preserved.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}

        {/* Show message if subscription is set to cancel */}
        {subscription.cancel_at_period_end && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Subscription Ending</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription will end on {renewalDate}. You'll continue to have access until then.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}