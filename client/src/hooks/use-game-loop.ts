import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, GeneratorType, RealmType, FactionType } from "@shared/schema";
import { REALM_DATA, GENERATOR_DATA } from "@/lib/game-constants";
import { useGameSave } from "./use-game-save";
import { useToast } from "@/hooks/use-toast";

// Initial state constant
const INITIAL_STATE: GameState = {
  resources: { qi: 0, totalQi: 0, ascensionPoints: 0 },
  generators: {
    [GeneratorType.enum.meditation_mat]: 0,
    [GeneratorType.enum.spirit_well]: 0,
  },
  realm: { name: RealmType.enum.body_tempering, multiplier: 1 },
  faction: null,
  upgrades: [],
  achievements: [],
  settings: { theme: "dark" },
  lastSaveTime: Date.now(),
};

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const { remoteSave, saveGame, saveGameAsync } = useGameSave();
  const { toast } = useToast();

  // Ref to track the last successfully saved state for comparison
  const lastSavedStateRef = useRef<GameState | null>(null);

  // Refs for loop to access latest state without dependency cycles
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Load from local storage or remote on mount
  useEffect(() => {
    const localStr = localStorage.getItem("cultivation_save");
    let localSave: GameState | null = null;

    if (localStr) {
      try {
        localSave = JSON.parse(localStr);
      } catch (e) {
        console.error("Failed to parse local save", e);
      }
    }

    // Helper to sanitize state (remove invalid generators)
    const sanitizeState = (state: GameState): GameState => {
      const validGenerators = Object.values(GeneratorType.enum);
      const cleanGenerators: Record<string, number> = {};

      // Keep only valid generators
      validGenerators.forEach(type => {
        // @ts-ignore - Indexing with string is fine here
        cleanGenerators[type] = state.generators[type] || 0;
      });

      return {
        ...state,
        generators: cleanGenerators
      };
    };

    if (remoteSave && localSave) {
      // Compare timestamps
      if (remoteSave.lastSaveTime > localSave.lastSaveTime) {
        // Cloud is newer
        console.log("Loading from Cloud (Newer)");
        const clean = sanitizeState(remoteSave);
        setGameState(clean);
        lastSavedStateRef.current = clean;
        localStorage.setItem("cultivation_save", JSON.stringify(clean));
      } else {
        // Local is newer or equal
        console.log("Loading from Local (Newer/Equal)");
        const clean = sanitizeState(localSave);
        setGameState(clean);
        lastSavedStateRef.current = clean; // Assume it will be synced shortly
        // Sync to cloud since we have newer local data
        saveGame(clean);
      }
    } else if (remoteSave) {
      console.log("Loading from Cloud (Only source)");
      const clean = sanitizeState(remoteSave);
      setGameState(clean);
      lastSavedStateRef.current = clean;
      localStorage.setItem("cultivation_save", JSON.stringify(clean));
    } else if (localSave) {
      console.log("Loading from Local (Only source)");
      const clean = sanitizeState(localSave);
      setGameState(clean);
      lastSavedStateRef.current = clean;
    }

    setIsInitialized(true);
  }, [remoteSave, saveGame]);

  // Reactive Save Effect: Immediately save on major changes
  useEffect(() => {
    if (!isInitialized || !lastSavedStateRef.current) return;

    const current = gameState;
    const last = lastSavedStateRef.current;

    // Check for critical changes: Generators, Realm, Faction, or Settings
    // We use JSON.stringify for deep comparison of specific sections
    const generatorsChanged = JSON.stringify(current.generators) !== JSON.stringify(last.generators);
    const realmChanged = current.realm.name !== last.realm.name;
    const factionChanged = current.faction !== last.faction;
    const settingsChanged = JSON.stringify(current.settings) !== JSON.stringify(last.settings);

    if (generatorsChanged || realmChanged || factionChanged || settingsChanged) {
      console.log("Critical state change detected - Saving immediately");
      const toSave = { ...current, lastSaveTime: Date.now() };
      saveGame(toSave);
      lastSavedStateRef.current = toSave;
    }
  }, [gameState, isInitialized, saveGame]);

  // Auto-save loop (Local + Periodic Qi Cloud Save)
  useEffect(() => {
    if (!isInitialized) return;

    // Local save every 5 seconds (Safety net)
    const localInterval = setInterval(() => {
      const current = stateRef.current;
      const toSave = { ...current, lastSaveTime: Date.now() };
      localStorage.setItem("cultivation_save", JSON.stringify(toSave));
    }, 5000);

    // Cloud save every 60 seconds (For Qi mainly)
    const cloudInterval = setInterval(() => {
      const current = stateRef.current;
      const toSave = { ...current, lastSaveTime: Date.now() };
      saveGame(toSave);
      lastSavedStateRef.current = toSave;
      console.log("Periodic cloud save (Qi)");
    }, 60000);

    return () => {
      clearInterval(localInterval);
      clearInterval(cloudInterval);
    };
  }, [isInitialized, saveGame]);

  // Cloud sync trigger (manual or on important events)
  const syncToCloud = useCallback(async () => {
    try {
      const toSave = { ...stateRef.current, lastSaveTime: Date.now() };
      await saveGameAsync(toSave);
      lastSavedStateRef.current = toSave;
      toast({ title: "Progress Saved", description: "Your cultivation progress has been recorded in the heavenly archives." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not reach the archives.", variant: "destructive" });
    }
  }, [saveGameAsync, toast]);

  // Actions
  const clickCultivate = useCallback(() => {
    setGameState(prev => {
      let clickPower = 1;

      // Add generator bonuses to click power
      Object.entries(prev.generators).forEach(([type, count]) => {
        const data = GENERATOR_DATA[type];
        if (data) {
          clickPower += count * data.clickPowerBonus;
        }
      });

      // Realm Multiplier
      clickPower *= prev.realm.multiplier;

      // Faction Multipliers (Both Righteous and Demonic = +10%)
      if (prev.faction === FactionType.enum.demonic || prev.faction === FactionType.enum.righteous) {
        clickPower *= 1.1;
      }

      return {
        ...prev,
        resources: {
          ...prev.resources,
          qi: prev.resources.qi + clickPower,
          totalQi: prev.resources.totalQi + clickPower,
        }
      };
    });
  }, []);

  const purchaseGenerator = useCallback((type: string) => {
    setGameState(prev => {
      const count = prev.generators[type as keyof typeof prev.generators] ?? 0;
      const data = GENERATOR_DATA[type];
      const cost = Math.floor(data.baseCost * Math.pow(1.15, count));

      if (prev.resources.qi >= cost) {
        return {
          ...prev,
          resources: { ...prev.resources, qi: prev.resources.qi - cost },
          generators: { ...prev.generators, [type]: count + 1 }
        };
      }
      return prev;
    });
  }, []);

  const breakthrough = useCallback(() => {
    setGameState(prev => {
      const currentRealmKey = prev.realm.name;
      const realms = Object.keys(REALM_DATA);
      const currentIndex = realms.indexOf(currentRealmKey);
      const nextRealmKey = realms[currentIndex + 1];

      if (!nextRealmKey) return prev; // Max level

      const nextRealm = REALM_DATA[nextRealmKey];

      // Cost reduction (Heavenly = -10%)
      let cost = nextRealm.requiredQi;
      if (prev.faction === FactionType.enum.heavenly) {
        cost *= 0.9;
      }

      if (prev.resources.qi >= cost) {
        toast({
          title: "Breakthrough Successful!",
          description: `You have advanced to the ${nextRealm.label} realm! Multiplier increased to x${nextRealm.multiplier}.`,
          className: "bg-primary text-primary-foreground border-none"
        });

        return {
          ...prev,
          resources: { ...prev.resources, qi: 0 }, // Reset current Qi
          realm: { name: nextRealmKey as any, multiplier: nextRealm.multiplier }
        };
      }
      return prev;
    });
  }, [toast]);

  const selectFaction = useCallback((faction: string) => {
    setGameState(prev => ({ ...prev, faction: faction as any }));
  }, []);

  const hardReset = useCallback(() => {
    if (confirm("Are you sure you want to cripple your cultivation and start over?")) {
      setGameState({ ...INITIAL_STATE, faction: null }); // Reset to null faction to trigger selection
      localStorage.removeItem("cultivation_save");
    }
  }, []);

  return {
    gameState,
    isInitialized,
    clickCultivate,
    purchaseGenerator,
    breakthrough,
    selectFaction,
    syncToCloud,
    hardReset
  };
}
