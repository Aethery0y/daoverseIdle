import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === User Routes ===
  app.post(api.users.register.path, async (req, res) => {
    try {
      const input = api.users.register.input.parse(req.body);
      
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(input);
      // In a real app, we'd set a session here. 
      // For this MVP, we just return the user info and client stores the ID if needed.
      res.status(201).json({ id: user.id, username: user.username });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.users.login.path, async (req, res) => {
    try {
      const input = api.users.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);
      
      if (!user || user.password !== input.password) { // Simple password check for MVP
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      res.json({ id: user.id, username: user.username });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // === Save Routes ===
  // Note: In a real app, these would be protected by middleware checking session/token
  // For this MVP, we'll assume the client sends the user ID (not secure, but functional for prototype)
  // Actually, to keep it simple and match the "offline first" vibe, we might not even strictly enforce auth
  // But let's assume we use a header or query param for userId for simplicity in this generated code
  
  app.get(api.saves.get.path, async (req, res) => {
    // Mock getting user ID from query for MVP simplicity
    const userId = Number(req.query.userId); 
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const save = await storage.getSave(userId);
    if (!save) return res.status(404).json({ message: "No save found" });
    
    res.json(save.data);
  });

  app.post(api.saves.sync.path, async (req, res) => {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ message: "User ID required" });

    try {
      const data = api.saves.sync.input.parse(req.body);
      await storage.updateSave(userId, data);
      res.json({ success: true, timestamp: Date.now() });
    } catch (err) {
      res.status(400).json({ message: "Invalid save data" });
    }
  });

  return httpServer;
}
