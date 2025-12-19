import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMusicSchema, signupSchema, loginSchema, updateProfileSchema, generateVideoSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { signup, login, getSessionUser, requireAuth } from "./auth";
import { getDiscordAuthUrl, exchangeCodeForToken, getDiscordUser, findOrCreateDiscordUser, isDiscordConfigured } from "./discord";
import crypto from "crypto";
import { sendPushNotification } from "./firebaseAdmin";
import { createVideoGeneration, getVideoGenerationStatus, isRunwayConfigured } from "./runwayService";

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

  app.post("/api/user/fcm-token", requireAuth, async (req, res) => {
    try {
      const { fcmToken, enabled } = req.body;
      const userId = req.session.userId!;

      const user = await storage.updateUserFcmToken(userId, fcmToken, enabled);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("FCM token update error:", error);
      res.status(500).json({ error: "Failed to update FCM token" });
    }
  });

  app.post("/api/generate", requireAuth, async (req, res) => {
    try {
      if (!KIE_API_KEY) {
        return res.status(500).json({ error: "KIE_API_KEY not configured" });
      }

      const input = generateMusicSchema.parse(req.body);
      const userId = req.session.userId!;

      // Get user and check/refresh credits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if 24 hours passed, refresh credits
      const PLAN_CREDITS: Record<string, number> = { free: 55, ruby: 2500, pro: 5000, diamond: 999999 };
      const lastRefresh = user.lastCreditRefresh ? new Date(user.lastCreditRefresh) : new Date(0);
      const hoursSinceRefresh = (Date.now() - lastRefresh.getTime()) / (1000 * 60 * 60);

      if (hoursSinceRefresh >= 24) {
        const planCredits = PLAN_CREDITS[user.planType || "free"] || 55;
        await storage.refreshUserCredits(userId, planCredits);
        user.credits = planCredits;
      }

      // Check if user has enough credits
      const CREDITS_PER_SONG = 2;
      if ((user.credits || 0) < CREDITS_PER_SONG) {
        return res.status(403).json({ 
          error: "Insufficient credits",
          creditsRequired: CREDITS_PER_SONG,
          creditsAvailable: user.credits || 0
        });
      }

      // Deduct credits
      await storage.deductCredits(userId, CREDITS_PER_SONG);

      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const baseUrl = replitDomain ? `https://${replitDomain}` : 'http://localhost:5000';
      console.log("Using callback URL base:", baseUrl);
      
      const requestBody: any = {
        prompt: input.customMode && input.lyrics ? input.lyrics : input.prompt,
        customMode: input.customMode,
        instrumental: input.instrumental,
        model: input.model,
        callBackUrl: `${baseUrl}/api/music-callback`,
      };
      console.log("Callback URL:", requestBody.callBackUrl);

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
        userId: userId,
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

  // Callback endpoint for KIE API to notify when music generation completes
  app.post("/api/music-callback", async (req, res) => {
    try {
      console.log("Music callback received:", JSON.stringify(req.body));
      const data = req.body;
      
      if (data.taskId && data.status === "SUCCESS" && data.data?.sunoData?.[0]) {
        const audioData = data.data.sunoData[0];
        const track = await storage.getTrackByTaskId(data.taskId);
        
        await storage.updateTrackByTaskId(data.taskId, {
          title: audioData.title || undefined,
          audioUrl: audioData.audioUrl,
          imageUrl: audioData.imageUrl,
          duration: Math.round(audioData.duration),
          status: "SUCCESS",
        });
        console.log("Track updated via callback:", data.taskId);

        if (track?.userId) {
          const user = await storage.getUser(track.userId);
          if (user && user.pushNotificationsEnabled && user.fcmToken) {
            const trackTitle = audioData.title || track.title || "Your track";
            await sendPushNotification(
              user.fcmToken,
              "Your track is ready!",
              `"${trackTitle}" has finished generating.`,
              { url: `/library`, trackId: track.id }
            );
            console.log("Push notification sent to user:", user.id);
          }
        }
      } else if (data.taskId && (data.status?.includes("FAILED") || data.status?.includes("ERROR"))) {
        await storage.updateTrackByTaskId(data.taskId, {
          status: data.status,
          errorMessage: data.errorMessage || "Generation failed",
        });
        console.log("Track failed via callback:", data.taskId);

        const track = await storage.getTrackByTaskId(data.taskId);
        if (track?.userId) {
          const user = await storage.getUser(track.userId);
          if (user && user.pushNotificationsEnabled && user.fcmToken) {
            await sendPushNotification(
              user.fcmToken,
              "Track generation failed",
              `There was an issue generating your track. Please try again.`,
              { url: `/library`, trackId: track.id }
            );
          }
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Music callback error:", error);
      res.status(500).json({ error: "Callback processing failed" });
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

  app.get("/api/billing/summary", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.stripeCustomerId) {
        return res.json({ 
          hasSubscription: false,
          paymentMethod: null,
          subscription: null
        });
      }

      const [paymentMethods, subscriptions] = await Promise.all([
        stripeService.getCustomerPaymentMethods(user.stripeCustomerId),
        stripeService.getCustomerSubscriptions(user.stripeCustomerId),
      ]);

      const activeSubscription = subscriptions[0] as any || null;
      const defaultPaymentMethod = paymentMethods[0] || null;

      res.json({
        hasSubscription: !!activeSubscription,
        paymentMethod: defaultPaymentMethod ? {
          brand: defaultPaymentMethod.card?.brand,
          last4: defaultPaymentMethod.card?.last4,
          expMonth: defaultPaymentMethod.card?.exp_month,
          expYear: defaultPaymentMethod.card?.exp_year,
        } : null,
        subscription: activeSubscription ? {
          status: activeSubscription.status,
          currentPeriodEnd: activeSubscription.current_period_end,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
        } : null,
      });
    } catch (error) {
      console.error("Billing summary error:", error);
      res.status(500).json({ error: "Failed to get billing summary" });
    }
  });

  const VIDEO_CREDIT_COST = 25;

  app.post("/api/videos/generate", requireAuth, async (req, res) => {
    try {
      if (!isRunwayConfigured()) {
        return res.status(503).json({ error: "Video generation service not configured" });
      }

      const { trackId, prompt, style } = generateVideoSchema.parse(req.body);
      const userId = req.session.userId!;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if ((user.credits || 0) < VIDEO_CREDIT_COST) {
        return res.status(402).json({ 
          error: "Insufficient credits", 
          required: VIDEO_CREDIT_COST, 
          available: user.credits || 0 
        });
      }

      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      if (track.userId !== userId) {
        return res.status(403).json({ error: "You don't own this track" });
      }

      if (!track.imageUrl) {
        return res.status(400).json({ error: "Track has no cover image for video generation" });
      }

      const fullPrompt = style ? `${style} style: ${prompt}` : prompt;
      const { taskId, error } = await createVideoGeneration(track.imageUrl, fullPrompt);

      if (error || !taskId) {
        return res.status(500).json({ error: error || "Failed to start video generation" });
      }

      await storage.deductCredits(userId, VIDEO_CREDIT_COST);

      const videoJob = await storage.createVideoJob({
        userId,
        trackId,
        runwayJobId: taskId,
        prompt: fullPrompt,
        style: style || null,
        status: "PENDING",
        creditsCost: VIDEO_CREDIT_COST,
      });

      res.json({ videoJob });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      console.error("Video generation error:", error);
      res.status(500).json({ error: "Failed to start video generation" });
    }
  });

  app.get("/api/videos", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const videos = await storage.getVideoJobsByUserId(userId);
      res.json(videos);
    } catch (error) {
      console.error("Get videos error:", error);
      res.status(500).json({ error: "Failed to get videos" });
    }
  });

  app.get("/api/videos/:id", requireAuth, async (req, res) => {
    try {
      const video = await storage.getVideoJob(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      if (video.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(video);
    } catch (error) {
      console.error("Get video error:", error);
      res.status(500).json({ error: "Failed to get video" });
    }
  });

  app.get("/api/videos/:id/status", requireAuth, async (req, res) => {
    try {
      const video = await storage.getVideoJob(req.params.id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      if (video.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (video.status === "SUCCESS" || video.status === "FAILED") {
        return res.json(video);
      }

      if (!video.runwayJobId) {
        return res.json(video);
      }

      const runwayStatus = await getVideoGenerationStatus(video.runwayJobId);
      if (!runwayStatus) {
        return res.json(video);
      }

      if (runwayStatus.status === "SUCCEEDED" && runwayStatus.output?.[0]) {
        const updated = await storage.updateVideoJob(video.id, {
          status: "SUCCESS",
          videoUrl: runwayStatus.output[0],
        });
        return res.json(updated);
      } else if (runwayStatus.status === "FAILED") {
        const updated = await storage.updateVideoJob(video.id, {
          status: "FAILED",
          errorMessage: runwayStatus.failure || "Video generation failed",
        });
        return res.json(updated);
      } else {
        const updated = await storage.updateVideoJob(video.id, {
          status: runwayStatus.status === "RUNNING" ? "PROCESSING" : "PENDING",
        });
        return res.json(updated);
      }
    } catch (error) {
      console.error("Video status check error:", error);
      res.status(500).json({ error: "Failed to check video status" });
    }
  });

  app.get("/api/tracks/:trackId/videos", requireAuth, async (req, res) => {
    try {
      const track = await storage.getTrack(req.params.trackId);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      if (track.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const videos = await storage.getVideoJobsByTrackId(req.params.trackId);
      res.json(videos);
    } catch (error) {
      console.error("Get track videos error:", error);
      res.status(500).json({ error: "Failed to get videos for track" });
    }
  });

  app.get("/api/video-config", requireAuth, (req, res) => {
    res.json({
      available: isRunwayConfigured(),
      creditCost: VIDEO_CREDIT_COST,
    });
  });

  return httpServer;
}
