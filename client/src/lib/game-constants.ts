import { FactionType } from "@shared/schema";

export interface RealmData {
  id: number;
  name: string;
  world: string;
  worldIndex: number;
  stages: number;
  description: string;
}

export const WORLDS = [
  "Mortal World",
  "Upper World",
  "Deity Realm",
  "Zenith Realm",
  "Sage Realms",
  "Primordial Chaos Realms",
  "Supreme Realms"
];

export const REALMS: RealmData[] = [
  // Mortal World (Index 0)
  { id: 1, name: "Qi Refinement", world: "Mortal World", worldIndex: 0, stages: 9, description: "Refining qi into the body." },
  { id: 2, name: "Foundation Establishment", world: "Mortal World", worldIndex: 0, stages: 9, description: "Building the dao foundation." },
  { id: 3, name: "Golden Core", world: "Mortal World", worldIndex: 0, stages: 9, description: "Condensing a core of power." },
  { id: 4, name: "Nascent Soul", world: "Mortal World", worldIndex: 0, stages: 9, description: "Birthing the spiritual self." },
  { id: 5, name: "Soul Formation", world: "Mortal World", worldIndex: 0, stages: 9, description: "Expanding the soul's domain." },
  { id: 6, name: "Void Amalgamation", world: "Mortal World", worldIndex: 0, stages: 9, description: "Merging with the void." },
  { id: 7, name: "Body Integration", world: "Mortal World", worldIndex: 0, stages: 9, description: "Fusing body and spirit." },
  { id: 8, name: "Tribulation Transcendence", world: "Mortal World", worldIndex: 0, stages: 9, description: "Facing heavenly lightning." },
  { id: 9, name: "Mahayana", world: "Mortal World", worldIndex: 0, stages: 9, description: "The great vehicle of ascension." },

  // Upper World (Index 1)
  { id: 10, name: "Loose Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Shedding the mortal coil." },
  { id: 11, name: "Earth Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Rooted in the immortal earth." },
  { id: 12, name: "Earth Immortal of Grand Unity", world: "Upper World", worldIndex: 1, stages: 4, description: "One with the earth." },
  { id: 13, name: "Heaven Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Ascending to the heavens." },
  { id: 14, name: "Heaven Immortal of Grand Unity", world: "Upper World", worldIndex: 1, stages: 4, description: "One with the heavens." },
  { id: 15, name: "True Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Understanding the true self." },
  { id: 16, name: "True Immortal of Grand Unity", world: "Upper World", worldIndex: 1, stages: 4, description: "True unity achieved." },
  { id: 17, name: "Mystic Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Grasping mystic arts." },
  { id: 18, name: "Mystic Immortal of Grand Unity", world: "Upper World", worldIndex: 1, stages: 4, description: "Mastery of mystic unity." },
  { id: 19, name: "Golden Immortal", world: "Upper World", worldIndex: 1, stages: 4, description: "Indestructible golden body." },
  { id: 20, name: "Golden Immortal of Grand Unity", world: "Upper World", worldIndex: 1, stages: 4, description: "Supreme golden unity." },
  { id: 21, name: "Immortal Emperor", world: "Upper World", worldIndex: 1, stages: 9, description: "Ruler of immortals." },
  { id: 22, name: "Providence Immortal Emperor", world: "Upper World", worldIndex: 1, stages: 3, description: "Governing fate." },
  { id: 23, name: "Great Dao Immortal Emperor", world: "Upper World", worldIndex: 1, stages: 3, description: "Touching the Great Dao." },
  { id: 24, name: "Perfect Immortal Emperor", world: "Upper World", worldIndex: 1, stages: 3, description: "Perfection achieved." },

  // Deity Realm (Index 2)
  { id: 25, name: "Mystic Divine Origin", world: "Deity Realm", worldIndex: 2, stages: 6, description: "Origin of divinity." },

  // Zenith Realm (Index 3)
  { id: 26, name: "Zenith Heaven", world: "Zenith Realm", worldIndex: 3, stages: 4, description: "Peak of the heavens." },

  // Sage Realms (Index 4)
  { id: 27, name: "Quasi-Sage", world: "Sage Realms", worldIndex: 4, stages: 3, description: "Approaching sagehood." },
  { id: 28, name: "Heavenly Dao Sage", world: "Sage Realms", worldIndex: 4, stages: 4, description: "Sage of the Heavenly Dao." },

  // Primordial Chaos Realms (Index 5)
  { id: 29, name: "Freedom Primordial Chaos", world: "Primordial Chaos Realms", worldIndex: 5, stages: 3, description: "Chaos unbound." },
  { id: 30, name: "Great Dao Primordial Chaos", world: "Primordial Chaos Realms", worldIndex: 5, stages: 4, description: "Order within chaos." },

  // Supreme Realms (Index 6)
  { id: 31, name: "Great Dao Supreme", world: "Supreme Realms", worldIndex: 6, stages: 3, description: "Supreme among the Dao." },
  { id: 32, name: "Dao Creator", world: "Supreme Realms", worldIndex: 6, stages: 3, description: "Creator of Daos." },
  { id: 33, name: "Creator Lord", world: "Supreme Realms", worldIndex: 6, stages: 3, description: "Lord of Creation." },
  { id: 34, name: "Final Ultimate Supreme", world: "Supreme Realms", worldIndex: 6, stages: 3, description: "The Absolute End." }
];

