import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { ArrowLeft, Bell, Volume2, Palette, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);

  const handleToggle = (setting: string, value: boolean) => {
    toast({ 
      title: "Setting Updated", 
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}.` 
    });
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
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={(checked) => {
                    setPushNotifications(checked);
                    handleToggle("Push notifications", checked);
                  }}
                  data-testid="switch-push-notifications"
                />
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
        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
