import { 
  users, saves, 
  type User, type InsertUser, type Save, type GameState 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User ops
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getSave(userId: number): Promise<Save | undefined> {
    const [save] = await db.select().from(saves).where(eq(saves.userId, userId));
    return save;
  }

  async updateSave(userId: number, data: GameState): Promise<Save> {
    // Check if save exists
    const existing = await this.getSave(userId);
    
    if (existing) {
      const [updated] = await db
        .update(saves)
        .set({ data, updatedAt: new Date() })
        .where(eq(saves.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(saves)
        .values({ userId, data })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
