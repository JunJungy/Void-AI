import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/lib/playerContext";
import { SubscriptionProvider } from "@/lib/subscriptionContext";
import { AuthProvider } from "@/lib/authContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/library" component={Library} />
      <Route path="/explore" component={Explore} />
      <Route path="/profile" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <PlayerProvider>
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
