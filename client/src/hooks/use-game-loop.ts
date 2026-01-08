import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, GeneratorType, FactionType } from "@shared/schema";
import { REALMS, GENERATOR_DATA, calculateMultiplier, calculateRequiredQi, getRealm, getNextRealm } from "@/lib/game-constants";
import { useGameSave } from "./use-game-save";
import { useToast } from "@/hooks/use-toast";

// Initial state constant
// Now using ID-based realm structure
const INITIAL_STATE: GameState = {
  resources: { qi: 0, totalQi: 0, ascensionPoints: 0 },
  generators: {
    [GeneratorType.enum.meditation_mat]: 0,
    [GeneratorType.enum.spirit_well]: 0,
  },
  realm: {
    id: 1,
    stage: 1,
    name: "Qi Refinement",
    world: "Mortal World",
    multiplier: 1
  },
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

  const lastSavedStateRef = useRef<GameState | null>(null);
  const stateRef = useRef(gameState);

  // Sync ref with state
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Load logic with migration handling
  useEffect(() => {
    const localStr = localStorage.getItem("cultivation_save");
    let localSave: GameState | null = null;

    if (localStr) {
      try {
        const parsed = JSON.parse(localStr);
        // Check for legacy realm data (string vs object with id)
        if (typeof parsed.realm?.name === 'string' && !parsed.realm?.id) {
          console.log("Legacy save detected - Resetting to new system");
          localSave = null; // Force reset or migration
        } else {
          localSave = parsed;
        }
      } catch (e) {
        console.error("Failed to parse local save", e);
      }
    }

    // Helper to sanitize state (remove invalid generators)
    const sanitizeState = (state: GameState): GameState => {
      // Basic structure check
      if (!state.realm || !state.realm.id) {
        return { ...INITIAL_STATE, settings: state.settings || INITIAL_STATE.settings };
      }

      const validGenerators = Object.values(GeneratorType.enum);
      const cleanGenerators: Record<string, number> = {};

      validGenerators.forEach(type => {
        // @ts-ignore
        cleanGenerators[type] = state.generators[type] || 0;
      });

      // Recalculate multiplier just in case
      const currentMultiplier = calculateMultiplier(
        state.realm.id,
        state.realm.stage,
        getRealm(state.realm.id)?.worldIndex || 0
      );

      return {
        ...state,
        generators: cleanGenerators,
        realm: {
          ...state.realm,
          multiplier: currentMultiplier
        }
      };
    };

    const processLoad = (targetState: GameState, source: string) => {
      console.log(`Loading from ${source}`);
      const clean = sanitizeState(targetState);
      setGameState(clean);
      lastSavedStateRef.current = clean;
      localStorage.setItem("cultivation_save", JSON.stringify(clean));
    };

    if (remoteSave && localSave) {
      if (remoteSave.lastSaveTime > localSave.lastSaveTime) {
        processLoad(remoteSave, "Cloud (Newer)");
      } else {
        console.log("Loading from Local (Newer/Equal)");
        const clean = sanitizeState(localSave);
        setGameState(clean);
        lastSavedStateRef.current = clean;
        saveGame(clean); // Sync local to cloud
      }
    } else if (remoteSave) {
      processLoad(remoteSave, "Cloud (Only source)");
    } else if (localSave) {
      processLoad(localSave, "Local (Only source)");
    } else {
      // No save found, initialize fresh
      console.log("No save found - Initializing fresh");
      setIsInitialized(true);
      lastSavedStateRef.current = INITIAL_STATE;
    }

    setIsInitialized(true);
  }, [remoteSave, saveGame]);

  // Reactive Save Effect
  useEffect(() => {
    if (!isInitialized || !lastSavedStateRef.current) return;

    const current = gameState;
    const last = lastSavedStateRef.current;

    const generatorsChanged = JSON.stringify(current.generators) !== JSON.stringify(last.generators);
    const realmChanged = current.realm.id !== last.realm.id || current.realm.stage !== last.realm.stage;
    const factionChanged = current.faction !== last.faction;
    const settingsChanged = JSON.stringify(current.settings) !== JSON.stringify(last.settings);

    if (generatorsChanged || realmChanged || factionChanged || settingsChanged) {
      console.log("Critical state change detected - Saving immediately");
      const toSave = { ...current, lastSaveTime: Date.now() };
      saveGame(toSave);
      lastSavedStateRef.current = toSave;
    }
  }, [gameState, isInitialized, saveGame]);

  // Auto-save loop
  useEffect(() => {
    if (!isInitialized) return;

    const localInterval = setInterval(() => {
      const current = stateRef.current;
      const toSave = { ...current, lastSaveTime: Date.now() };
      localStorage.setItem("cultivation_save", JSON.stringify(toSave));
    }, 5000);

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

  // Actions
  const syncToCloud = useCallback(async () => {
    try {
      const toSave = { ...stateRef.current, lastSaveTime: Date.now() };
      await saveGameAsync(toSave);
      lastSavedStateRef.current = toSave;
      toast({ title: "Progress Saved", description: "Your cultivation progress has been recorded." });
    } catch (e) {
      toast({ title: "Save Failed", description: "Could not reach the archives.", variant: "destructive" });
    }
  }, [saveGameAsync, toast]);

  const clickCultivate = useCallback(() => {
    setGameState(prev => {
      let clickPower = 1;

      Object.entries(prev.generators).forEach(([type, count]) => {
        const data = GENERATOR_DATA[type];
        if (data) {
          clickPower += count * data.clickPowerBonus;
        }
      });

      clickPower *= prev.realm.multiplier;

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
      const realmId = prev.realm.id;
      const currentRealmData = getRealm(realmId);

      if (!currentRealmData) return prev;

      // Required Qi Calculation
      let requiredQi = calculateRequiredQi(realmId, prev.realm.stage);

      // Discount
      if (prev.faction === FactionType.enum.heavenly) {
        requiredQi *= 0.9;
      }

      if (prev.resources.qi >= requiredQi) {
        // Checks for progression
        let nextStage = prev.realm.stage + 1;
        let nextRealmId = realmId;

        // Major Breakthrough Check
        if (nextStage > currentRealmData.stages) {
          nextRealmId++;
          nextStage = 1;
        }

        const nextRealmData = getRealm(nextRealmId);
        if (!nextRealmData) {
          toast({ title: "Max Level Reached", description: "You have reached the apex of this universe." });
          return prev;
        }

        // Consume Qi
        const remainingQi = prev.resources.qi - requiredQi;

        // New Multiplier
        const newMultiplier = calculateMultiplier(nextRealmId, nextStage, nextRealmData.worldIndex);

        const isMajor = nextRealmId > realmId;
        toast({
          title: isMajor ? "Major Breakthrough!" : "Minor Breakthrough",
          description: `You have advanced to ${nextRealmData.name} ${isMajor ? "" : `Stage ${nextStage}`}! Multiplier: x${newMultiplier}`,
          className: "bg-primary text-primary-foreground border-none"
        });

        return {
          ...prev,
          resources: { ...prev.resources, qi: remainingQi },
          realm: {
            id: nextRealmData.id,
            stage: nextStage,
            name: nextRealmData.name,
            world: nextRealmData.world,
            multiplier: newMultiplier
          }
        };
      }

      toast({ title: "Insufficient Qi", description: "Your foundation is not yet stable enough.", variant: "destructive" });
      return prev;
    });
  }, [toast]);

  const selectFaction = useCallback((faction: string) => {
    setGameState(prev => ({ ...prev, faction: faction as any }));
  }, []);

  const hardReset = useCallback(() => {
    if (confirm("Are you sure you want to cripple your cultivation and start over?")) {
      setGameState({ ...INITIAL_STATE, faction: null });
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
