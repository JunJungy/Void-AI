import { Play, MoreHorizontal, Heart, Wand2, Lock } from "lucide-react";
import { Track } from "@/lib/data";
import { useLocation } from "wouter";
import { useSubscription } from "@/lib/subscriptionContext";
import { useToast } from "@/hooks/use-toast";

interface TrackCardProps {
  track: Track;
}

export function TrackCard({ track }: TrackCardProps) {
  const [, setLocation] = useLocation();
  const { canAccessModel } = useSubscription();
  const { toast } = useToast();
  const hasStudioAccess = canAccessModel("crystal");

  const handleStudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasStudioAccess) {
      setLocation("/studio");
    } else {
      toast({
        title: "Crystal Plan Required",
        description: "Upgrade to Crystal or higher to access the Studio editor.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="group relative bg-card/50 hover:bg-card p-4 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 border border-transparent hover:border-primary/10">
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
        <img src={track.cover} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
          <button className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform">
            <Play className="w-6 h-6 ml-1 fill-current" />
          </button>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button 
            onClick={handleStudioClick}
            className={`p-2 rounded-full text-white backdrop-blur-md ${hasStudioAccess ? 'bg-primary/70 hover:bg-primary' : 'bg-black/50 hover:bg-black/70'}`}
            title={hasStudioAccess ? "Edit in Studio" : "Crystal Plan Required"}
            data-testid={`button-studio-${track.id || 'track'}`}
          >
            {hasStudioAccess ? <Wand2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <button className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 backdrop-blur-md">
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="font-bold text-white truncate hover:text-primary transition-colors cursor-pointer">{track.title}</h3>
        <p className="text-sm text-muted-foreground truncate hover:text-white cursor-pointer transition-colors">{track.artist}</p>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {track.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground border border-white/5">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
