import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Wand2, Music2, Mic, Settings2, Sparkles, ChevronDown, ChevronUp, Check, Lock, Gem, Crown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const AI_MODELS = [
  { id: "v1.5", name: "v1.5", description: "Legacy model. Creates basic, somewhat decent music.", plan: "free" },
  { id: "v2.5", name: "v2.5", description: "Improved structure and coherence. Better instrument separation.", plan: "ruby" },
  { id: "v3.5", name: "v3.5", description: "High fidelity audio. Can generate full songs up to 2 minutes.", plan: "ruby" },
  { id: "v4", name: "v4", description: "Professional quality. Complex arrangements and realistic vocals.", plan: "ruby" },
  { id: "v4.5", name: "v4.5", description: "Advanced composition. Best for multi-genre fusion.", plan: "pro" },
  { id: "v5", name: "v5", description: "State of the art. Ultra-realistic production and mastering.", plan: "pro" },
  { id: "v6", name: "v6", description: "Experimental. Next-gen neural synthesis engine.", plan: "pro" },
];

export default function Create() {
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"simple" | "custom">("custom");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const { toast } = useToast();

  const handleModelSelect = (model: typeof AI_MODELS[0]) => {
    if (model.plan !== "free") {
      // For mockup purposes, we'll just show a toast instead of blocking completely
      // or we could simulate being on a free plan.
      toast({
        title: `Upgrade to ${model.plan === "ruby" ? "Ruby" : "Pro"} Plan`,
        description: `The ${model.name} model requires a ${model.plan === "ruby" ? "Ruby" : "Pro"} subscription.`,
        variant: "destructive",
      });
      return; 
    }
    setSelectedModel(model);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-48 pt-6 px-4 md:px-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between mb-2">
             <h1 className="text-xl font-bold">Create</h1>
             <div className="p-2 rounded-full bg-secondary hover:bg-secondary/80 cursor-pointer">
               <ChevronDown className="w-5 h-5" />
             </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center justify-between gap-4">
             <div className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium flex items-center gap-2">
               <Music2 className="w-4 h-4" />
               <span>55</span>
             </div>

             <div className="flex bg-secondary/50 rounded-full p-1 border border-white/5">
                <button 
                  onClick={() => setMode("simple")}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    mode === "simple" ? "bg-secondary text-white shadow-sm" : "text-muted-foreground hover:text-white"
                  )}
                >
                  Simple
                </button>
                <button 
                  onClick={() => setMode("custom")}
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
                <button className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                  <span>{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 bg-card border border-white/10 p-2 rounded-xl shadow-xl max-h-[400px] overflow-y-auto z-50">
                {AI_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleModelSelect(model)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-lg cursor-pointer focus:bg-secondary/50 mb-1 relative overflow-hidden",
                      selectedModel.id === model.id ? "bg-secondary/50" : "hover:bg-secondary/30",
                      model.plan !== "free" && "opacity-90"
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
                         model.plan !== "free" && <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{model.description}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                      <Switch checked={isInstrumental} onCheckedChange={setIsInstrumental} />
                   </div>
                </div>
             </div>
          )}

          {/* Create Button - Sticky Bottom */}
          <div className="fixed bottom-20 left-0 right-0 px-4 py-4 bg-gradient-to-t from-background via-background to-transparent pointer-events-none lg:static lg:bg-none lg:p-0">
            <div className="max-w-md mx-auto pointer-events-auto">
              <button className="w-full py-4 bg-secondary hover:bg-secondary/80 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-black/50">
                <Wand2 className="w-5 h-5 opacity-50" />
                <span className="opacity-50">Create</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
