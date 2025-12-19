import { type User, type InsertUser, type Track, type InsertTrack, type UpdateProfile, users, tracks } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDiscordUser(user: { email: string; username: string; displayName: string; avatarUrl: string; discordId: string }): Promise<User>;
  linkDiscordToUser(userId: string, discordId: string): Promise<void>;
  updateUserProfile(id: string, updates: UpdateProfile): Promise<User | undefined>;
  updateUserPlan(id: string, planType: string): Promise<User | undefined>;
  updateUserCredits(id: string, credits: number): Promise<User | undefined>;
  updateUserFcmToken(id: string, fcmToken: string | null, enabled: boolean): Promise<User | undefined>;
  
  createTrack(track: InsertTrack): Promise<Track>;
  getTrack(id: string): Promise<Track | undefined>;
  getTrackByTaskId(taskId: string): Promise<Track | undefined>;
  getAllTracks(): Promise<Track[]>;
  getTracksByUserId(userId: string): Promise<Track[]>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  updateTrackByTaskId(taskId: string, updates: Partial<Track>): Promise<Track | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: string, updates: UpdateProfile): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserPlan(id: string, planType: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ planType }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserCredits(id: string, credits: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ credits }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createDiscordUser(userData: { email: string; username: string; displayName: string; avatarUrl: string; discordId: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: userData.email,
      username: userData.username,
      displayName: userData.displayName,
      avatarUrl: userData.avatarUrl,
      discordId: userData.discordId,
      planType: "free",
      credits: 10,
    }).returning();
    return user;
  }

  async linkDiscordToUser(userId: string, discordId: string): Promise<void> {
    await db.update(users).set({ discordId }).where(eq(users.id, userId));
  }

  async updateUserFcmToken(id: string, fcmToken: string | null, enabled: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ fcmToken, pushNotificationsEnabled: enabled }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db.insert(tracks).values(insertTrack).returning();
    return track;
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTrackByTaskId(taskId: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.taskId, taskId));
    return track || undefined;
  }

  async getAllTracks(): Promise<Track[]> {
    return db.select().from(tracks).orderBy(desc(tracks.createdAt));
  }

  async getTracksByUserId(userId: string): Promise<Track[]> {
    return db.select().from(tracks).where(eq(tracks.userId, userId)).orderBy(desc(tracks.createdAt));
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const [track] = await db.update(tracks).set(updates).where(eq(tracks.id, id)).returning();
    return track || undefined;
  }

  async updateTrackByTaskId(taskId: string, updates: Partial<Track>): Promise<Track | undefined> {
    const [track] = await db.update(tracks).set(updates).where(eq(tracks.taskId, taskId)).returning();
    return track || undefined;
  }
}

export const storage = new DatabaseStorage();
