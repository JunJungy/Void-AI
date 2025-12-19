import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Wand2, Music2, Sparkles, ChevronDown, Check, Lock, Gem, Crown, Loader2, Play, Pause, Diamond } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSubscription, PlanType } from "@/lib/subscriptionContext";
import { useAuth } from "@/lib/authContext";
import { Link } from "wouter";
import cover1 from "@assets/generated_images/cyberpunk_city_neon_album_art.png";
import cover2 from "@assets/generated_images/nebula_ethereal_album_art.png";
import cover3 from "@assets/generated_images/digital_glitch_abstract_art.png";

const AI_MODELS = [
  { id: "V4", name: "v4", apiModel: "V4", description: "Great quality. Clear vocals and good instrument separation.", plan: "free" },
  { id: "V4_5", name: "v4.5", apiModel: "V4_5", description: "High quality. Complex arrangements and realistic vocals.", plan: "ruby" },
  { id: "V4_5PLUS", name: "v4.5+", apiModel: "V4_5PLUS", description: "Enhanced quality. Premium vocals with studio effects.", plan: "ruby" },
  { id: "V5", name: "v5", apiModel: "V5", description: "Best quality. State-of-the-art AI for professional tracks.", plan: "pro" },
];

const PLAN_NAMES: Record<PlanType, string> = {
  free: "Free",
  ruby: "Ruby",
  pro: "Pro",
  diamond: "Diamond",
};

const PLAN_COLORS: Record<PlanType, string> = {
  free: "text-muted-foreground",
  ruby: "text-red-400",
  pro: "text-purple-400",
  diamond: "text-cyan-400",
};

interface GeneratedTrack {
  id: string;
  taskId: string;
  title: string;
  status: string;
  audioUrl?: string;
  imageUrl?: string;
  duration?: number;
  style?: string;
}

const DEFAULT_COVERS = [cover1, cover2, cover3];