export const GENERATOR_DATA: Record<string, { label: string, clickPowerBonus: number, baseCost: number, description: string }> = {
  "meditation_mat": { label: "Meditation Mat", clickPowerBonus: 1, baseCost: 15, description: "A simple mat to aid focus." },
  "spirit_well": { label: "Spirit Well", clickPowerBonus: 8, baseCost: 100, description: "Draws ambient qi from the earth." },
};

export const FACTION_DATA: Record<string, { label: string, description: string, color: string }> = {
  [FactionType.enum.righteous]: { label: "Righteous Sect", description: "+10% Click Power", color: "text-blue-400" },
  [FactionType.enum.demonic]: { label: "Demonic Path", description: "+10% Click Power", color: "text-red-500" },
  [FactionType.enum.heavenly]: { label: "Heavenly Dao", description: "-10% Realm Breakthrough Cost", color: "text-amber-400" },
};

// === Helper Functions ===

export function getRealm(id: number): RealmData | undefined {
  return REALMS.find(r => r.id === id);
}

export function getNextRealm(id: number): RealmData | undefined {
  return REALMS.find(r => r.id === id + 1);
}

export function calculateMultiplier(realmId: number, stage: number, worldIndex: number): number {
  // Logic:
  // World Bonus: +100% per world index (Base x (1 + worldIndex))
  // Major Realm Bonus: +90% per major realm (Base x 1.9 ^ (realmId - 1))
  // Minor Stage Bonus: +50% per stage (Base x 1.5 ^ (stage - 1))

  const worldMult = 1 + worldIndex;
  const realmMult = Math.pow(1.9, realmId - 1);
  const stageMult = Math.pow(1.5, stage - 1);

  // Return formatted float (2 decimal points precision in calculation, but we return number)
  // We round it to avoid floating point ugliness
  let total = worldMult * realmMult * stageMult;

  // Cap precision
  if (total > 1000) return Math.round(total);
  return parseFloat(total.toFixed(2));
}

export function calculateRequiredQi(realmId: number, stage: number): number {
  // Exponential growth curve
  // Mortal realms start slow (100)
  // Higher realms explode

  const base = 100000;
  // Growth factor per "Total Step"
  // Total Steps = Cumulative stages passed

  // Calculate approximate total steps to reach this point
  let totalSteps = 0;
  for (let i = 1; i < realmId; i++) {
    const r = getRealm(i);
    if (r) totalSteps += r.stages;
  }
  totalSteps += (stage - 1);

  // Growth curve: 2.2x per step?
  // 100 * 2.2^0 = 100
  // ...
  // This gets big fast. 2.2^10 = 2600. 100*2600 = 260k.
  // 2.2^100 is HUGE.
  // We need distinct curves for different worlds maybe?

  // Let's use a standard scaling factor that increases slightly per realm

  return Math.floor(base * Math.pow(2.5, totalSteps));
}

export function formatNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ["k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td"];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);

  if (suffixNum >= suffixes.length + 1) return "Infinite";

  let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum - 1];
}

export function calculateCost(baseCost: number, count: number): number {
  return Math.floor(baseCost * Math.pow(1.2, count));
}
