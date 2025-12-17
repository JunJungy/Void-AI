import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Wand2, Music2, Mic, Settings2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Create() {
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"simple" | "custom">("custom");
  const [showAdvanced, setShowAdvanced] = useState(false);

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

             <div className="px-3 py-1.5 rounded-full bg-secondary/50 border border-white/5 text-sm font-medium flex items-center gap-2">
               <span>v4.5-all</span>
               <ChevronDown className="w-3 h-3" />
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
