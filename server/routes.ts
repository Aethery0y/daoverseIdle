import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

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

      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;

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

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await storage.verifyPassword(user, input.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ id: user.id, username: user.username });
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // Logout endpoint
  app.post("/api/users/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/users/me", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      id: req.session.userId,
      username: req.session.username
    });
  });

  // === Save Routes (Protected) ===

  app.get(api.saves.get.path, requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    const save = await storage.getSave(userId);
    if (!save) return res.status(404).json({ message: "No save found" });

    res.json(save.data);
  });

  app.post(api.saves.sync.path, requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    try {
      const data = api.saves.sync.input.parse(req.body);
      await storage.updateSave(userId, data);
      res.json({ success: true, timestamp: Date.now() });
    } catch (err) {
      res.status(400).json({ message: "Invalid save data" });
    }
  });

  // Update user preferences (avatar, theme)
  app.post("/api/users/preferences", requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    try {
      const { avatar, theme } = req.body;
      await storage.updateUserPreferences(userId, { avatar, theme });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Get user preferences
  app.get("/api/users/preferences", requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    try {
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ avatar: user.avatar, theme: user.theme });
    } catch (err) {
      res.status(500).json({ message: "Failed to get preferences" });
    }
  });

  // Change password (no current password required)
  app.post("/api/users/change-password", requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ message: "Password must be at least 3 characters" });
      }

      await storage.changePassword(userId, newPassword);
      res.json({ success: true, message: "Password changed successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete account (requires current password)
  app.post("/api/users/delete-account", requireAuth, async (req, res) => {
    const userId = req.session.userId!;

    try {
      const { password } = req.body;
      const user = await storage.getUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await storage.verifyPassword(user, password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      await storage.deleteUser(userId);

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout after deletion" });
        }
        res.json({ success: true, message: "Account deleted successfully" });
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  return httpServer;
}
