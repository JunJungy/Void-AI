import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Wand2, Music2, Mic, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Create() {
  const [isInstrumental, setIsInstrumental] = useState(false);
  const [prompt, setPrompt] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Create New Track</h1>
            <p className="text-muted-foreground">Describe the song you want to create and let Void AI handle the rest.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-6 shadow-xl">
            {/* Mode Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/30 rounded-xl border border-white/5 gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isInstrumental ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                  <Music2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium">Instrumental Mode</h3>
                  <p className="text-sm text-muted-foreground">Generate music without vocals</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Switch checked={isInstrumental} onCheckedChange={setIsInstrumental} />
              </div>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <Label className="text-base font-medium flex items-center gap-2">
                Song Description <span className="text-red-500">*</span>
              </Label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cyberpunk synthwave track with driving bass, neon atmosphere, and aggressive drums..."
                className="w-full h-32 bg-secondary/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
              />
              <div className="flex gap-2 overflow-x-auto pb-2">
                {["Cyberpunk", "Lo-fi Chill", "Heavy Metal", "Piano Ballad", "Trap Beat"].map(style => (
                  <button 
                    key={style}
                    onClick={() => setPrompt(prev => prev ? `${prev}, ${style}` : style)}
                    className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-primary/20 hover:text-primary transition-colors border border-white/5 whitespace-nowrap"
                  >
                    + {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer w-fit transition-colors">
                <Settings2 className="w-4 h-4" />
                <span className="text-sm font-medium">Advanced Settings</span>
              </div>
            </div>

            {/* Create Button */}
            <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] flex items-center justify-center gap-2 text-lg">
              <Wand2 className="w-5 h-5" />
              Generate Track
              <span className="ml-2 text-xs font-normal bg-black/20 px-2 py-0.5 rounded text-white/80">10 Credits</span>
            </button>
          </div>
        </div>
      </main>

      <Player />
    </div>
  );
}
