import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/lib/playerContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Create from "@/pages/Create";
import Library from "@/pages/Library";
import Explore from "@/pages/Explore";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/library" component={Library} />
      <Route path="/explore" component={Explore} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PlayerProvider>
          <Toaster />
          <Router />
        </PlayerProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
