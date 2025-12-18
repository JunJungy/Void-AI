import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { User, Settings, CreditCard, LogOut, ChevronRight, Gem, Crown, Diamond, Music2 } from "lucide-react";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const PLAN_INFO: Record<PlanType, { name: string; color: string; icon: any; description: string }> = {
  free: { 
    name: "Free", 
    color: "text-muted-foreground", 
    icon: null,
    description: "Basic access to v1.5 model"
  },
  ruby: { 
    name: "Ruby", 
    color: "text-red-400", 
    icon: Gem,
    description: "Access to v1.5, v4, and v4.5 models"
  },
  pro: { 
    name: "Pro", 
    color: "text-purple-400", 
    icon: Crown,
    description: "Access to v1.5, v5, and v6 models"
  },
  diamond: { 
    name: "Diamond", 
    color: "text-cyan-400", 
    icon: Diamond,
    description: "Unlimited access to all AI models"
  },
};

export default function Profile() {
  const { currentPlan, setPlan } = useSubscription();
  const { toast } = useToast();
  const planInfo = PLAN_INFO[currentPlan];
  const PlanIcon = planInfo.icon;

  const handleUpgrade = (plan: PlanType) => {
    setPlan(plan);
    toast({
      title: `Upgraded to ${PLAN_INFO[plan].name}!`,
      description: PLAN_INFO[plan].description,
    });
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
          <div className="bg-card border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Current Plan</h2>
              <div className={cn("flex items-center gap-1 font-bold", planInfo.color)}>
                {PlanIcon && <PlanIcon className="w-4 h-4" />}
                <span>{planInfo.name}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{planInfo.description}</p>
            
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-xl mb-4">
              <Music2 className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">55 Credits</p>
                <p className="text-xs text-muted-foreground">Available for generation</p>
              </div>
            </div>

            {currentPlan !== "diamond" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Upgrade your plan:</p>
                <div className="grid grid-cols-3 gap-2">
                  {currentPlan !== "ruby" && (
                    <button
                      onClick={() => handleUpgrade("ruby")}
                      className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-center"
                    >
                      <Gem className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <span className="text-xs font-medium text-red-400">Ruby</span>
                    </button>
                  )}
                  {currentPlan !== "pro" && (
                    <button
                      onClick={() => handleUpgrade("pro")}
                      className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-center"
                    >
                      <Crown className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <span className="text-xs font-medium text-purple-400">Pro</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleUpgrade("diamond")}
                    className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-center"
                  >
                    <Diamond className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <span className="text-xs font-medium text-cyan-400">Diamond</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
            onClick={() => handleUpgrade("free")}
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
