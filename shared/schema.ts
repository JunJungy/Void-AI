import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url").default("https://cdn-icons-png.flaticon.com/512/2977/2977485.png"),
  bio: text("bio"),
  planType: text("plan_type").default("free"),
  isOwner: boolean("is_owner").default(false),
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

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(300).optional(),
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
  prompt: z.string().min(1).max(500),
  style: z.string().optional(),
  title: z.string().max(80).optional(),
  lyrics: z.string().max(5000).optional(),
  model: z.enum(["V4", "V4_5", "V4_5PLUS", "V5"]).default("V4"),
  instrumental: z.boolean().default(false),
  customMode: z.boolean().default(false),
  vocalGender: z.enum(["m", "f"]).optional(),
});

export type GenerateMusicInput = z.infer<typeof generateMusicSchema>;
