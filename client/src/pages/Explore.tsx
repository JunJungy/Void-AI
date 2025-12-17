import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { TRENDING_TRACKS } from "@/lib/data";
import { TrackCard } from "@/components/TrackCard";

const CATEGORIES = [
  { name: "Cyberpunk", color: "from-pink-500 to-rose-500" },
  { name: "Ambient", color: "from-blue-500 to-cyan-500" },
  { name: "Synthwave", color: "from-violet-500 to-purple-500" },
  { name: "Lo-Fi", color: "from-amber-500 to-orange-500" },
  { name: "Techno", color: "from-emerald-500 to-green-500" },
  { name: "Cinematic", color: "from-slate-500 to-gray-500" },
];

export default function Explore() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">Explore</h1>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat.name} className={`h-24 md:h-32 rounded-xl bg-gradient-to-br ${cat.color} p-4 flex items-end relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                <span className="font-bold text-white relative z-10 text-sm md:text-base">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Global Top 50 */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold">Global Top 50</h2>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {TRENDING_TRACKS.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </section>
      </main>

      <Player />
    </div>
  );
}
