import { storage } from "./storage";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

const PANDA_COLORS = [
  "#8b5cf6", "#ec4899", "#3b82f6", "#10b981",
  "#f59e0b", "#ef4444", "#06b6d4", "#f97316",
];

function generatePandaAvatar(): string {
  const color = PANDA_COLORS[Math.floor(Math.random() * PANDA_COLORS.length)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><ellipse cx="30" cy="25" rx="15" ry="15" fill="#1a1a1a"/><ellipse cx="70" cy="25" rx="15" ry="15" fill="#1a1a1a"/><circle cx="50" cy="55" r="30" fill="white"/><ellipse cx="38" cy="50" rx="10" ry="12" fill="#1a1a1a"/><ellipse cx="62" cy="50" rx="10" ry="12" fill="#1a1a1a"/><circle cx="38" cy="48" r="4" fill="white"/><circle cx="62" cy="48" r="4" fill="white"/><ellipse cx="50" cy="65" rx="6" ry="4" fill="#1a1a1a"/><path d="M44 72 Q50 78 56 72" stroke="#1a1a1a" stroke-width="2" fill="none"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

export function getDiscordAuthUrl(redirectUri: string, state: string): string {
  if (!DISCORD_CLIENT_ID) {
    throw new Error("Discord client ID not configured");
  }
  
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
    state,
  });
  
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}> {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    throw new Error("Discord credentials not configured");
  }

  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord token exchange failed: ${error}`);
  }

  return response.json();
}

export async function getDiscordUser(accessToken: string): Promise<{
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string;
  verified: boolean;
}> {
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get Discord user");
  }

  return response.json();
}

export function getDiscordAvatarUrl(userId: string, avatarHash: string | null): string {
  if (!avatarHash) {
    return generatePandaAvatar();
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
}

export async function findOrCreateDiscordUser(discordUser: {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
}): Promise<{ id: string; email: string; username: string; isNew: boolean }> {
  let user = await storage.getUserByDiscordId(discordUser.id);
  
  if (user) {
    return { id: user.id, email: user.email, username: user.username, isNew: false };
  }

  const existingEmail = await storage.getUserByEmail(discordUser.email);
  if (existingEmail) {
    await storage.linkDiscordToUser(existingEmail.id, discordUser.id);
    return { id: existingEmail.id, email: existingEmail.email, username: existingEmail.username, isNew: false };
  }

  const suffixes = ["ava", "max", "kai", "zoe", "leo", "ivy", "rex", "mia", "ace", "sky", "ray", "fox", "neo", "eve", "ash"];
  const num = String(Math.floor(Math.random() * 99)).padStart(2, '0');
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  const username = `panda_${num}_${suffix}`;
  const avatarUrl = getDiscordAvatarUrl(discordUser.id, discordUser.avatar);
  
  user = await storage.createDiscordUser({
    email: discordUser.email,
    username,
    displayName: discordUser.username,
    avatarUrl,
    discordId: discordUser.id,
  });

  return { id: user.id, email: user.email, username: user.username, isNew: true };
}

export function isDiscordConfigured(): boolean {
  return !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET);
}
