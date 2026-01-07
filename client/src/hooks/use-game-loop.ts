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
    [GeneratorType.enum.inner_disciple]: 0,
    [GeneratorType.enum.qi_formation]: 0,
    [GeneratorType.enum.spirit_vein]: 0,
    [GeneratorType.enum.ancient_array]: 0,
    [GeneratorType.enum.heavenly_sect]: 0,
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
  const { remoteSave, saveGame } = useGameSave();
  const { toast } = useToast();
  
  // Refs for loop to access latest state without dependency cycles
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Load from local storage or remote on mount
  useEffect(() => {
    const local = localStorage.getItem("cultivation_save");
    if (local) {
      try {
        const parsed = JSON.parse(local);
        // Simple merge/validation could go here
        setGameState({ ...INITIAL_STATE, ...parsed });
      } catch (e) {
        console.error("Failed to parse local save", e);
      }
    } else if (remoteSave) {
      setGameState(remoteSave);
    }
    setIsInitialized(true);
  }, [remoteSave]);

  // Auto-save loop (every 5s)
  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(() => {
      const current = stateRef.current;
      const toSave = { ...current, lastSaveTime: Date.now() };
      localStorage.setItem("cultivation_save", JSON.stringify(toSave));
      
      // Also sync to cloud occasionally (maybe logic here to throttle cloud syncs)
      // saveGame(toSave); 
    }, 5000);
    return () => clearInterval(interval);
  }, [isInitialized]);

  // Cloud sync trigger (manual or on important events)
  const syncToCloud = useCallback(() => {
    saveGame(stateRef.current);
    toast({ title: "Progress Saved", description: "Your cultivation progress has been recorded in the heavenly archives." });
  }, [saveGame, toast]);

  // Core Game Loop (Passive Generation)
  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(() => {
      setGameState(prev => {
        let passivePerSec = 0;
        
        // Calculate passive from generators
        Object.entries(prev.generators).forEach(([type, count]) => {
          const data = GENERATOR_DATA[type];
          passivePerSec += count * data.baseProduction;
        });

        // Apply Realm Multiplier
        passivePerSec *= prev.realm.multiplier;

        // Apply Faction Multiplier (Righteous = +10%)
        if (prev.faction === FactionType.enum.righteous) {
          passivePerSec *= 1.1;
        }

        const productionTick = passivePerSec / 10; // Running at 100ms ticks

        if (productionTick > 0) {
          return {
            ...prev,
            resources: {
              ...prev.resources,
              qi: prev.resources.qi + productionTick,
              totalQi: prev.resources.totalQi + productionTick,
            }
          };
        }
        return prev;
      });
    }, 100); // 10 ticks per second

    return () => clearInterval(interval);
  }, [isInitialized]);

  // Actions
  const clickCultivate = useCallback(() => {
    setGameState(prev => {
      let clickPower = 1;
      
      // Realm Multiplier
      clickPower *= prev.realm.multiplier;
      
      // Faction Multiplier (Demonic = +10%)
      if (prev.faction === FactionType.enum.demonic) {
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
      const count = prev.generators[type as keyof typeof prev.generators];
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
