import { mysqlTable, varchar, int, json, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === GAME STATE TYPES ===
// We define the shape of the game state here to ensure frontend/backend consistency
// even if we just store it as a JSON blob for now.

export const GeneratorType = z.enum([
  "meditation_mat",
  "spirit_well"
]);

// Realm ID is now a number from 1-34
// We don't use an enum for IDs to allow easier numeric progression
export const RealmIdSchema = z.number().min(1).max(34);

export const FactionType = z.enum(["demonic", "righteous", "heavenly"]);

export const GameStateSchema = z.object({
  resources: z.object({
    qi: z.number(),
    totalQi: z.number(), // Lifetime qi, used for prestige/achievements
    ascensionPoints: z.number().default(0),
  }),
  generators: z.record(z.string(), z.number()), // Count of each generator
  realm: z.object({
    id: RealmIdSchema,
    stage: z.number().min(1).max(9), // Current stage (1-9 typically)
    name: z.string(), // Cached name for display
    world: z.string(), // Cached world name because calculating it purely from ID on frontend is annoying if logic changes
    multiplier: z.number(),
  }),
  faction: FactionType.nullable(),
  upgrades: z.array(z.string()), // IDs of purchased upgrades
  achievements: z.array(z.string()), // IDs of unlocked achievements
  settings: z.object({
    theme: z.enum(["light", "dark"]).default("dark"),
  }),
  lastSaveTime: z.number(),
});

export type GameState = z.infer<typeof GameStateSchema>;

// === TABLE DEFINITIONS ===

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  avatar: varchar("avatar", { length: 10000 }).default(""), // Base64 image data
  theme: varchar("theme", { length: 10 }).default("dark"), // 'dark' or 'light'
  createdAt: datetime("created_at").notNull().default(new Date()),
});

export const saves = mysqlTable("saves", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  data: json("data").$type<GameState>().notNull(),
  updatedAt: datetime("updated_at").notNull().default(new Date()),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertSaveSchema = createInsertSchema(saves);

export type User = typeof users.$inferSelect;
export type Save = typeof saves.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSave = z.infer<typeof insertSaveSchema>;
