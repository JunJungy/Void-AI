import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { RECENT_TRACKS, TRENDING_TRACKS } from "@/lib/data";
import { TrackCard } from "@/components/TrackCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Library() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Sidebar />
      
      <main className="lg:pl-64 pb-28 pt-8 px-6 md:px-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-8">Your Library</h1>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="bg-secondary/50 border border-white/5 p-1 mb-8 w-full md:w-auto flex overflow-x-auto">
            <TabsTrigger value="created" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">Created</TabsTrigger>
            <TabsTrigger value="liked" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">Liked Songs</TabsTrigger>
            <TabsTrigger value="playlists" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white">Playlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {RECENT_TRACKS.map(track => (
                <TrackCard key={track.id} track={track} />
              ))}
              
              {/* Empty State Placeholder if needed */}
              {RECENT_TRACKS.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                  <p>No tracks created yet.</p>
                  <button className="mt-4 text-primary hover:underline">Create your first song</button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="liked">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {TRENDING_TRACKS.slice(0, 3).map(track => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="playlists">
            <div className="text-muted-foreground">No playlists found.</div>
          </TabsContent>
        </Tabs>
      </main>

      <Player className="bottom-16 lg:bottom-0" />
    </div>
  );
}
