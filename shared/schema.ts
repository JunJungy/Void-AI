import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url").default("https://cdn-icons-png.flaticon.com/512/2977/2977485.png"),
  bio: text("bio"),
  planType: text("plan_type").default("free"),
  previousPlanType: text("previous_plan_type"),
  planExpiresAt: timestamp("plan_expires_at"),
  credits: integer("credits").default(55),
  lastCreditRefresh: timestamp("last_credit_refresh").defaultNow(),
  isOwner: boolean("is_owner").default(false),
  isBanned: boolean("is_banned").default(false),
  discordId: text("discord_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  fcmToken: text("fcm_token"),
  pushNotificationsEnabled: boolean("push_notifications_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().max(300).optional(),
  stripeCustomerId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: text("task_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  prompt: text("prompt"),
  style: text("style"),
  lyrics: text("lyrics"),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"),
  duration: integer("duration"),
  model: text("model").notNull().default("V4"),
  instrumental: boolean("instrumental").default(false),
  status: text("status").notNull().default("PENDING"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

export const generateMusicSchema = z.object({
  prompt: z.string().min(1).max(10000),
  style: z.string().max(10000).optional(),
  title: z.string().max(80).optional(),
  lyrics: z.string().max(5000).optional(),
  model: z.enum(["V4", "V4_5", "V4_5PLUS", "V5"]).default("V4"),
  instrumental: z.boolean().default(false),
  customMode: z.boolean().default(false),
  vocalGender: z.enum(["m", "f"]).optional(),
});

export type GenerateMusicInput = z.infer<typeof generateMusicSchema>;

export const videoJobs = pgTable("video_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  trackId: varchar("track_id").references(() => tracks.id),
  runwayJobId: text("runway_job_id"),
  prompt: text("prompt").notNull(),
  style: text("style"),
  status: text("status").notNull().default("PENDING"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"),
  creditsCost: integer("credits_cost").default(25),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVideoJobSchema = createInsertSchema(videoJobs).omit({
  id: true,
  createdAt: true,
});

export type InsertVideoJob = z.infer<typeof insertVideoJobSchema>;
export type VideoJob = typeof videoJobs.$inferSelect;

export const generateVideoSchema = z.object({
  trackId: z.string().min(1),
  prompt: z.string().min(1).max(500),
  style: z.enum(["animated", "cinematic", "abstract", "realistic", "artistic"]).optional(),
});

export type GenerateVideoInput = z.infer<typeof generateVideoSchema>;

export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  planType: text("plan_type").notNull(),
  durationDays: integer("duration_days").notNull(),
  maxUses: integer("max_uses").default(1),
  currentUses: integer("current_uses").default(0),
  bonusCredits: integer("bonus_credits").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

export const codeRedemptions = pgTable("code_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  promoCodeId: varchar("promo_code_id").references(() => promoCodes.id).notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

export const insertCodeRedemptionSchema = createInsertSchema(codeRedemptions).omit({
  id: true,
  redeemedAt: true,
});

export type InsertCodeRedemption = z.infer<typeof insertCodeRedemptionSchema>;
export type CodeRedemption = typeof codeRedemptions.$inferSelect;

export const createPromoCodeSchema = z.object({
  code: z.string().min(3).max(30),
  planType: z.enum(["pro", "ruby", "diamond"]),
  durationDays: z.number().min(1).max(365),
  maxUses: z.number().min(1).max(10000).default(1),
  bonusCredits: z.number().min(0).default(0),
  expiresAt: z.string().optional(),
});

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;

export const redeemCodeSchema = z.object({
  code: z.string().min(1),
});

export type RedeemCodeInput = z.infer<typeof redeemCodeSchema>;
