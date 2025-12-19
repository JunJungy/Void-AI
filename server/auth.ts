import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, type User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

const PANDA_COLORS = [
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
];

function generatePandaAvatar(): string {
  const color = PANDA_COLORS[Math.floor(Math.random() * PANDA_COLORS.length)];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><ellipse cx="30" cy="25" rx="15" ry="15" fill="#1a1a1a"/><ellipse cx="70" cy="25" rx="15" ry="15" fill="#1a1a1a"/><circle cx="50" cy="55" r="30" fill="white"/><ellipse cx="38" cy="50" rx="10" ry="12" fill="#1a1a1a"/><ellipse cx="62" cy="50" rx="10" ry="12" fill="#1a1a1a"/><circle cx="38" cy="48" r="4" fill="white"/><circle cx="62" cy="48" r="4" fill="white"/><ellipse cx="50" cy="65" rx="6" ry="4" fill="#1a1a1a"/><path d="M44 72 Q50 78 56 72" stroke="#1a1a1a" stroke-width="2" fill="none"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateUsername(): string {
  const suffixes = ["ava", "max", "kai", "zoe", "leo", "ivy", "rex", "mia", "ace", "sky", "ray", "fox", "neo", "eve", "ash"];
  const num = String(Math.floor(Math.random() * 99)).padStart(2, '0');
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `panda_${num}_${suffix}`;
}

export async function signup(email: string, password: string): Promise<{ user: Omit<User, "password">; error?: string }> {
  try {
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return { user: null as any, error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const username = generateUsername();

    const user = await storage.createUser({
      email,
      username,
      password: hashedPassword,
      displayName: username,
      avatarUrl: generatePandaAvatar(),
      planType: "free",
      isOwner: false,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  } catch (error: any) {
    if (error.message?.includes("unique")) {
      return { user: null as any, error: "Email or username already exists" };
    }
    throw error;
  }
}

export async function login(email: string, password: string): Promise<{ user: Omit<User, "password"> | null; error?: string }> {
  const user = await storage.getUserByEmail(email);
  if (!user) {
    return { user: null, error: "Invalid email or password" };
  }

  if (!user.password) {
    return { user: null, error: "Please login with Discord" };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return { user: null, error: "Invalid email or password" };
  }

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}

export async function createOwnerAccount(email: string, password: string, displayName: string): Promise<User | null> {
  const existing = await storage.getUserByEmail(email);
  if (existing) {
    console.log("Owner account already exists");
    return existing;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const username = generateUsername();
  
  const user = await storage.createUser({
    email,
    username,
    password: hashedPassword,
    displayName,
    avatarUrl: generatePandaAvatar(),
    planType: "diamond",
    isOwner: true,
  });

  console.log("Owner account created:", user.email);
  return user;
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    discordState?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function getSessionUser(req: Request): Promise<Omit<User, "password"> | null> {
  if (!req.session?.userId) {
    return null;
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
