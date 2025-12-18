import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Loader2, Music2 } from "lucide-react";
import { Link } from "wouter";
import { usePlayer } from "@/lib/playerContext";
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

const DEFAULT_COVERS = [cover1, cover2, cover3];

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

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  
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

  const coverImage = track.imageUrl || DEFAULT_COVERS[index % 3];

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
    </div>
  );
}

export default function Library() {
  const { data: tracks, isLoading, error } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks');
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
  });

  const successTracks = tracks?.filter(t => t.status === "SUCCESS") || [];
  const pendingTracks = tracks?.filter(t => t.status === "PENDING") || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8" data-testid="text-library-title">Your Library</h1>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="bg-secondary/50 border border-white/5 p-1 mb-8 w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="created" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">
              Created {tracks && tracks.length > 0 && `(${tracks.length})`}
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
                      <TrackRow key={track.id} track={track} index={index} />
                    ))}
                  </div>
                )}
                
                {successTracks.map((track, index) => (
                  <TrackRow key={track.id} track={track} index={index} />
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
    </div>
  );
}
