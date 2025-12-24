import { type User, type InsertUser, type Track, type InsertTrack, type UpdateProfile, type VideoJob, type InsertVideoJob, type PromoCode, type InsertPromoCode, type CodeRedemption, type InsertCodeRedemption, users, tracks, videoJobs, promoCodes, codeRedemptions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDiscordUser(user: { email: string; username: string; displayName: string; avatarUrl: string; discordId: string }): Promise<User>;
  linkDiscordToUser(userId: string, discordId: string): Promise<void>;
  updateUserProfile(id: string, updates: UpdateProfile): Promise<User | undefined>;
  updateUserPlan(id: string, planType: string, clearExpiration?: boolean): Promise<User | undefined>;
  updateUserCredits(id: string, credits: number): Promise<User | undefined>;
  updateUserFcmToken(id: string, fcmToken: string | null, enabled: boolean): Promise<User | undefined>;
  deductCredits(id: string, amount: number): Promise<User | undefined>;
  refreshUserCredits(id: string, credits: number): Promise<User | undefined>;
  
  createTrack(track: InsertTrack): Promise<Track>;
  getTrack(id: string): Promise<Track | undefined>;
  getTrackByTaskId(taskId: string): Promise<Track | undefined>;
  getAllTracks(): Promise<Track[]>;
  getTracksByUserId(userId: string): Promise<Track[]>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  updateTrackByTaskId(taskId: string, updates: Partial<Track>): Promise<Track | undefined>;
  
  createVideoJob(videoJob: InsertVideoJob): Promise<VideoJob>;
  getVideoJob(id: string): Promise<VideoJob | undefined>;
  getVideoJobByRunwayId(runwayJobId: string): Promise<VideoJob | undefined>;
  getVideoJobsByUserId(userId: string): Promise<VideoJob[]>;
  getVideoJobsByTrackId(trackId: string): Promise<VideoJob[]>;
  updateVideoJob(id: string, updates: Partial<VideoJob>): Promise<VideoJob | undefined>;
  
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  getPromoCode(id: string): Promise<PromoCode | undefined>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode | undefined>;
  deletePromoCode(id: string): Promise<void>;
  incrementPromoCodeUses(id: string): Promise<PromoCode | undefined>;
  
  createCodeRedemption(redemption: InsertCodeRedemption): Promise<CodeRedemption>;
  getCodeRedemptionByUserAndCode(userId: string, promoCodeId: string): Promise<CodeRedemption | undefined>;
  getRedemptionsByUserId(userId: string): Promise<CodeRedemption[]>;
  
  updateUserPlanWithExpiry(id: string, planType: string, expiresAt: Date, previousPlanType?: string): Promise<User | undefined>;
  addUserCredits(id: string, amount: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  banUser(id: string, isBanned: boolean): Promise<User | undefined>;
  setUserOwner(id: string, isOwner: boolean): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
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

  async updateUserPlan(id: string, planType: string, clearExpiration: boolean = false): Promise<User | undefined> {
    const updateData: any = { planType };
    if (clearExpiration) {
      updateData.planExpiresAt = null;
      updateData.previousPlanType = null;
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
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
      credits: 55,
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

  async deductCredits(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newCredits = Math.max(0, (user.credits || 0) - amount);
    const [updated] = await db.update(users).set({ credits: newCredits }).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async refreshUserCredits(id: string, credits: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ credits, lastCreditRefresh: new Date() }).where(eq(users.id, id)).returning();
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

  async createVideoJob(videoJob: InsertVideoJob): Promise<VideoJob> {
    const [job] = await db.insert(videoJobs).values(videoJob).returning();
    return job;
  }

  async getVideoJob(id: string): Promise<VideoJob | undefined> {
    const [job] = await db.select().from(videoJobs).where(eq(videoJobs.id, id));
    return job || undefined;
  }

  async getVideoJobByRunwayId(runwayJobId: string): Promise<VideoJob | undefined> {
    const [job] = await db.select().from(videoJobs).where(eq(videoJobs.runwayJobId, runwayJobId));
    return job || undefined;
  }

  async getVideoJobsByUserId(userId: string): Promise<VideoJob[]> {
    return db.select().from(videoJobs).where(eq(videoJobs.userId, userId)).orderBy(desc(videoJobs.createdAt));
  }

  async getVideoJobsByTrackId(trackId: string): Promise<VideoJob[]> {
    return db.select().from(videoJobs).where(eq(videoJobs.trackId, trackId)).orderBy(desc(videoJobs.createdAt));
  }

  async updateVideoJob(id: string, updates: Partial<VideoJob>): Promise<VideoJob | undefined> {
    const [job] = await db.update(videoJobs).set(updates).where(eq(videoJobs.id, id)).returning();
    return job || undefined;
  }

  async createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode> {
    const [code] = await db.insert(promoCodes).values(promoCode).returning();
    return code;
  }

  async getPromoCode(id: string): Promise<PromoCode | undefined> {
    const [code] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    return code || undefined;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [result] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
    return result || undefined;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode | undefined> {
    const [code] = await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id)).returning();
    return code || undefined;
  }

  async deletePromoCode(id: string): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async incrementPromoCodeUses(id: string): Promise<PromoCode | undefined> {
    const [code] = await db.update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(eq(promoCodes.id, id))
      .returning();
    return code || undefined;
  }

  async createCodeRedemption(redemption: InsertCodeRedemption): Promise<CodeRedemption> {
    const [result] = await db.insert(codeRedemptions).values(redemption).returning();
    return result;
  }

  async getCodeRedemptionByUserAndCode(userId: string, promoCodeId: string): Promise<CodeRedemption | undefined> {
    const [result] = await db.select().from(codeRedemptions)
      .where(and(eq(codeRedemptions.userId, userId), eq(codeRedemptions.promoCodeId, promoCodeId)));
    return result || undefined;
  }

  async getRedemptionsByUserId(userId: string): Promise<CodeRedemption[]> {
    return db.select().from(codeRedemptions).where(eq(codeRedemptions.userId, userId));
  }

  async updateUserPlanWithExpiry(id: string, planType: string, expiresAt: Date, previousPlanType?: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ planType, planExpiresAt: expiresAt, previousPlanType: previousPlanType || null })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async addUserCredits(id: string, amount: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    const newCredits = (user.credits || 0) + amount;
    const [updated] = await db.update(users).set({ credits: newCredits }).where(eq(users.id, id)).returning();
    return updated || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async banUser(id: string, isBanned: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isBanned }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async setUserOwner(id: string, isOwner: boolean): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isOwner }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(tracks).where(eq(tracks.userId, id));
    await db.delete(videoJobs).where(eq(videoJobs.userId, id));
    await db.delete(codeRedemptions).where(eq(codeRedemptions.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();
