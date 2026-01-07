import { GeneratorType, RealmType, FactionType } from "@shared/schema";

export const REALM_DATA: Record<string, { label: string, multiplier: number, requiredQi: number, description: string }> = {
  [RealmType.enum.body_tempering]: { label: "Body Tempering", multiplier: 1, requiredQi: 0, description: "Strengthening the mortal vessel." },
  [RealmType.enum.qi_condensation]: { label: "Qi Condensation", multiplier: 5, requiredQi: 10000, description: "Gathering qi into a gaseous state." },
  [RealmType.enum.foundation]: { label: "Foundation Establishment", multiplier: 25, requiredQi: 100000, description: "Building the pillars of immortality." },
  [RealmType.enum.core_formation]: { label: "Core Formation", multiplier: 150, requiredQi: 1000000, description: "Condensing qi into a golden core." },
  [RealmType.enum.nascent_soul]: { label: "Nascent Soul", multiplier: 1000, requiredQi: 50000000, description: "Birthing the spiritual self." },
  [RealmType.enum.sage]: { label: "Sage", multiplier: 10000, requiredQi: 1000000000, description: "One with the Dao." },
  [RealmType.enum.immortal]: { label: "Immortal", multiplier: 100000, requiredQi: 100000000000, description: "Transcending the cycle of reincarnation." },
};

export const GENERATOR_DATA: Record<string, { label: string, baseProduction: number, baseCost: number, description: string }> = {
  [GeneratorType.enum.meditation_mat]: { label: "Meditation Mat", baseProduction: 1, baseCost: 15, description: "A simple mat to aid focus." },
  [GeneratorType.enum.spirit_well]: { label: "Spirit Well", baseProduction: 8, baseCost: 100, description: "Draws ambient qi from the earth." },
  [GeneratorType.enum.inner_disciple]: { label: "Inner Disciple", baseProduction: 40, baseCost: 1100, description: "A loyal follower who gathers qi for you." },
  [GeneratorType.enum.qi_formation]: { label: "Qi Formation", baseProduction: 150, baseCost: 12000, description: "An array that naturally gathers energy." },
  [GeneratorType.enum.spirit_vein]: { label: "Spirit Vein", baseProduction: 800, baseCost: 130000, description: "Direct tap into the earth's meridians." },
  [GeneratorType.enum.ancient_array]: { label: "Ancient Array", baseProduction: 5000, baseCost: 1400000, description: "Lost technology of the old gods." },
  [GeneratorType.enum.heavenly_sect]: { label: "Heavenly Sect", baseProduction: 30000, baseCost: 20000000, description: "An entire sect dedicated to your glory." },
};

export const FACTION_DATA: Record<string, { label: string, description: string, color: string }> = {
  [FactionType.enum.righteous]: { label: "Righteous Sect", description: "+10% Passive Qi Generation", color: "text-blue-400" },
  [FactionType.enum.demonic]: { label: "Demonic Path", description: "+10% Click Power", color: "text-red-500" },
  [FactionType.enum.heavenly]: { label: "Heavenly Dao", description: "-10% Realm Breakthrough Cost", color: "text-amber-400" },
};

// Helper for large numbers
export function formatNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ["k", "M", "B", "T", "Qa", "Qi", "Sx"];
  const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
  let shortValue = parseFloat((suffixNum !== 0 ? (num / Math.pow(1000, suffixNum)) : num).toPrecision(3));
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum - 1];
}

export function calculateCost(baseCost: number, count: number): number {
  return Math.floor(baseCost * Math.pow(1.15, count));
}
