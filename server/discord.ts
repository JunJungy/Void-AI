import { storage } from "./storage";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
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
    return "https://cdn-icons-png.flaticon.com/512/2977/2977485.png";
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

  const username = `${discordUser.username}_${Math.floor(Math.random() * 9999)}`;
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
