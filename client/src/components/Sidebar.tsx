import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Library, Compass, Music, User } from "lucide-react";
import logo from "@assets/generated_images/void_ai_minimalist_logo_symbol.png";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: PlusCircle, label: "Create", href: "/create" },
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
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}>
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="px-4 py-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-900/20 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">Pro Plan</p>
            <p className="text-xs text-muted-foreground mb-3">500 credits remaining</p>
            <button className="w-full py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-white/5 z-40 lg:hidden pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        <Link href="/">
          <a className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/" ? "text-white" : "text-muted-foreground")}>
            <Home className={cn("w-6 h-6", location === "/" && "fill-current")} />
            <span className="text-[10px] font-medium">Home</span>
          </a>
        </Link>
        
        <Link href="/explore">
          <a className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/explore" ? "text-white" : "text-muted-foreground")}>
            <Compass className={cn("w-6 h-6", location === "/explore" && "fill-current")} />
            <span className="text-[10px] font-medium">Explore</span>
          </a>
        </Link>

        <Link href="/create">
          <a className="flex flex-col items-center gap-1 min-w-[64px] -mt-6">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
              location === "/create" 
                ? "bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.5)]" 
                : "bg-secondary text-white border border-white/10"
            )}>
              <Music className="w-6 h-6 fill-current" />
            </div>
            <span className={cn("text-[10px] font-medium", location === "/create" ? "text-white" : "text-muted-foreground")}>Create</span>
          </a>
        </Link>

        <Link href="/library">
          <a className={cn("flex flex-col items-center gap-1 p-2 min-w-[64px]", location === "/library" ? "text-white" : "text-muted-foreground")}>
            <Library className={cn("w-6 h-6", location === "/library" && "fill-current")} />
            <span className="text-[10px] font-medium">Library</span>
          </a>
        </Link>

        <button className="flex flex-col items-center gap-1 p-2 min-w-[64px] text-muted-foreground">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-400 p-[1px]">
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
               <User className="w-3 h-3 text-white" />
             </div>
          </div>
          <span className="text-[10px] font-medium">Me</span>
        </button>
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
