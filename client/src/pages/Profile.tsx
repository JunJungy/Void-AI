import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { User, Settings, CreditCard, LogOut, ChevronRight, Gem, Crown, Diamond, Music2, Loader2, ExternalLink } from "lucide-react";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

const PLAN_INFO: Record<PlanType, { name: string; color: string; icon: any; description: string; bgColor: string; borderColor: string }> = {
  free: { 
    name: "Free", 
    color: "text-muted-foreground", 
    icon: null,
    description: "Basic access to v1.5 model",
    bgColor: "bg-secondary/20",
    borderColor: "border-white/10"
  },
  ruby: { 
    name: "Ruby", 
    color: "text-red-400", 
    icon: Gem,
    description: "Access to v1.5, v4, and v4.5 models",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20"
  },
  pro: { 
    name: "Pro", 
    color: "text-purple-400", 
    icon: Crown,
    description: "Access to v1.5, v5, and v6 models",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  },
  diamond: { 
    name: "Diamond", 
    color: "text-cyan-400", 
    icon: Diamond,
    description: "Unlimited access to all AI models",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20"
  },
};

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  metadata: { plan_type: string };
  prices: Array<{
    id: string;
    unit_amount: number;
    currency: string;
    recurring: { interval: string };
  }>;
}

export default function Profile() {
  const { currentPlan, setPlan } = useSubscription();
  const { toast } = useToast();
  const [location] = useLocation();
  const planInfo = PLAN_INFO[currentPlan];
  const PlanIcon = planInfo.icon;

  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: SubscriptionPlan[] }>({
    queryKey: ['/api/subscription/plans'],
    queryFn: async () => {
      const res = await fetch('/api/subscription/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const plan = params.get('plan') as PlanType;
    
    if (success === 'true' && plan && PLAN_INFO[plan]) {
      setPlan(plan);
      toast({
        title: `Welcome to ${PLAN_INFO[plan].name}!`,
        description: PLAN_INFO[plan].description,
      });
      window.history.replaceState({}, '', '/profile');
    }
    
    if (params.get('canceled') === 'true') {
      toast({
        title: "Checkout Canceled",
        description: "No charges were made.",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/profile');
    }
  }, [location, setPlan, toast]);

  const handleCheckout = async (priceId: string, planType: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planType }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'ruby': return Gem;
      case 'pro': return Crown;
      case 'diamond': return Diamond;
      default: return null;
    }
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'ruby': return 'text-red-400';
      case 'pro': return 'text-purple-400';
      case 'diamond': return 'text-cyan-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-400 p-1 mb-4">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-profile-name">Guest User</h1>
            <p className="text-sm text-muted-foreground">guest@voidai.app</p>
          </div>

          {/* Current Plan */}
          <div className={cn("border rounded-2xl p-5", planInfo.bgColor, planInfo.borderColor)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Current Plan</h2>
              <div className={cn("flex items-center gap-1 font-bold", planInfo.color)}>
                {PlanIcon && <PlanIcon className="w-4 h-4" />}
                <span>{planInfo.name}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{planInfo.description}</p>
            
            <div className="flex items-center gap-2 p-3 bg-black/20 rounded-xl">
              <Music2 className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">55 Credits</p>
                <p className="text-xs text-muted-foreground">Available for generation</p>
              </div>
            </div>
          </div>

          {/* Upgrade Plans */}
          {currentPlan !== "diamond" && (
            <div className="bg-card border border-white/5 rounded-2xl p-5">
              <h2 className="font-bold mb-4">Upgrade Your Plan</h2>
              
              {plansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : plansData?.plans && plansData.plans.length > 0 ? (
                <div className="space-y-3">
                  {plansData.plans.map((plan) => {
                    const planType = plan.metadata?.plan_type || plan.name.toLowerCase().replace(' plan', '');
                    const Icon = getPlanIcon(planType);
                    const price = plan.prices[0];
                    const isCurrentPlan = currentPlan === planType;
                    
                    if (isCurrentPlan) return null;
                    
                    return (
                      <button
                        key={plan.id}
                        onClick={() => price && handleCheckout(price.id, planType)}
                        disabled={!price}
                        className={cn(
                          "w-full p-4 rounded-xl border transition-all text-left",
                          planType === 'ruby' && "bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
                          planType === 'pro' && "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
                          planType === 'diamond' && "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {Icon && <Icon className={cn("w-6 h-6", getPlanColor(planType))} />}
                            <div>
                              <h3 className={cn("font-bold", getPlanColor(planType))}>{plan.name}</h3>
                              <p className="text-xs text-muted-foreground">{plan.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {price && (
                              <>
                                <p className="font-bold">{formatPrice(price.unit_amount)}</p>
                                <p className="text-xs text-muted-foreground">/month</p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-white/10 rounded-lg text-sm font-medium">
                          <span>Subscribe</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No plans available. Please try again later.
                </p>
              )}
            </div>
          )}

          {/* Menu Items */}
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors border-b border-white/5">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors border-b border-white/5">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Billing</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-red-400">
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left">Sign Out</span>
            </button>
          </div>

          {/* Reset Plan (Demo) */}
          <button
            onClick={() => {
              setPlan("free");
              toast({ title: "Plan Reset", description: "You're back on the Free plan." });
            }}
            className="w-full text-xs text-muted-foreground hover:text-white transition-colors py-2"
          >
            Reset to Free Plan (Demo)
          </button>
        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
