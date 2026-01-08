import {
  users, saves, friendships, notifications,
  type User, type InsertUser, type Save, type GameState, type Friendship, type Notification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User ops
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  updateUserPreferences(userId: number, prefs: { avatar?: string; theme?: string; username?: string }): Promise<void>;
  changePassword(userId: number, newPassword: string): Promise<void>;
  deleteUser(userId: number): Promise<void>;
  getUserStats(userId: number): Promise<User & { stats?: any } | undefined>;

  // Save ops
  getSave(userId: number): Promise<Save | undefined>;
  updateSave(userId: number, data: GameState): Promise<Save>;

  // Social ops
  searchUsers(query: string): Promise<User[]>;
  sendFriendRequest(fromId: number, toUserId: number): Promise<void>;
  updateFriendRequest(id: number, status: "accepted" | "rejected"): Promise<Friendship | undefined>;
  removeFriendship(id: number): Promise<void>;
  getFriendships(userId: number): Promise<(Friendship & { friend?: User })[]>;
  getNotifications(userId: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  getLeaderboard(): Promise<{ id: number; username: string; avatar: string; qiPerTap: number }[]>;
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

  async updateUserPreferences(userId: number, prefs: { avatar?: string; theme?: string; username?: string }): Promise<void> {
    const updateData: any = {};
    if (prefs.avatar !== undefined) updateData.avatar = prefs.avatar;
    if (prefs.theme !== undefined) updateData.theme = prefs.theme;
    if (prefs.username !== undefined) updateData.username = prefs.username;

    console.log(`[Storage] Update prefs user=${userId} data=`, updateData);
    await db.update(users).set(updateData).where(eq(users.id, userId));
  }

  async getUserStats(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const save = await this.getSave(userId);
    // Return safe public stats
    return {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      theme: user.theme,
      // Game stats from save if available
      realm: save?.data?.realm,
      faction: save?.data?.faction,
      totalQi: save?.data?.resources?.totalQi || 0,
    };
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
    // Sync stats to users table for leaderboard
    const qiPerTap = data.stats?.qiPerTap || 0;
    const totalQi = data.resources.totalQi || 0;

    // We fire-and-forget this update or await it? Await is safer.
    try {
      await db.update(users).set({
        qiPerTap: qiPerTap,
        totalQi: totalQi
      }).where(eq(users.id, userId));
    } catch (e) {
      console.error("Failed to update leaderboard stats (ignoring to preserve save):", e);
    }

    // Check if save exists
    const existing = await this.getSave(userId);

    if (existing) {
      await db
        .update(saves)
        .set({ data, updatedAt: new Date() })
        .where(eq(saves.id, existing.id));

      const [updated] = await db.select().from(saves).where(eq(saves.id, existing.id));
      return updated;
    } else {
      await db
        .insert(saves)
        .values({ userId, data });

      const [created] = await db.select().from(saves).where(eq(saves.userId, userId));
      return created;
    }
  }

  async getLeaderboard(): Promise<{ id: number; username: string; avatar: string; qiPerTap: number }[]> {
    const results = await db.select({
      id: users.id,
      username: users.username,
      avatar: users.avatar,
      qiPerTap: users.qiPerTap,
    })
      .from(users)
      .orderBy(desc(users.qiPerTap))
      .limit(10);

    // Ensure we explicitly return 0 if null 
    return results.map(u => ({
      ...u,
      avatar: u.avatar || "",
      qiPerTap: Number(u.qiPerTap) || 0
    }));
  }



  async searchUsers(query: string): Promise<User[]> {
    if (!query || query.length < 2) return [];
    return await db.select().from(users)
      .where(like(users.username, `%${query}%`))
      .limit(10);
  }

  async sendFriendRequest(fromId: number, toUserId: number): Promise<void> {
    // Check if exists
    const existing = await db.select().from(friendships).where(
      or(
        and(eq(friendships.userId, fromId), eq(friendships.friendId, toUserId)),
        and(eq(friendships.userId, toUserId), eq(friendships.friendId, fromId))
      )
    );

    if (existing.length > 0) throw new Error("Friendship already exists");

    const [user] = await db.select().from(users).where(eq(users.id, fromId));

    await db.transaction(async (tx) => {
      // Create Request
      const [result] = await tx.insert(friendships).values({
        userId: fromId,
        friendId: toUserId,
        status: "pending"
      });

      // Create Notification
      await tx.insert(notifications).values({
        userId: toUserId,
        type: "friend_request",
        data: {
          requestId: result.insertId,
          fromId: fromId,
          fromName: user?.username ?? "Unknown"
        }
      });
    });
  }

  async updateFriendRequest(id: number, status: "accepted" | "rejected"): Promise<Friendship | undefined> {
    const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id));
    if (!friendship) return undefined;

    if (status === "rejected") {
      await db.delete(friendships).where(eq(friendships.id, id));
      return { ...friendship, status: "rejected" };
    } else {
      await db.update(friendships).set({ status }).where(eq(friendships.id, id));
      return { ...friendship, status: "accepted" };
    }
  }

  async removeFriendship(id: number): Promise<void> {
    await db.delete(friendships).where(eq(friendships.id, id));
  }

  async getFriendships(userId: number): Promise<(Friendship & { friend?: User })[]> {
    const records = await db.select().from(friendships).where(
      and(
        or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
        eq(friendships.status, "accepted")
      )
    );

    // Populate Friend Data
    const results = [];
    for (const record of records) {
      const targetId = record.userId === userId ? record.friendId : record.userId;
      const [friend] = await db.select().from(users).where(eq(users.id, targetId));
      results.push({ ...record, friend });
    }
    return results;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage();
