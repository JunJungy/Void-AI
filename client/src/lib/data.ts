import cover1 from "@assets/generated_images/cyberpunk_city_neon_album_art.png";
import cover2 from "@assets/generated_images/nebula_ethereal_album_art.png";
import cover3 from "@assets/generated_images/digital_glitch_abstract_art.png";

export interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: string;
  plays: string;
  tags: string[];
}

export const TRENDING_TRACKS: Track[] = [
  {
    id: "1",
    title: "Neon Horizon",
    artist: "CyberVoid",
    cover: cover1,
    duration: "2:45",
    plays: "1.2M",
    tags: ["Cyberpunk", "Synthwave", "Electronic"]
  },
  {
    id: "2",
    title: "Stardust Memories",
    artist: "Nebula Walker",
    cover: cover2,
    duration: "3:12",
    plays: "850K",
    tags: ["Ambient", "Space", "Chill"]
  },
  {
    id: "3",
    title: "System Failure",
    artist: "Glitch_God",
    cover: cover3,
    duration: "2:15",
    plays: "2.1M",
    tags: ["Glitch", "Industrial", "Bass"]
  },
  {
    id: "4",
    title: "Void Calling",
    artist: "The Empty",
    cover: cover2,
    duration: "4:01",
    plays: "500K",
    tags: ["Dark", "Drone", "Atmospheric"]
  },
   {
    id: "5",
    title: "Night City Run",
    artist: "Runner",
    cover: cover1,
    duration: "1:58",
    plays: "3.5M",
    tags: ["Retrowave", "Upbeat"]
  },
  {
    id: "6",
    title: "Digital Rain",
    artist: "Matrix Core",
    cover: cover3,
    duration: "3:30",
    plays: "900K",
    tags: ["Lo-fi", "Coding"]
  }
];

export const RECENT_TRACKS: Track[] = [
  {
    id: "101",
    title: "My First Song",
    artist: "User",
    cover: cover1,
    duration: "2:00",
    plays: "0",
    tags: ["Pop", "Happy"]
  }
];
