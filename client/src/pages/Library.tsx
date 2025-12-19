import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Pause, Loader2, Music2, Video, Film, X } from "lucide-react";
import { Link } from "wouter";
import { usePlayer } from "@/lib/playerContext";
import { useToast } from "@/hooks/use-toast";
import cover1 from "@assets/generated_images/cyberpunk_city_neon_album_art.png";
import cover2 from "@assets/generated_images/nebula_ethereal_album_art.png";
import cover3 from "@assets/generated_images/digital_glitch_abstract_art.png";

interface Track {
  id: string;
  taskId: string;
  title: string;
  prompt: string;
  style?: string;
  lyrics?: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
  model: string;
  instrumental: boolean;
  status: string;
  createdAt: string;
}

interface VideoJob {
  id: string;
  userId: string;
  trackId: string;
  runwayJobId?: string;
  prompt: string;
  style?: string;
  status: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  creditsCost: number;
  errorMessage?: string;
  createdAt: string;
}

interface VideoConfig {
  available: boolean;
  creditCost: number;
}

const DEFAULT_COVERS = [cover1, cover2, cover3];

const VIDEO_STYLES = [
  { value: "animated", label: "Animated" },
  { value: "cinematic", label: "Cinematic" },
  { value: "abstract", label: "Abstract" },
  { value: "realistic", label: "Realistic" },
  { value: "artistic", label: "Artistic" },
];

