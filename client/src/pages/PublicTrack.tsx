import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Share2, Copy, Check, Play, Pause, User, Calendar, Music, Home } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  title: string;
  prompt?: string;
  style?: string;
  lyrics?: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
  model: string;
  createdAt: string;
}

interface Creator {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export default function PublicTrack() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trackId = params.id;

  const { data, isLoading, error } = useQuery<{ track: Track; creator: Creator | null }>({
    queryKey: ["publicTrack", trackId],
    queryFn: async () => {
      if (!trackId) throw new Error("No track ID provided");
      const res = await fetch(`/api/tracks/${trackId}/public`);
      if (!res.ok) throw new Error("Track not found");
      return res.json();
    },
    enabled: !!trackId,
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.track.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied!", description: "Track link copied to clipboard" });
      }
    } catch (e) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Track link copied to clipboard" });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(data?.track.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Void AI</span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
            data-testid="button-try-void"
          >
            <Home className="w-4 h-4" />
            Try Void AI
          </Link>
        </div>
      </header>

      <main className="pb-16">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !data ? (
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-2">Track not found</h1>
              <p className="text-muted-foreground">This track doesn't exist or has been removed.</p>
              <Link href="/" className="text-primary mt-4 inline-block">Go home</Link>
            </div>
          ) : (
            <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
              <div className="relative">
                <img
                  src={data.track.imageUrl || "https://via.placeholder.com/600"}
                  alt={data.track.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-3xl font-bold mb-2">{data.track.title}</h1>
                  {data.creator && (
                    <Link
                      href={`/u/${data.creator.username}`}
                      className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                      data-testid="link-creator"
                    >
                      <img
                        src={data.creator.avatarUrl || "https://cdn-icons-png.flaticon.com/512/2977/2977485.png"}
                        alt={data.creator.username}
                        className="w-8 h-8 rounded-full border border-white/20"
                      />
                      <span>{data.creator.displayName || data.creator.username}</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={togglePlay}
                    disabled={!data.track.audioUrl}
                    data-testid="button-play-track"
                    className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 ml-1 fill-current" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{formatDuration(data.track.duration)}</div>
                  </div>
                  <button
                    onClick={handleShare}
                    data-testid="button-share-track"
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>

                <div className="space-y-4">
                  {data.track.style && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Style</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.track.style.split(",").map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-secondary/50 rounded-full text-sm"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.track.lyrics && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Lyrics</h3>
                      <pre className="whitespace-pre-wrap text-sm bg-secondary/30 p-4 rounded-lg max-h-48 overflow-y-auto">
                        {data.track.lyrics}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3" />
                      Model: {data.track.model}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(data.track.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Created with <Link href="/" className="text-primary hover:underline">Void AI</Link> - AI Music Generation</p>
        </div>
      </footer>
    </div>
  );
}
