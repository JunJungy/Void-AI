import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Library, Compass, Settings, LogOut } from "lucide-react";
import logo from "@assets/generated_images/void_ai_minimalist_logo_symbol.png";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: PlusCircle, label: "Create", href: "/create" },
    { icon: Library, label: "Library", href: "/library" },
    { icon: Compass, label: "Explore", href: "/explore" },
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
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
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>
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
}