function formatDuration(seconds?: number) {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TrackRow({ 
  track, 
  index, 
  onCreateVideo,
  videoConfig
}: { 
  track: Track; 
  index: number;
  onCreateVideo: (track: Track) => void;
  videoConfig?: VideoConfig;
}) {
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const [imageError, setImageError] = useState(false);
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isThisPlaying = isCurrentTrack && isPlaying;

  const handlePlay = () => {
    if (!track.audioUrl) return;
    playTrack({
      id: track.id,
      title: track.title,
      style: track.style || track.prompt,
      audioUrl: track.audioUrl,
      imageUrl: track.imageUrl,
      duration: track.duration,
    });
  };

  const defaultCover = DEFAULT_COVERS[index % 3];
  const coverImage = imageError ? defaultCover : (track.imageUrl || defaultCover);

  const canCreateVideo = track.status === "SUCCESS" && track.imageUrl && videoConfig?.available;

  return (
    <div 
      className={`flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors group ${isCurrentTrack ? 'bg-secondary/20' : ''}`}
      data-testid={`track-row-${track.id}`}
    >
      <div 
        className="relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
        onClick={handlePlay}
      >
        <img 
          src={coverImage} 
          alt={track.title} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          {track.status === "SUCCESS" && track.audioUrl ? (
            isThisPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white" />
            )
          ) : track.status === "PENDING" ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Play className="w-5 h-5 fill-white/50 text-white/50" />
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className={`font-medium text-sm truncate ${isCurrentTrack ? 'text-primary' : ''}`} data-testid={`text-track-title-${track.id}`}>
          {track.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {track.style || track.prompt}
        </p>
      </div>
      
      <div className="hidden md:block text-xs text-muted-foreground">
        {formatDate(track.createdAt)}
      </div>
      
      <div className="text-xs text-muted-foreground w-12 text-right">
        {track.status === "SUCCESS" ? formatDuration(track.duration) : (
          <span className="text-yellow-500">{track.status}</span>
        )}
      </div>
      
      <div className="hidden sm:block">
        <span className="text-[10px] px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground uppercase">
          {track.model}
        </span>
      </div>

      {canCreateVideo && (
        <Button
          variant="ghost"
          size="sm"
          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          onClick={() => onCreateVideo(track)}
          data-testid={`button-create-video-${track.id}`}
        >
          <Video className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Video</span>
        </Button>
      )}
    </div>
  );
}

function VideoRow({ video, track }: { video: VideoJob; track?: Track }) {
  const [showPlayer, setShowPlayer] = useState(false);

  const statusColor = {
    PENDING: "text-yellow-500",
    PROCESSING: "text-blue-500",
    SUCCESS: "text-green-500",
    FAILED: "text-red-500",
  }[video.status] || "text-muted-foreground";

  return (
    <>
      <div 
        className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors group"
        data-testid={`video-row-${video.id}`}
      >
        <div 
          className="relative w-20 h-14 rounded-lg overflow-hidden cursor-pointer flex-shrink-0 bg-secondary/50"
          onClick={() => video.videoUrl && setShowPlayer(true)}
        >
          {video.videoUrl ? (
            <>
              <video 
                src={video.videoUrl} 
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {video.status === "PENDING" || video.status === "PROCESSING" ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Film className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">
            {track?.title || "Video"}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {video.prompt}
          </p>
        </div>
        
        <div className="hidden md:block text-xs text-muted-foreground">
          {formatDate(video.createdAt)}
        </div>
        
        <div className={`text-xs ${statusColor}`}>
          {video.status === "PENDING" && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Queued
            </span>
          )}
          {video.status === "PROCESSING" && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing
            </span>
          )}
          {video.status === "SUCCESS" && "Ready"}
          {video.status === "FAILED" && "Failed"}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {video.creditsCost} credits
        </div>

        {video.videoUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlayer(true)}
            data-testid={`button-play-video-${video.id}`}
          >
            <Play className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{track?.title || "Video"}</DialogTitle>
          </DialogHeader>
          {video.videoUrl && (
            <video 
              src={video.videoUrl} 
              controls 
              autoPlay
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateVideoModal({ 
  track, 
  open, 
  onClose,
  videoConfig
}: { 
  track: Track | null; 
  open: boolean; 
  onClose: () => void;
  videoConfig?: VideoConfig;
}) {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createVideoMutation = useMutation({
    mutationFn: async (data: { trackId: string; prompt: string; style?: string }) => {
      const res = await fetch("/api/videos/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create video");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Video generation started",
        description: "Your video will be ready in a few minutes.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      onClose();
      setPrompt("");
      setStyle("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create video",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!track || !prompt.trim()) return;
    createVideoMutation.mutate({
      trackId: track.id,
      prompt: prompt.trim(),
      style: style || undefined,
    });
  };

  useEffect(() => {
    if (track && open) {
      setPrompt(`Music video for "${track.title}" - ${track.style || track.prompt}`);
    }
  }, [track, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Music Video</DialogTitle>
          <DialogDescription>
            Generate an AI video based on your track's cover art. This will cost {videoConfig?.creditCost || 25} credits.
          </DialogDescription>
        </DialogHeader>

        {track && (
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <img 
              src={track.imageUrl || DEFAULT_COVERS[0]} 
              alt={track.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.style || track.prompt}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video-prompt">Video Description</Label>
            <Textarea
              id="video-prompt"
              placeholder="Describe the motion and style for your video..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-video-prompt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-style">Visual Style (optional)</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger id="video-style" data-testid="select-video-style">
                <SelectValue placeholder="Choose a style..." />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-video">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!prompt.trim() || createVideoMutation.isPending}
            data-testid="button-submit-video"
          >
            {createVideoMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Video className="w-4 h-4 mr-2" />
                Create Video ({videoConfig?.creditCost || 25} credits)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Library() {
  const queryClient = useQueryClient();
  const [selectedTrackForVideo, setSelectedTrackForVideo] = useState<Track | null>(null);
  
  const { data: tracks, isLoading, error } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
  });

  const { data: videos, isLoading: videosLoading } = useQuery<VideoJob[]>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const res = await fetch('/api/videos', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch videos');
      return res.json();
    },
  });

  const { data: videoConfig } = useQuery<VideoConfig>({
    queryKey: ['/api/video-config'],
    queryFn: async () => {
      const res = await fetch('/api/video-config', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch video config');
      return res.json();
    },
  });

  const successTracks = tracks?.filter(t => t.status === "SUCCESS") || [];
  const pendingTracks = tracks?.filter(t => t.status === "PENDING") || [];

  const pendingVideos = videos?.filter(v => v.status === "PENDING" || v.status === "PROCESSING") || [];

  const pollPendingTracks = useCallback(async () => {
    if (pendingTracks.length === 0) return;
    
    for (const track of pendingTracks) {
      try {
        const response = await fetch(`/api/task/${track.taskId}`);
        const data = await response.json();
        
        if (data.status === "SUCCESS" || data.status?.includes("FAILED")) {
          queryClient.invalidateQueries({ queryKey: ['/api/tracks'] });
          break;
        }
      } catch (error) {
        console.error("Polling error for track:", track.taskId, error);
      }
    }
  }, [pendingTracks, queryClient]);

  const pollPendingVideos = useCallback(async () => {
    if (pendingVideos.length === 0) return;
    
    for (const video of pendingVideos) {
      try {
        const response = await fetch(`/api/videos/${video.id}/status`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.status === "SUCCESS" || data.status === "FAILED") {
          queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
          break;
        }
      } catch (error) {
        console.error("Polling error for video:", video.id, error);
      }
    }
  }, [pendingVideos, queryClient]);

  useEffect(() => {
    if (pendingTracks.length === 0) return;
    
    pollPendingTracks();
    const interval = setInterval(pollPendingTracks, 5000);
    
    return () => clearInterval(interval);
  }, [pendingTracks.length, pollPendingTracks]);

  useEffect(() => {
    if (pendingVideos.length === 0) return;
    
    pollPendingVideos();
    const interval = setInterval(pollPendingVideos, 10000);
    
    return () => clearInterval(interval);
  }, [pendingVideos.length, pollPendingVideos]);

  const tracksById = tracks?.reduce((acc, t) => ({ ...acc, [t.id]: t }), {} as Record<string, Track>) || {};

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8" data-testid="text-library-title">Your Library</h1>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="bg-secondary/50 border border-white/5 p-1 mb-8 w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="created" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">
              Tracks {tracks && tracks.length > 0 && `(${tracks.length})`}
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">
              Videos {videos && videos.length > 0 && `(${videos.length})`}
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">Liked Songs</TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">Playlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>Failed to load tracks</p>
              </div>
            ) : tracks && tracks.length > 0 ? (
              <div className="space-y-2">
                {pendingTracks.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-yellow-500 mb-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating ({pendingTracks.length})
                    </h3>
                    {pendingTracks.map((track, index) => (
                      <TrackRow 
                        key={track.id} 
                        track={track} 
                        index={index}
                        onCreateVideo={setSelectedTrackForVideo}
                        videoConfig={videoConfig}
                      />
                    ))}
                  </div>
                )}
                
                {successTracks.map((track, index) => (
                  <TrackRow 
                    key={track.id} 
                    track={track} 
                    index={index}
                    onCreateVideo={setSelectedTrackForVideo}
                    videoConfig={videoConfig}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                <Music2 className="w-12 h-12 mb-4 opacity-30" />
                <p>No tracks created yet.</p>
                <Link href="/create">
                  <button className="mt-4 text-primary hover:underline" data-testid="link-create-first">
                    Create your first song
                  </button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : videos && videos.length > 0 ? (
              <div className="space-y-2">
                {pendingVideos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-yellow-500 mb-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing ({pendingVideos.length})
                    </h3>
                    {pendingVideos.map((video) => (
                      <VideoRow key={video.id} video={video} track={tracksById[video.trackId]} />
                    ))}
                  </div>
                )}
                
                {videos.filter(v => v.status === "SUCCESS" || v.status === "FAILED").map((video) => (
                  <VideoRow key={video.id} video={video} track={tracksById[video.trackId]} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                <Film className="w-12 h-12 mb-4 opacity-30" />
                <p>No videos created yet.</p>
                <p className="text-sm mt-2">Create a video from any of your finished tracks.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="liked">
            <div className="text-center py-20 text-muted-foreground">
              <p>No liked songs yet. Like songs to add them here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="playlists">
            <div className="text-center py-20 text-muted-foreground">
              <p>No playlists yet.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Player className="bottom-16 lg:bottom-0" />

      <CreateVideoModal
        track={selectedTrackForVideo}
        open={!!selectedTrackForVideo}
        onClose={() => setSelectedTrackForVideo(null)}
        videoConfig={videoConfig}
      />
    </div>
  );
}
