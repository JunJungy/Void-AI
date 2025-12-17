import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { TRENDING_TRACKS } from "@/lib/data";
import { TrackCard } from "@/components/TrackCard";
import { Play } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="pl-64 pb-28">
        {/* Hero Section */}
        <div className="relative h-[400px] w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/50 to-background z-10" />
          <div className="absolute inset-0 bg-[url('@assets/generated_images/nebula_ethereal_album_art.png')] bg-cover bg-center opacity-40 animate-pulse-slow" />
          
          <div className="relative z-20 h-full flex flex-col justify-center px-12 max-w-4xl">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 text-xs font-bold w-fit mb-4">
              FEATURED ARTIST
            </span>
            <h1 className="text-6xl font-display font-bold text-white mb-4 leading-tight">
              Create Music <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">From The Void</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Unleash your creativity with our advanced AI music engine. Generate studio-quality tracks in seconds, not hours.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Start Listening
              </button>
              <button className="px-8 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10">
                Create Song
              </button>
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="px-12 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Trending Now</h2>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">View All</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {TRENDING_TRACKS.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>

        {/* New Arrivals Section */}
        <div className="px-12 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold">Fresh Drops</h2>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors">View All</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...TRENDING_TRACKS].reverse().map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>
      </main>

      <Player />
    </div>
  );
}
