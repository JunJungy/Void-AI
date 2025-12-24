import { Play, SkipBack, SkipForward, Volume2, Heart, Mic2, Pause } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import cover from "@assets/generated_images/cyberpunk_city_neon_album_art.png";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/playerContext";

interface PlayerProps {
  className?: string;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function Player({ className }: PlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    togglePlayPause, 
    seek,
    setVolume 
  } = usePlayer();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    seek(percentage * duration);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className={cn(
      "h-16 md:h-24 bg-card/95 backdrop-blur-xl border-t border-border fixed left-0 right-0 z-30 px-4 md:px-6 py-2 md:py-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 transition-all duration-300",
      className || "bottom-0"
    )}>
      {/* Track Info */}
      <div className="flex items-center gap-4 w-full md:w-1/4">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden relative group flex-shrink-0">
          <img 
            src={currentTrack?.imageUrl || cover} 
            alt="Now Playing" 
            className="w-full h-full object-cover" 
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-1 bg-primary animate-pulse" style={{ height: '60%', animationDelay: '0ms' }} />
                <div className="w-1 bg-primary animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                <div className="w-1 bg-primary animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-white text-sm truncate" data-testid="text-player-title">
            {currentTrack?.title || "No track playing"}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack?.style || "Select a song to play"}
          </p>
        </div>
        <button className="text-muted-foreground hover:text-primary transition-colors ml-2">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center flex-1 w-full max-w-2xl px-0 md:px-4">
        <div className="flex items-center gap-6 mb-2">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipBack className="w-5 h-5" />
          </button>
          <button 
            onClick={togglePlayPause}
            disabled={!currentTrack}
            data-testid="button-player-toggle"
            className={cn(
              "w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform",
              !currentTrack && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 ml-1 fill-current" />
            )}
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3 hidden md:flex">
          <span className="text-xs text-muted-foreground font-mono w-10 text-right" data-testid="text-player-current-time">
            {formatTime(currentTime)}
          </span>
          <div 
            className="h-1 flex-1 bg-secondary rounded-full overflow-hidden relative group cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="absolute top-0 left-0 h-full bg-primary group-hover:bg-primary/80 transition-colors"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-mono w-10" data-testid="text-player-duration">
            {formatTime(duration)}
          </span>
        </div>

        {/* Mobile Progress Bar */}
        <div className="w-full flex items-center gap-2 md:hidden">
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(currentTime)}
          </span>
          <div 
            className="h-1 flex-1 bg-secondary rounded-full overflow-hidden"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume & Extras - Hidden on mobile */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/4">
        <button className="text-muted-foreground hover:text-foreground">
          <Mic2 className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 w-24">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Slider 
            value={[volume * 100]} 
            onValueChange={handleVolumeChange}
            max={100} 
            step={1} 
            className="w-full" 
          />
        </div>
      </div>
    </div>
  );
}
