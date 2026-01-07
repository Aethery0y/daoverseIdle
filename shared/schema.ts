import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === GAME STATE TYPES ===
// We define the shape of the game state here to ensure frontend/backend consistency
// even if we just store it as a JSON blob for now.

export const GeneratorType = z.enum([
  "meditation_mat",
  "spirit_well",
  "inner_disciple",
  "qi_formation",
  "spirit_vein",
  "ancient_array",
  "heavenly_sect"
]);

export const RealmType = z.enum([
  "body_tempering",
  "qi_condensation",
  "foundation",
  "core_formation",
  "nascent_soul",
  "sage",
  "immortal"
]);

export const FactionType = z.enum(["demonic", "righteous", "heavenly"]);

export const GameStateSchema = z.object({
  resources: z.object({
    qi: z.number(),
    totalQi: z.number(), // Lifetime qi, used for prestige/achievements
    ascensionPoints: z.number().default(0),
  }),
  generators: z.record(GeneratorType, z.number()), // Count of each generator
  realm: z.object({
    name: RealmType,
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const saves = pgTable("saves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Nullable for anonymous local saves that sync later
  data: jsonb("data").$type<GameState>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users);
export const insertSaveSchema = createInsertSchema(saves);

export type User = typeof users.$inferSelect;
export type Save = typeof saves.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSave = z.infer<typeof insertSaveSchema>;
