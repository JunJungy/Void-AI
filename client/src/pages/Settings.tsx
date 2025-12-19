import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { ArrowLeft, Bell, Volume2, Shield, Loader2, Ticket, Check, Gift } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission, disableNotifications, onForegroundMessage } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState<{ planType: string; expiresAt: string } | null>(null);

  const redeemCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/promo-codes/redeem", { code });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to redeem code");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setRedeemSuccess({ planType: data.planType, expiresAt: data.expiresAt });
      setPromoCode("");
      refreshUser?.();
      toast({
        title: "Code Redeemed!",
        description: `You now have ${data.planType} plan until ${format(new Date(data.expiresAt), "MMM d, yyyy")}${data.bonusCredits > 0 ? ` + ${data.bonusCredits} bonus credits!` : ""}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user?.pushNotificationsEnabled) {
      setPushNotifications(true);
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload: any) => {
      toast({
        title: payload.notification?.title || "Notification",
        description: payload.notification?.body || "You have a new notification",
      });
    });
    return () => unsubscribe();
  }, [toast]);

  const handleToggle = (setting: string, value: boolean) => {
    toast({ 
      title: "Setting Updated", 
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}.` 
    });
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    setPushLoading(true);
    try {
      if (enabled) {
        if (!("Notification" in window)) {
          toast({ 
            title: "Not Supported", 
            description: "Push notifications are not supported in this browser.",
            variant: "destructive"
          });
          setPushLoading(false);
          return;
        }

        const currentPermission = Notification.permission;
        if (currentPermission === "denied") {
          toast({ 
            title: "Notifications Blocked", 
            description: "Notifications are blocked. Please click the lock icon in your browser's address bar and allow notifications for this site.",
            variant: "destructive"
          });
          setPushLoading(false);
          return;
        }

        const token = await requestNotificationPermission();
        
        if (!token) {
          toast({ 
            title: "Setup Failed", 
            description: "Could not enable notifications. Check browser console for details.",
            variant: "destructive"
          });
          setPushLoading(false);
          return;
        }

        await apiRequest("POST", "/api/user/fcm-token", { 
          fcmToken: token, 
          enabled: true 
        });

        setPushNotifications(true);
        toast({ 
          title: "Notifications Enabled", 
          description: "You'll be notified when your tracks are ready!" 
        });
        refreshUser?.();
      } else {
        await disableNotifications();
        await apiRequest("POST", "/api/user/fcm-token", { 
          fcmToken: null, 
          enabled: false 
        });

        setPushNotifications(false);
        toast({ 
          title: "Notifications Disabled", 
          description: "You won't receive push notifications anymore." 
        });
        refreshUser?.();
      }
    } catch (error) {
      console.error("Push notification toggle error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    } finally {
      setPushLoading(false);
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
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile">
              <a className="p-2 hover:bg-secondary/50 rounded-lg transition-colors" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </a>
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Notifications</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates about your generations</p>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={(checked) => {
                    setEmailNotifications(checked);
                    handleToggle("Email notifications", checked);
                  }}
                  data-testid="switch-email-notifications"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="flex-1">
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when tracks are ready</p>
                </Label>
                <div className="flex items-center gap-2">
                  {pushLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  <Switch
                    id="push-notifications"
                    checked={pushNotifications}
                    disabled={pushLoading}
                    onCheckedChange={handlePushNotificationToggle}
                    data-testid="switch-push-notifications"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails" className="flex-1">
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive news and special offers</p>
                </Label>
                <Switch
                  id="marketing-emails"
                  checked={marketingEmails}
                  onCheckedChange={(checked) => {
                    setMarketingEmails(checked);
                    handleToggle("Marketing emails", checked);
                  }}
                  data-testid="switch-marketing-emails"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Audio</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="high-quality" className="flex-1">
                  <p className="font-medium">High Quality Audio</p>
                  <p className="text-sm text-muted-foreground">Stream in highest available quality</p>
                </Label>
                <Switch
                  id="high-quality"
                  checked={highQualityAudio}
                  onCheckedChange={(checked) => {
                    setHighQualityAudio(checked);
                    handleToggle("High quality audio", checked);
                  }}
                  data-testid="switch-high-quality"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-play" className="flex-1">
                  <p className="font-medium">Auto-Play</p>
                  <p className="text-sm text-muted-foreground">Automatically play generated tracks</p>
                </Label>
                <Switch
                  id="auto-play"
                  checked={autoPlay}
                  onCheckedChange={(checked) => {
                    setAutoPlay(checked);
                    handleToggle("Auto-play", checked);
                  }}
                  data-testid="switch-auto-play"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Account</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                </div>
              </div>

              {user?.discordId && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Discord</p>
                    <p className="text-sm text-green-400">Connected</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Redeem Promo Code</h2>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {(user as any)?.planExpiresAt && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm text-purple-400">
                    Your <span className="font-medium capitalize">{user?.planType}</span> plan expires on{" "}
                    <span className="font-medium">{format(new Date((user as any).planExpiresAt), "MMMM d, yyyy")}</span>
                  </p>
                </div>
              )}
              
              {redeemSuccess ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="font-medium text-green-400">Code Redeemed Successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enjoy your {redeemSuccess.planType} plan until {format(new Date(redeemSuccess.expiresAt), "MMMM d, yyyy")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Have a promo code? Enter it below to unlock premium features.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., VOID-XXXXX)"
                      className="bg-white/5 border-white/10 font-mono"
                      data-testid="input-promo-code"
                    />
                    <Button
                      onClick={() => redeemCodeMutation.mutate(promoCode)}
                      disabled={!promoCode || redeemCodeMutation.isPending}
                      className="bg-purple-600 hover:bg-purple-700"
                      data-testid="button-redeem-code"
                    >
                      {redeemCodeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