export default function Create() {
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"simple" | "custom">("custom");
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTrack, setGeneratedTrack] = useState<GeneratedTrack | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentPlan, setPlan, canAccessModel, getRequiredPlan } = useSubscription();
  
  const userPlan = (user?.planType as PlanType) || currentPlan;
  const userCredits = user?.credits ?? 55;

  const handleModelSelect = (model: typeof AI_MODELS[0]) => {
    const requiredPlan = getRequiredPlan(model.plan);
    
    if (requiredPlan) {
      const planName = requiredPlan === "ruby" ? "Ruby" : "Pro";
      toast({
        title: `Upgrade to ${planName} Plan`,
        description: `The ${model.name} model requires a ${planName} subscription to use.`,
        variant: "destructive",
      });
      return; 
    }
    setSelectedModel(model);
  };


  const pollTaskStatus = async (taskId: string) => {
    setIsPolling(true);
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      try {
        const response = await fetch(`/api/task/${taskId}`);
        const data = await response.json();

        if (data.status === "SUCCESS" && data.tracks?.[0]) {
          const track = data.tracks[0];
          setGeneratedTrack(prev => prev ? {
            ...prev,
            status: "SUCCESS",
            audioUrl: track.audioUrl,
            imageUrl: track.imageUrl,
            duration: Math.round(track.duration),
          } : null);
          setIsPolling(false);
          setIsGenerating(false);
          toast({
            title: "Track Generated!",
            description: "Your new song is ready to play.",
          });
          return;
        }

        if (data.status.includes("FAILED") || data.status.includes("ERROR")) {
          setIsPolling(false);
          setIsGenerating(false);
          toast({
            title: "Generation Failed",
            description: data.errorMessage || "Something went wrong. Please try again.",
            variant: "destructive",
          });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        } else {
          setIsPolling(false);
          setIsGenerating(false);
          toast({
            title: "Generation Timeout",
            description: "The generation is taking longer than expected. Please check your library later.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Polling error:", error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    poll();
  };

  const handleGenerate = async () => {
    if (!prompt && mode === "custom" && !lyrics) {
      toast({
        title: "Input required",
        description: "Please enter a style description or lyrics for your song.",
        variant: "destructive",
      });
      return;
    }

    if (!prompt && mode === "simple") {
      toast({
        title: "Description required",
        description: "Please describe the song you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedTrack(null);

    try {
      const requestBody = {
        prompt: prompt || "upbeat electronic music",
        style: prompt,
        title: title || prompt.split(",")[0] || "Untitled Track",
        lyrics: mode === "custom" ? lyrics : undefined,
        model: selectedModel.apiModel,
        instrumental: isInstrumental || (mode === "custom" && !lyrics),
        customMode: mode === "custom",
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start generation");
      }

      const newTrack: GeneratedTrack = {
        id: data.trackId,
        taskId: data.taskId,
        title: title || prompt.split(",")[0] || "Untitled Track",
        status: "PENDING",
        style: prompt,
      };

      setGeneratedTrack(newTrack);
      toast({
        title: "Generation Started",
        description: "Your track is being created. This may take a minute or two...",
      });

      pollTaskStatus(data.taskId);
    } catch (error) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start generation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!generatedTrack?.audioUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(generatedTrack.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-48 pt-6 px-4 md:px-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2">
             <h1 className="text-xl font-bold" data-testid="text-page-title">Create</h1>
             <div className="p-2 rounded-full bg-secondary hover:bg-secondary/80 cursor-pointer">
               <ChevronDown className="w-5 h-5" />
             </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center justify-between gap-4">
             <div className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium flex items-center gap-2">
               <Music2 className="w-4 h-4" />
               <span data-testid="text-credits">{userCredits.toLocaleString()}</span>
             </div>

             <div className="flex bg-secondary/50 rounded-full p-1 border border-white/5">
                <button 
                  onClick={() => setMode("simple")}
                  data-testid="button-mode-simple"
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    mode === "simple" ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Simple
                </button>
                <button 
                  onClick={() => setMode("custom")}
                  data-testid="button-mode-custom"
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    mode === "custom" ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Custom
                </button>
             </div>

             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  data-testid="button-model-selector"
                  className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors"
                >
                  <span>{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 bg-card border border-white/10 p-2 rounded-xl shadow-xl max-h-[400px] overflow-y-auto z-50">
                {AI_MODELS.map((model) => {
                  const hasAccess = canAccessModel(model.plan);
                  return (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() => handleModelSelect(model)}
                      data-testid={`button-model-${model.id}`}
                      className={cn(
                        "flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer focus:bg-secondary/50 mb-1 relative overflow-hidden",
                        selectedModel.id === model.id ? "bg-secondary/50" : "hover:bg-secondary/30",
                        !hasAccess && "opacity-70"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{model.name}</span>
                          {model.plan === "pro" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                              <Crown className="w-3 h-3" /> PRO
                            </span>
                          )}
                          {model.plan === "ruby" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <Gem className="w-3 h-3" /> RUBY
                            </span>
                          )}
                        </div>
                        {selectedModel.id === model.id ? (
                          <Check className="w-3 h-3 text-primary" />
                        ) : (
                          !hasAccess && <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground leading-tight">{model.description}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Plan Display */}
          <div className="bg-card/50 border border-white/5 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Your Plan:</span>
                <span className={cn("text-sm font-bold", PLAN_COLORS[userPlan])}>
                  {userPlan === "diamond" && <Diamond className="w-3 h-3 inline mr-1" />}
                  {userPlan === "pro" && <Crown className="w-3 h-3 inline mr-1" />}
                  {userPlan === "ruby" && <Gem className="w-3 h-3 inline mr-1" />}
                  {PLAN_NAMES[userPlan]}
                </span>
              </div>
              <Link href="/billing">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors cursor-pointer">
                  Upgrade
                </span>
              </Link>
            </div>
          </div>

          {mode === "custom" ? (
            <>
              {/* Lyrics Section */}
              <div className="bg-card border border-white/5 rounded-2xl p-4 min-h-[160px] flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-white/90">
                    <ChevronDown className="w-4 h-4" />
                    Lyrics
                  </div>
                  <div className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors">
                     <Sparkles className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <textarea 
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  data-testid="input-lyrics"
                  placeholder="Write some lyrics or a prompt — or leave blank for instrumental"
                  className="w-full flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none text-base leading-relaxed"
                />
              </div>

              {/* Style Section */}
              <div className="bg-card border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white/90 mb-3">
                   <ChevronDown className="w-4 h-4" />
                   Styles
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  data-testid="input-style"
                  placeholder="dungeon, turkish classical, bongo, frustration, electric"
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none text-base h-20 mb-4"
                />
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <div className="w-[2px] h-3 bg-white/20 mx-[1px]" />
                    <div className="w-[2px] h-4 bg-white/20 mx-[1px]" />
                    <div className="w-[2px] h-2 bg-white/20 mx-[1px]" />
                  </div>
                  {["ominous horrorcore rap", "calm voice", "heartfelt ballad"].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setPrompt(prev => prev ? `${prev}, ${tag}` : tag)}
                      data-testid={`button-tag-${tag.replace(/\s/g, '-')}`}
                      className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm whitespace-nowrap hover:bg-white/10 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Section */}
              <div className="bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                 <Music2 className="w-4 h-4 text-muted-foreground" />
                 <input 
                   type="text" 
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   data-testid="input-title"
                   placeholder="Song Title (Optional)"
                   className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                 />
              </div>
            </>
          ) : (
            /* Simple Mode */
             <div className="bg-card border border-white/5 rounded-2xl p-4 min-h-[200px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white/90">
                    Song Description
                  </div>
                  <div className="p-1.5 hover:bg-white/10 rounded-lg cursor-pointer">
                     <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  data-testid="input-description"
                  placeholder="A song about..."
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none text-base h-32"
                />
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                   <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs border border-white/5 flex items-center gap-1">
                        + Audio
                      </button>
                      <button className="px-3 py-1.5 rounded-full bg-secondary/50 text-xs border border-white/5 flex items-center gap-1">
                        + Lyrics
                      </button>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Instrumental</span>
                      <Switch 
                        checked={isInstrumental} 
                        onCheckedChange={setIsInstrumental} 
                        data-testid="switch-instrumental"
                      />
                   </div>
                </div>
             </div>
          )}

          {/* Generated Track Display */}
          {generatedTrack && (
            <div className="bg-card border border-primary/20 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {generatedTrack.status === "SUCCESS" ? "Just Created" : "Generating..."}
              </h3>
              <div className="flex items-center gap-4">
                <div 
                  className="relative w-16 h-16 rounded-lg overflow-hidden group cursor-pointer"
                  onClick={togglePlayback}
                  data-testid="button-play-preview"
                >
                  <img 
                    src={generatedTrack.imageUrl || DEFAULT_COVERS[Math.floor(Math.random() * 3)]} 
                    alt={generatedTrack.title} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {generatedTrack.status === "SUCCESS" ? (
                      isPlaying ? (
                        <Pause className="w-6 h-6 fill-white text-white" />
                      ) : (
                        <Play className="w-6 h-6 fill-white text-white" />
                      )
                    ) : (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate" data-testid="text-generated-title">{generatedTrack.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {generatedTrack.status === "SUCCESS" 
                      ? formatDuration(generatedTrack.duration)
                      : "Creating your track..."
                    }
                  </p>
                  {generatedTrack.style && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {generatedTrack.style.split(",").slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {isPolling && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>This usually takes 1-2 minutes...</span>
                </div>
              )}
            </div>
          )}

          {/* Create Button - Sticky Bottom */}
          <div className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none lg:static lg:bg-none lg:p-0 z-20">
            <div className="max-w-md mx-auto pointer-events-auto">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                data-testid="button-create"
                className={cn(
                  "w-full py-4 bg-primary hover:bg-primary/80 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-primary/30",
                  isGenerating && "opacity-80 cursor-wait"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
