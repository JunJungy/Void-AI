import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Library, Compass, Music, User, Shield } from "lucide-react";
import logo from "@assets/generated_images/void_ai_minimalist_logo_symbol.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/authContext";

function generatePandaSvg(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><ellipse cx="30" cy="25" rx="15" ry="15" fill="#1a1a1a"/><ellipse cx="70" cy="25" rx="15" ry="15" fill="#1a1a1a"/><circle cx="50" cy="55" r="30" fill="white"/><ellipse cx="38" cy="50" rx="10" ry="12" fill="#1a1a1a"/><ellipse cx="62" cy="50" rx="10" ry="12" fill="#1a1a1a"/><circle cx="38" cy="48" r="4" fill="white"/><circle cx="62" cy="48" r="4" fill="white"/><ellipse cx="50" cy="65" rx="6" ry="4" fill="#1a1a1a"/><path d="M44 72 Q50 78 56 72" stroke="#1a1a1a" stroke-width="2" fill="none"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: PlusCircle, label: "Create", href: "/create" },
    ...(user?.isOwner ? [{ icon: Shield, label: "Admin", href: "/admin" }] : []),
  ];

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20 hidden lg:flex">
      <div className="p-6 flex items-center gap-3">
        <img src={logo} alt="Void AI" className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(124,58,237,0.5)]" />
        <span className="font-display font-bold text-xl tracking-tight text-white">VOID AI</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
                <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="px-4 py-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1 capitalize">
              {user?.planType || "Free"} Plan
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {user?.credits?.toLocaleString() || 0} credits remaining
            </p>
            {user?.planType !== "diamond" && (
              <button className="w-full py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
                Upgrade
              </button>
            )}
          </div>
        </div>
        <div className="px-4 pb-2 flex flex-wrap gap-x-3 gap-y-1 justify-center">
          <Link href="/privacy" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/terms" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link href="/refund" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Refunds</Link>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-white/5 z-40 lg:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        <Link href="/" className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/" ? "text-white" : "text-muted-foreground")}>
            <Home className={cn("w-6 h-6", location === "/" && "fill-current")} />
            <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link href="/explore" className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/explore" ? "text-white" : "text-muted-foreground")}>
            <Compass className={cn("w-6 h-6", location === "/explore" && "fill-current")} />
            <span className="text-[10px] font-medium">Explore</span>
        </Link>

        <Link href="/create" className="flex flex-col items-center gap-1 min-w-[64px] -mt-6">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
              location === "/create" 
                ? "bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]" 
                : "bg-secondary text-white border border-white/10"
            )}>
              <Music className="w-6 h-6 fill-current" />
            </div>
            <span className={cn("text-[10px] font-medium", location === "/create" ? "text-white" : "text-muted-foreground")}>Create</span>
        </Link>

        <Link href="/library" className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/library" ? "text-white" : "text-muted-foreground")}>
            <Library className={cn("w-6 h-6", location === "/library" && "fill-current")} />
            <span className="text-[10px] font-medium">Library</span>
        </Link>

        <Link href="/profile" className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/profile" ? "text-white" : "text-muted-foreground")}>
            <div className="w-6 h-6 rounded-full overflow-hidden border border-primary/30">
              <img 
                src={user?.avatarUrl || generatePandaSvg("#8b5cf6")} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[10px] font-medium">Me</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileNav />
    </>
  );
}
