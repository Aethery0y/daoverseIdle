import {
  users, saves,
  type User, type InsertUser, type Save, type GameState
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User ops
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  updateUserPreferences(userId: number, prefs: { avatar?: string; theme?: string }): Promise<void>;
  changePassword(userId: number, newPassword: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;

  // Save ops
  getSave(userId: number): Promise<Save | undefined>;
  updateSave(userId: number, data: GameState): Promise<Save>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    });

    // Return the created user (MySQL doesn't support .returning(), so we need to fetch it)
    const [createdUser] = await db.select().from(users).where(eq(users.username, insertUser.username));
    return createdUser;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async updateUserPreferences(userId: number, prefs: { avatar?: string; theme?: string }): Promise<void> {
    const updateData: any = {};
    if (prefs.avatar !== undefined) updateData.avatar = prefs.avatar;
    if (prefs.theme !== undefined) updateData.theme = prefs.theme;

    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async changePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async deleteUser(userId: number): Promise<void> {
    // Delete user's saves first
    await db.delete(saves).where(eq(saves.userId, userId));
    // Then delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async getSave(userId: number): Promise<Save | undefined> {
    const [save] = await db.select().from(saves).where(eq(saves.userId, userId));
    return save;
  }

  async updateSave(userId: number, data: GameState): Promise<Save> {
    // Check if save exists
    const existing = await this.getSave(userId);

    if (existing) {
      await db
        .update(saves)
        .set({ data, updatedAt: new Date() })
        .where(eq(saves.id, existing.id));

      // Fetch and return the updated save
      const [updated] = await db.select().from(saves).where(eq(saves.id, existing.id));
      return updated;
    } else {
      await db
        .insert(saves)
        .values({ userId, data });

      // Fetch and return the created save
      const [created] = await db.select().from(saves).where(eq(saves.userId, userId));
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
