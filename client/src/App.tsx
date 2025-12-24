import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/lib/playerContext";
import { SubscriptionProvider } from "@/lib/subscriptionContext";
import { AuthProvider } from "@/lib/authContext";
import { HolidayEffects } from "@/components/HolidayEffects";
import { detectHoliday } from "@/lib/holidays";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Admin from "@/pages/Admin";
import Studio from "@/pages/Studio";
import PublicProfile from "@/pages/PublicProfile";
import PublicTrack from "@/pages/PublicTrack";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import RefundPolicy from "@/pages/RefundPolicy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/library" component={Library} />
      <Route path="/explore" component={Explore} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/billing" component={Billing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin" component={Admin} />
      <Route path="/studio" component={Studio} />
      <Route path="/u/:username" component={PublicProfile} />
      <Route path="/track/:id" component={PublicTrack} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/refund" component={RefundPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const holiday = detectHoliday();
    if (holiday) {
      document.documentElement.classList.add(`holiday-${holiday}`);
    }
    return () => {
      document.documentElement.classList.remove(
        'holiday-christmas', 
        'holiday-halloween',
        'holiday-thanksgiving',
        'holiday-valentines',
        'holiday-newyear',
        'holiday-july4th',
        'holiday-stpatricks'
      );
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <PlayerProvider>
              <HolidayEffects />
              <Toaster />
              <Router />
            </PlayerProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
