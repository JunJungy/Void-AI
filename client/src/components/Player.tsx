import { Play, SkipBack, SkipForward, Volume2, Heart, Mic2 } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import cover from "@assets/generated_images/cyberpunk_city_neon_album_art.png";

export function Player() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="h-24 bg-card/95 backdrop-blur-xl border-t border-border fixed bottom-0 left-0 right-0 z-30 px-6 flex items-center justify-between">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-14 h-14 rounded-md overflow-hidden relative group">
          <img src={cover} alt="Now Playing" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        </div>
        <div>
          <h4 className="font-medium text-white text-sm">Neon Horizon</h4>
          <p className="text-xs text-muted-foreground">CyberVoid</p>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors ml-2">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
        <div className="flex items-center gap-6 mb-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <div className="flex gap-1 h-4 items-center">
                <div className="w-1 bg-black h-full" />
                <div className="w-1 bg-black h-full" />
              </div>
            ) : (
              <Play className="w-5 h-5 ml-1 fill-current" />
            )}
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">1:23</span>
          <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden relative group cursor-pointer">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-primary group-hover:bg-primary/80 transition-colors" />
          </div>
          <span className="text-xs text-muted-foreground font-mono">2:45</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="flex items-center justify-end gap-4 w-1/4">
        <button className="text-muted-foreground hover:text-foreground">
          <Mic2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 w-24">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
        </div>
      </div>
    </div>
  );
}
