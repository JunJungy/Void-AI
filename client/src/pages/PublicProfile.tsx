import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { Share2, Music, Copy, Check, Play } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PublicUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}

interface Track {
  id: string;
  title: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
  style?: string;
}

export default function PublicProfile() {
  const params = useParams<{ username: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery<{ user: PublicUser; tracks: Track[] }>({
    queryKey: ["publicProfile", params.username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${params.username}`);
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${data?.user.displayName || data?.user.username}'s Profile`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
      }
    } catch (e) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied!", description: "Profile link copied to clipboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="lg:pl-64 pb-32">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error || !data ? (
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-2">User not found</h1>
              <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
              <Link href="/" className="text-primary mt-4 inline-block">Go home</Link>
            </div>
          ) : (
            <>
              <div className="bg-card border border-white/5 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={data.user.avatarUrl || "https://cdn-icons-png.flaticon.com/512/2977/2977485.png"}
                      alt={data.user.username}
                      className="w-20 h-20 rounded-full border-2 border-primary/30"
                    />
                    <div>
                      <h1 className="text-2xl font-bold">{data.user.displayName || data.user.username}</h1>
                      <p className="text-muted-foreground">@{data.user.username}</p>
                      {data.user.bio && <p className="text-sm mt-2 max-w-md">{data.user.bio}</p>}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {data.tracks.length} tracks
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleShare}
                    data-testid="button-share-profile"
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copied ? "Copied!" : "Share"}
                  </button>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">Tracks</h2>
              {data.tracks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No tracks yet</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.tracks.map((track) => (
                    <Link
                      key={track.id}
                      href={`/track/${track.id}`}
                      className="group bg-card/50 hover:bg-card p-3 rounded-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-primary/10"
                      data-testid={`card-track-${track.id}`}
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                        <img
                          src={track.imageUrl || "https://via.placeholder.com/300"}
                          alt={track.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm truncate">{track.title}</h3>
                      {track.duration && (
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Player />
    </div>
  );
}
