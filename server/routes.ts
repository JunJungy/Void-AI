import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMusicSchema, signupSchema, loginSchema, updateProfileSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { signup, login, getSessionUser, requireAuth } from "./auth";
import { getDiscordAuthUrl, exchangeCodeForToken, getDiscordUser, findOrCreateDiscordUser, isDiscordConfigured } from "./discord";
import crypto from "crypto";

const KIE_API_KEY = process.env.KIE_API_KEY;
const KIE_API_BASE = "https://api.kie.ai/api/v1";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password } = signupSchema.parse(req.body);
      const { user, error } = await signup(email, password);
      
      if (error) {
        return res.status(400).json({ error });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { user, error } = await login(email, password);
      
      if (error || !user) {
        return res.status(401).json({ error: error || "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user });
  });

  app.get("/api/auth/discord", (req, res) => {
    if (!isDiscordConfigured()) {
      return res.status(503).json({ error: "Discord login not configured" });
    }

    const state = crypto.randomBytes(16).toString("hex");
    req.session.discordState = state;

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${baseUrl}/api/auth/discord/callback`;
    
    const authUrl = getDiscordAuthUrl(redirectUri, state);
    res.json({ url: authUrl });
  });

  app.get("/api/auth/discord/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=no_code");
    }

    if (state !== req.session.discordState) {
      return res.redirect("/login?error=invalid_state");
    }

    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const redirectUri = `${baseUrl}/api/auth/discord/callback`;
      
      const tokens = await exchangeCodeForToken(code, redirectUri);
      const discordUser = await getDiscordUser(tokens.access_token);
      
      const { id: odId, isNew } = await findOrCreateDiscordUser({
        id: discordUser.id,
        username: discordUser.username,
        email: discordUser.email,
        avatar: discordUser.avatar,
      });

      req.session.userId = odId;
      delete req.session.discordState;

      res.redirect(isNew ? "/profile?welcome=true" : "/");
    } catch (error) {
      console.error("Discord callback error:", error);
      res.redirect("/login?error=discord_failed");
    }
  });

  app.get("/api/auth/discord/status", (_req, res) => {
    res.json({ configured: isDiscordConfigured() });
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const updates = updateProfileSchema.parse(req.body);
      const userId = req.session.userId!;

      if (updates.username) {
        const existing = await storage.getUserByUsername(updates.username);
        if (existing && existing.id !== userId) {
          return res.status(400).json({ error: "Username already taken" });
        }
      }

      const user = await storage.updateUserProfile(userId, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      if (!KIE_API_KEY) {
        return res.status(500).json({ error: "KIE_API_KEY not configured" });
      }

      const input = generateMusicSchema.parse(req.body);

      const requestBody: any = {
        prompt: input.customMode && input.lyrics ? input.lyrics : input.prompt,
        customMode: input.customMode,
        instrumental: input.instrumental,
        model: input.model,
        callBackUrl: "https://example.com/callback",
      };

      if (input.customMode) {
        requestBody.style = input.style || input.prompt;
        requestBody.title = input.title || "Untitled Track";
        if (input.vocalGender) {
          requestBody.vocalGender = input.vocalGender;
        }
      }

      const response = await fetch(`${KIE_API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.code !== 200) {
        return res.status(400).json({ 
          error: data.msg || "Failed to generate music",
          code: data.code 
        });
      }

      const track = await storage.createTrack({
        taskId: data.data.taskId,
        title: input.title || input.prompt.split(",")[0] || "Untitled Track",
        prompt: input.prompt,
        style: input.style,
        lyrics: input.lyrics,
        model: input.model,
        instrumental: input.instrumental,
        status: "PENDING",
      });

      res.json({ 
        success: true, 
        taskId: data.data.taskId,
        trackId: track.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Generate error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/task/:taskId", async (req, res) => {
    try {
      if (!KIE_API_KEY) {
        return res.status(500).json({ error: "KIE_API_KEY not configured" });
      }

      const { taskId } = req.params;

      const response = await fetch(`${KIE_API_BASE}/generate/record-info?taskId=${taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${KIE_API_KEY}`,
        },
      });

      const data = await response.json();

      if (data.code !== 200) {
        return res.status(400).json({ 
          error: data.msg || "Failed to get task status",
          code: data.code 
        });
      }

      const taskData = data.data;
      
      if (taskData.status === "SUCCESS" && taskData.response?.sunoData?.[0]) {
        const audioData = taskData.response.sunoData[0];
        
        await storage.updateTrackByTaskId(taskId, {
          audioUrl: audioData.audioUrl,
          imageUrl: audioData.imageUrl,
          duration: Math.round(audioData.duration),
          status: "SUCCESS",
        });
      } else if (taskData.status.includes("FAILED") || taskData.status.includes("ERROR")) {
        await storage.updateTrackByTaskId(taskId, {
          status: taskData.status,
          errorMessage: taskData.errorMessage || "Generation failed",
        });
      }

      res.json({
        taskId: taskData.taskId,
        status: taskData.status,
        tracks: taskData.response?.sunoData || [],
        errorMessage: taskData.errorMessage,
      });
    } catch (error) {
      console.error("Task status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/tracks", async (_req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      console.error("Get tracks error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/tracks/:id", async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.id);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      res.json(track);
    } catch (error) {
      console.error("Get track error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/stripe/config", async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Stripe config error:", error);
      res.status(500).json({ error: "Failed to get Stripe config" });
    }
  });

  app.get("/api/subscription/plans", async (_req, res) => {
    try {
      const products = await stripeService.listProductsWithPrices();
      
      const productsMap = new Map();
      for (const row of products) {
        const productId = (row as any).product_id;
        if (!productsMap.has(productId)) {
          productsMap.set(productId, {
            id: productId,
            name: (row as any).product_name,
            description: (row as any).product_description,
            metadata: (row as any).product_metadata,
            prices: []
          });
        }
        if ((row as any).price_id) {
          productsMap.get(productId).prices.push({
            id: (row as any).price_id,
            unit_amount: (row as any).unit_amount,
            currency: (row as any).currency,
            recurring: (row as any).recurring,
          });
        }
      }

      res.json({ plans: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Get plans error:", error);
      res.status(500).json({ error: "Failed to get subscription plans" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { priceId, planType, email } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const session = await stripeService.createCheckoutSession({
        priceId,
        customerEmail: email,
        successUrl: `${baseUrl}/profile?success=true&plan=${planType}`,
        cancelUrl: `${baseUrl}/profile?canceled=true`,
        mode: 'subscription',
        metadata: { planType },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/billing/portal", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, {
          userId: user.id,
          username: user.username,
        });
        customerId = customer.id;
        await storage.updateUserProfile(user.id, { stripeCustomerId: customerId });
      }

      const portalSession = await stripeService.createCustomerPortalSession(
        customerId,
        `${baseUrl}/billing`
      );

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Billing portal error:", error);
      res.status(500).json({ error: "Failed to create billing portal session" });
    }
  });

  return httpServer;
}
