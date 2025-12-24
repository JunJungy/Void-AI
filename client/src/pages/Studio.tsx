import { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { useAuth } from "@/lib/authContext";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Scissors,
  Layers,
  Wand2,
  Music2,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Lock,
  Sparkles,
  Crown,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Settings2
} from "lucide-react";

interface Track {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration?: number;
}

interface AudioTrack {
  id: string;
  name: string;
  audioBuffer: AudioBuffer | null;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: {
    reverb: number;
    delay: number;
    eq: { low: number; mid: number; high: number };
    compression: number;
  };
  startTime: number;
  endTime: number;
  color: string;
}

const TRACK_COLORS = [
  "bg-purple-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  ruby: 1,
  pro: 2,
  crystal: 3,
  diamond: 4,
};

export default function Studio() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { canAccessModelWithPlan } = useSubscription();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const userPlan = (user?.planType as PlanType) || "free";
  const hasAccess = PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY.crystal;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [zoom, setZoom] = useState(1);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [activeTab, setActiveTab] = useState("tracks");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  const { data: tracksData, isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ['/api/tracks'],
    queryFn: async () => {
      const res = await fetch('/api/tracks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tracks');
      return res.json();
    },
    enabled: isAuthenticated && hasAccess,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTrack = (track: Track) => {
    const newAudioTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      name: track.title,
      audioBuffer: null,
      volume: 100,
      pan: 0,
      muted: false,
      solo: false,
      effects: {
        reverb: 0,
        delay: 0,
        eq: { low: 0, mid: 0, high: 0 },
        compression: 0,
      },
      startTime: 0,
      endTime: track.duration || 180,
      color: TRACK_COLORS[audioTracks.length % TRACK_COLORS.length],
    };
    setAudioTracks([...audioTracks, newAudioTrack]);
    toast({ title: "Track added", description: `${track.title} added to the timeline` });
  };

  const handleRemoveTrack = (trackId: string) => {
    setAudioTracks(audioTracks.filter(t => t.id !== trackId));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }
  };

  const handleDuplicateTrack = (trackId: string) => {
    const track = audioTracks.find(t => t.id === trackId);
    if (track) {
      const newTrack: AudioTrack = {
        ...track,
        id: `track-${Date.now()}`,
        name: `${track.name} (Copy)`,
        color: TRACK_COLORS[(audioTracks.length) % TRACK_COLORS.length],
      };
      setAudioTracks([...audioTracks, newTrack]);
    }
  };

  const updateTrackEffect = (trackId: string, effect: string, value: number) => {
    setAudioTracks(audioTracks.map(t => {
      if (t.id === trackId) {
        if (effect.startsWith('eq.')) {
          const eqBand = effect.split('.')[1] as 'low' | 'mid' | 'high';
          return { ...t, effects: { ...t.effects, eq: { ...t.effects.eq, [eqBand]: value } } };
        }
        return { ...t, effects: { ...t.effects, [effect]: value } };
      }
      return t;
    }));
  };

  const selectedTrack = audioTracks.find(t => t.id === selectedTrackId);

  if (authLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-lg w-full bg-card/50 border-white/10">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Studio Access Required</h2>
                <p className="text-muted-foreground mb-6">
                  The Studio feature is available for Crystal plan subscribers and above. 
                  Upgrade to unlock advanced audio editing, effects, and multi-track mixing.
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-400 font-semibold">Crystal Plan</span>
                </div>
                <Link href="/billing">
                  <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-upgrade-studio">
                    Upgrade to Crystal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <Player />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold" data-testid="text-studio-title">Studio</h1>
                  <p className="text-xs text-muted-foreground">Advanced audio editing</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10" data-testid="button-undo">
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10" data-testid="button-redo">
                  <Redo2 className="w-4 h-4" />
                </Button>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} data-testid="button-zoom-out">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10" onClick={() => setZoom(Math.min(4, zoom + 0.25))} data-testid="button-zoom-in">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="h-6 w-px bg-white/10 mx-2" />
                <Button className="bg-primary hover:bg-primary/90" size="sm" data-testid="button-export">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
              <div className="flex-1 flex flex-col bg-card/30 rounded-xl border border-white/5 overflow-hidden">
                <div className="flex items-center gap-4 p-4 border-b border-white/5">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 border-0"
                    onClick={() => setIsPlaying(!isPlaying)}
                    data-testid="button-play"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentTime(Math.max(0, currentTime - 10))} data-testid="button-skip-back">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))} data-testid="button-skip-forward">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground font-mono">{formatTime(currentTime)}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground font-mono">{formatTime(duration)}</span>
                  </div>
                  
                  <div className="flex-1" />
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                      data-testid="button-mute"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={([v]) => { setVolume(v); setIsMuted(false); }}
                      max={100}
                      className="w-24"
                      data-testid="slider-volume"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  {audioTracks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center h-full text-center">
                      <Layers className="w-12 h-12 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No tracks yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Add tracks from your library to start editing
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {audioTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                            selectedTrackId === track.id
                              ? "border-primary bg-primary/10"
                              : "border-white/5 bg-white/5 hover:bg-white/10"
                          )}
                          onClick={() => setSelectedTrackId(track.id)}
                          data-testid={`track-${track.id}`}
                        >
                          <div className={cn("w-1 h-12 rounded-full", track.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{track.name}</span>
                              {track.muted && <span className="text-xs text-red-400">M</span>}
                              {track.solo && <span className="text-xs text-yellow-400">S</span>}
                            </div>
                            <div 
                              className="mt-2 h-8 rounded bg-white/10 relative overflow-hidden"
                              style={{ width: `${100 * zoom}%` }}
                            >
                              <div 
                                className={cn("absolute inset-y-0 rounded", track.color, "opacity-60")}
                                style={{ 
                                  left: `${(track.startTime / duration) * 100}%`,
                                  right: `${100 - (track.endTime / duration) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8"
                              onClick={(e) => { e.stopPropagation(); handleDuplicateTrack(track.id); }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 text-red-400 hover:text-red-300"
                              onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-white/5">
                  <Slider
                    value={[currentTime]}
                    onValueChange={([v]) => setCurrentTime(v)}
                    max={duration}
                    className="w-full"
                    data-testid="slider-timeline"
                  />
                </div>
              </div>

              <div className="w-80 flex flex-col bg-card/30 rounded-xl border border-white/5 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                  <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0">
                    <TabsTrigger value="tracks" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      <Music2 className="w-4 h-4 mr-2" />
                      Library
                    </TabsTrigger>
                    <TabsTrigger value="effects" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      <Wand2 className="w-4 h-4 mr-2" />
                      Effects
                    </TabsTrigger>
                    <TabsTrigger value="trim" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">
                      <Scissors className="w-4 h-4 mr-2" />
                      Trim
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="tracks" className="flex-1 overflow-auto p-4 m-0">
                    <div className="space-y-2">
                      {tracksLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : tracksData && tracksData.length > 0 ? (
                        tracksData.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center overflow-hidden">
                              {track.imageUrl ? (
                                <img src={track.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Music2 className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {track.duration ? formatTime(track.duration) : '--:--'}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8"
                              onClick={() => handleAddTrack(track)}
                              data-testid={`button-add-track-${track.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tracks in library</p>
                          <Link href="/create">
                            <Button variant="link" size="sm" className="mt-2">
                              Create a track
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="effects" className="flex-1 overflow-auto p-4 m-0">
                    {selectedTrack ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Track: {selectedTrack.name}
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">Reverb</Label>
                              <span className="text-xs text-muted-foreground">{selectedTrack.effects.reverb}%</span>
                            </div>
                            <Slider
                              value={[selectedTrack.effects.reverb]}
                              onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'reverb', v)}
                              max={100}
                              data-testid="slider-reverb"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">Delay</Label>
                              <span className="text-xs text-muted-foreground">{selectedTrack.effects.delay}%</span>
                            </div>
                            <Slider
                              value={[selectedTrack.effects.delay]}
                              onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'delay', v)}
                              max={100}
                              data-testid="slider-delay"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">Compression</Label>
                              <span className="text-xs text-muted-foreground">{selectedTrack.effects.compression}%</span>
                            </div>
                            <Slider
                              value={[selectedTrack.effects.compression]}
                              onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'compression', v)}
                              max={100}
                              data-testid="slider-compression"
                            />
                          </div>

                          <div className="pt-4 border-t border-white/5">
                            <Label className="text-xs mb-3 block">Equalizer</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <Slider
                                  value={[selectedTrack.effects.eq.low + 50]}
                                  onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'eq.low', v - 50)}
                                  max={100}
                                  orientation="vertical"
                                  className="h-20 mx-auto"
                                  data-testid="slider-eq-low"
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">Low</span>
                              </div>
                              <div className="text-center">
                                <Slider
                                  value={[selectedTrack.effects.eq.mid + 50]}
                                  onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'eq.mid', v - 50)}
                                  max={100}
                                  orientation="vertical"
                                  className="h-20 mx-auto"
                                  data-testid="slider-eq-mid"
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">Mid</span>
                              </div>
                              <div className="text-center">
                                <Slider
                                  value={[selectedTrack.effects.eq.high + 50]}
                                  onValueChange={([v]) => updateTrackEffect(selectedTrack.id, 'eq.high', v - 50)}
                                  max={100}
                                  orientation="vertical"
                                  className="h-20 mx-auto"
                                  data-testid="slider-eq-high"
                                />
                                <span className="text-xs text-muted-foreground mt-2 block">High</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">Volume</Label>
                              <span className="text-xs text-muted-foreground">{selectedTrack.volume}%</span>
                            </div>
                            <Slider
                              value={[selectedTrack.volume]}
                              onValueChange={([v]) => {
                                setAudioTracks(audioTracks.map(t => 
                                  t.id === selectedTrack.id ? { ...t, volume: v } : t
                                ));
                              }}
                              max={100}
                              className="mt-2"
                              data-testid="slider-track-volume"
                            />
                          </div>

                          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={selectedTrack.muted}
                                onCheckedChange={(checked) => {
                                  setAudioTracks(audioTracks.map(t => 
                                    t.id === selectedTrack.id ? { ...t, muted: checked } : t
                                  ));
                                }}
                                data-testid="switch-mute"
                              />
                              <Label className="text-xs">Mute</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={selectedTrack.solo}
                                onCheckedChange={(checked) => {
                                  setAudioTracks(audioTracks.map(t => 
                                    t.id === selectedTrack.id ? { ...t, solo: checked } : t
                                  ));
                                }}
                                data-testid="switch-solo"
                              />
                              <Label className="text-xs">Solo</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a track to apply effects</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="trim" className="flex-1 overflow-auto p-4 m-0">
                    {selectedTrack ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <Scissors className="w-4 h-4" />
                            Trim: {selectedTrack.name}
                          </h4>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">Start Point</Label>
                              <span className="text-xs text-muted-foreground">{formatTime(selectedTrack.startTime)}</span>
                            </div>
                            <Slider
                              value={[selectedTrack.startTime]}
                              onValueChange={([v]) => {
                                setAudioTracks(audioTracks.map(t => 
                                  t.id === selectedTrack.id ? { ...t, startTime: Math.min(v, t.endTime - 1) } : t
                                ));
                              }}
                              max={duration}
                              data-testid="slider-trim-start"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-xs">End Point</Label>
                              <span className="text-xs text-muted-foreground">{formatTime(selectedTrack.endTime)}</span>
                            </div>
                            <Slider
                              value={[selectedTrack.endTime]}
                              onValueChange={([v]) => {
                                setAudioTracks(audioTracks.map(t => 
                                  t.id === selectedTrack.id ? { ...t, endTime: Math.max(v, t.startTime + 1) } : t
                                ));
                              }}
                              max={duration}
                              data-testid="slider-trim-end"
                            />
                          </div>

                          <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Duration</span>
                              <span className="font-medium">{formatTime(selectedTrack.endTime - selectedTrack.startTime)}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 bg-white/5 border-white/10"
                              onClick={() => {
                                setAudioTracks(audioTracks.map(t => 
                                  t.id === selectedTrack.id ? { ...t, startTime: 0, endTime: duration } : t
                                ));
                              }}
                              data-testid="button-reset-trim"
                            >
                              Reset
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-primary"
                              data-testid="button-apply-trim"
                            >
                              Apply Trim
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Scissors className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Select a track to trim</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
        <Player />
      </main>
    </div>
  );
}
