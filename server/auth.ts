import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, type User } from "@shared/schema";
import type { Request, Response, NextFunction } from "express";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/2977/2977485.png";

function generateUsername(): string {
  const adjectives = ["void", "cosmic", "stellar", "neon", "cyber", "digital"];
  const nouns = ["panda", "artist", "creator", "maker", "dreamer", "star"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);
  return `${adj}_${noun}_${num}`;
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
      avatarUrl: DEFAULT_AVATAR,
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
  
  const user = await storage.createUser({
    email,
    username: "owner",
    password: hashedPassword,
    displayName,
    avatarUrl: DEFAULT_AVATAR,
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
