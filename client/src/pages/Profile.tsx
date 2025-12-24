import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { User, Settings, CreditCard, LogOut, ChevronRight, Gem, Crown, Diamond, Music2, Loader2, ExternalLink, Edit2, Check, X, Camera, Sparkles, Share2 } from "lucide-react";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { useAuth } from "@/lib/authContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
function generatePandaSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><ellipse cx="30" cy="25" rx="15" ry="15" fill="#1a1a1a"/><ellipse cx="70" cy="25" rx="15" ry="15" fill="#1a1a1a"/><circle cx="50" cy="55" r="30" fill="white"/><ellipse cx="38" cy="50" rx="10" ry="12" fill="#1a1a1a"/><ellipse cx="62" cy="50" rx="10" ry="12" fill="#1a1a1a"/><circle cx="38" cy="48" r="4" fill="white"/><circle cx="62" cy="48" r="4" fill="white"/><ellipse cx="50" cy="65" rx="6" ry="4" fill="#1a1a1a"/><path d="M44 72 Q50 78 56 72" stroke="#1a1a1a" stroke-width="2" fill="none"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
  crystal: { 
    name: "Crystal", 
    color: "text-blue-400", 
    icon: Sparkles,
    description: "Pro features + Studio audio editing",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
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
  const { user, isLoading: authLoading, isAuthenticated, logout, updateProfile } = useAuth();
  const { currentPlan, setPlan } = useSubscription();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const planType = (user?.planType || "free") as PlanType;
  const planInfo = PLAN_INFO[planType] || PLAN_INFO.free;
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

  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || user.username);
      setEditBio(user.bio || "");
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleCheckout = async (priceId: string, planType: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, planType, email: user?.email }),
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

  const handleSaveDisplayName = async () => {
    if (!editDisplayName.trim()) {
      toast({ title: "Error", description: "Display name cannot be empty", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    const { success, error } = await updateProfile({ displayName: editDisplayName.trim() });
    setIsSaving(false);
    
    if (success) {
      setIsEditingDisplayName(false);
      toast({ title: "Name Updated", description: "Your changes have been saved." });
    } else {
      toast({ title: "Error", description: error || "Failed to update name", variant: "destructive" });
    }
  };

  const handleSaveBio = async () => {
    setIsSaving(true);
    const { success, error } = await updateProfile({ bio: editBio.trim() });
    setIsSaving(false);
    
    if (success) {
      setIsEditingBio(false);
      toast({ title: "Bio Updated", description: "Your changes have been saved." });
    } else {
      toast({ title: "Error", description: error || "Failed to update bio", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const { success, error } = await updateProfile({ avatarUrl: base64 });
        setIsUploadingAvatar(false);
        
        if (success) {
          toast({ title: "Avatar Updated", description: "Your profile picture has been saved." });
        } else {
          toast({ title: "Error", description: error || "Failed to update avatar", variant: "destructive" });
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploadingAvatar(false);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center py-6">
            <label className="relative w-24 h-24 mb-4 group cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
                data-testid="input-avatar-upload"
              />
              <img
                src={user?.avatarUrl || generatePandaSvg("#8b5cf6")}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-primary/30"
                data-testid="img-avatar"
              />
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              {user?.isOwner && (
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full p-1">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
            </label>
            
            {/* Display Name */}
            {isEditingDisplayName ? (
              <div className="flex items-center gap-2 mb-2">
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-48 bg-card border-white/10 text-center"
                  data-testid="input-display-name"
                />
                <button onClick={handleSaveDisplayName} disabled={isSaving} className="p-1 text-green-400 hover:text-green-300">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => { setIsEditingDisplayName(false); setEditDisplayName(user?.displayName || user?.username || ""); }} className="p-1 text-red-400 hover:text-red-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold" data-testid="text-display-name">
                  {user?.displayName || user?.username}
                </h1>
                <button onClick={() => setIsEditingDisplayName(true)} className="p-1 text-muted-foreground hover:text-white">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">@{user?.username}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
            
            {/* Bio */}
            <div className="mt-4 w-full">
              {isEditingBio ? (
                <div className="space-y-2">
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="bg-card border-white/10 text-center resize-none"
                    rows={3}
                    maxLength={300}
                    data-testid="input-bio"
                  />
                  <div className="flex justify-center gap-2">
                    <button onClick={handleSaveBio} disabled={isSaving} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm">
                      Save
                    </button>
                    <button onClick={() => { setIsEditingBio(false); setEditBio(user?.bio || ""); }} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="text-sm text-muted-foreground hover:text-white transition-colors"
                >
                  {user?.bio || "Add a bio..."}
                </button>
              )}
            </div>
            
            {/* Share Profile Button */}
            <button
              onClick={async () => {
                const url = `${window.location.origin}/u/${user?.username}`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: `${user?.displayName || user?.username}'s Profile`, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast({ title: "Link copied!", description: "Your profile link has been copied" });
                  }
                } catch {
                  await navigator.clipboard.writeText(url);
                  toast({ title: "Link copied!", description: "Your profile link has been copied" });
                }
              }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
              data-testid="button-share-profile"
            >
              <Share2 className="w-4 h-4" />
              Share Profile
            </button>
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
                <p className="text-sm font-medium" data-testid="text-credits">
                  {user?.isOwner ? "Unlimited" : `${user?.credits ?? 0} Credits`}
                </p>
                <p className="text-xs text-muted-foreground">Available for generation</p>
              </div>
            </div>
          </div>

          {/* Upgrade Plans */}
          {planType !== "diamond" && (
            <div className="bg-card border border-white/5 rounded-2xl p-5">
              <h2 className="font-bold mb-4">Upgrade Your Plan</h2>
              
              {plansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : plansData?.plans && plansData.plans.length > 0 ? (
                <div className="space-y-3">
                  {plansData.plans.map((plan) => {
                    const planTypeKey = plan.metadata?.plan_type || plan.name.toLowerCase().replace(' plan', '');
                    const Icon = getPlanIcon(planTypeKey);
                    const price = plan.prices[0];
                    const isCurrentPlan = planType === planTypeKey;
                    
                    if (isCurrentPlan) return null;
                    
                    return (
                      <button
                        key={plan.id}
                        onClick={() => price && handleCheckout(price.id, planTypeKey)}
                        disabled={!price}
                        className={cn(
                          "w-full p-4 rounded-xl border transition-all text-left",
                          planTypeKey === 'ruby' && "bg-red-500/10 border-red-500/20 hover:bg-red-500/20",
                          planTypeKey === 'pro' && "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
                          planTypeKey === 'diamond' && "bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20",
                        )}
                        data-testid={`button-upgrade-${planTypeKey}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {Icon && <Icon className={cn("w-6 h-6", getPlanColor(planTypeKey))} />}
                            <div>
                              <h3 className={cn("font-bold", getPlanColor(planTypeKey))}>{plan.name}</h3>
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
            <Link 
              href="/settings"
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors border-b border-white/5"
              data-testid="link-settings"
            >
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Settings</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <Link 
              href="/billing"
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors border-b border-white/5"
              data-testid="link-billing"
            >
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left">Billing</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors text-red-400"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 text-left">Sign Out</span>
            </button>
          </div>
        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
