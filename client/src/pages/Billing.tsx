import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { ArrowLeft, CreditCard, ExternalLink, Loader2, Gem, Crown, Diamond, CheckCircle, Calendar, Receipt } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

const PLAN_INFO: Record<PlanType, { name: string; color: string; icon: any; bgColor: string }> = {
  free: { name: "Free", color: "text-muted-foreground", icon: null, bgColor: "bg-secondary/20" },
  ruby: { name: "Ruby", color: "text-red-400", icon: Gem, bgColor: "bg-red-500/10" },
  pro: { name: "Pro", color: "text-purple-400", icon: Crown, bgColor: "bg-purple-500/10" },
  diamond: { name: "Diamond", color: "text-cyan-400", icon: Diamond, bgColor: "bg-cyan-500/10" },
};

export default function Billing() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentPlan } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const planType = (user?.planType || "free") as PlanType;
  const planInfo = PLAN_INFO[planType] || PLAN_INFO.free;
  const PlanIcon = planInfo.icon;

  const handleManageSubscription = async () => {
    if (planType === "free") {
      toast({ 
        title: "No Active Subscription", 
        description: "Subscribe to a plan first to manage your billing." 
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/billing/portal");
      const data = await response.json();
      
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Unable to open billing portal. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPlanPrice = () => {
    switch (planType) {
      case 'ruby': return '$9.99';
      case 'pro': return '$19.99';
      case 'diamond': return '$29.99';
      default: return '$0.00';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
              <a className="p-2 hover:bg-secondary/50 rounded-lg transition-colors" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <h1 className="text-2xl font-bold">Billing</h1>
          </div>

          <div className={`${planInfo.bgColor} border border-white/10 rounded-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {PlanIcon && <PlanIcon className={`w-6 h-6 ${planInfo.color}`} />}
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <h2 className={`text-xl font-bold ${planInfo.color}`}>{planInfo.name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{getPlanPrice()}</p>
                <p className="text-sm text-muted-foreground">/month</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-green-400 mb-4">
              <CheckCircle className="w-4 h-4" />
              <span>{planType === 'free' ? 'Free tier active' : 'Active subscription'}</span>
            </div>

            {planType !== 'free' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Renews monthly</span>
              </div>
            )}
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Payment Method</h2>
              </div>
            </div>
            
            <div className="p-4">
              {planType === 'free' ? (
                <p className="text-sm text-muted-foreground">No payment method on file</p>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium">Ending in ****</p>
                      <p className="text-sm text-muted-foreground">Managed via Stripe</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Billing History</h2>
              </div>
            </div>
            
            <div className="p-4">
              {planType === 'free' ? (
                <p className="text-sm text-muted-foreground text-center py-4">No billing history</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  View your complete billing history in the Stripe portal
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full py-6 bg-primary hover:bg-primary/90"
            data-testid="button-manage-subscription"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ExternalLink className="w-5 h-5 mr-2" />
            )}
            {planType === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
          </Button>

          {planType === 'free' && (
            <p className="text-center text-sm text-muted-foreground">
              Upgrade to unlock more AI models and features
            </p>
          )}
        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
