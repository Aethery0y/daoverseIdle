import { useState, useEffect, useCallback, useRef } from "react";
import { GameState, GeneratorType, FactionType } from "@shared/schema";
import { REALMS, GENERATOR_DATA, calculateMultiplier, calculateRequiredQi, getRealm, getNextRealm, calculateCost } from "@/lib/game-constants";
import { useGameSave } from "./use-game-save";
import { useAuth } from "@/hooks/use-auth";
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
  const { remoteSave, saveGame, saveGameAsync, isLoading: saveLoading, isError: saveError } = useGameSave();
  const { toast } = useToast();

  const lastSavedStateRef = useRef<GameState | null>(null);
  const stateRef = useRef(gameState);

  // Sync ref with state
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Helper to sanitize state (remove invalid generators)
  // Helper to sanitize state (remove invalid generators)
  const sanitizeState = useCallback((state: GameState): GameState => {
    if (!state) return INITIAL_STATE;

    // Ensure deep merge with initial state structure to fill missing fields
    const sanitized = {
      ...INITIAL_STATE,
      ...state,
      resources: { ...INITIAL_STATE.resources, ...state.resources },
      realm: { ...INITIAL_STATE.realm, ...state.realm },
      // Important calls: Ensure generators key exists.
      generators: { ...INITIAL_STATE.generators, ...(state.generators || {}) },
      settings: { ...INITIAL_STATE.settings, ...(state.settings || {}) },
      // Preserve arrays
      upgrades: Array.isArray(state.upgrades) ? state.upgrades : [],
      achievements: Array.isArray(state.achievements) ? state.achievements : [],
      // Preserver Faction (Explicitly handle null)
      faction: state.faction ?? null,
    };

    // Remove invalid generators that might have been removed from the game
    Object.keys(sanitized.generators).forEach(key => {
      if (!GENERATOR_DATA[key]) {
        delete sanitized.generators[key];
      }
    });

    console.log("[DEBUG] Sanitized State (Faction):", sanitized.faction);
    return sanitized;
  }, []);

  // ... (sanitizeState implementation omitted for brevity in thought process, will include in tool call)

  const { user, isLoading: authLoading } = useAuth();

  // Load logic: Server-Authoritative Only
  useEffect(() => {
    // 1. Wait for Auth
    if (authLoading || !user) return;

    // 2. Wait for Query to start/finish
    // When useGameSave becomes enabled (due to user existing), isLoading might flash false for a tick?
    // Actually, if enabled changes to true, React Query starts fetching. isLoading should be true.
    if (saveLoading) return;

    // CRITICAL CHANGE: If error, WE DO NOT INITIALIZE. 
    // User requested to stay on loading screen until data is loaded.
    // This prevents "Connection Failed" screen and data overwrites.
    if (saveError) {
      console.log("Save load error - waiting for retry...");
      return;
    }

    if (!remoteSave && !saveLoading) {
      // No save on server? New game.
      console.log("No cloud save found - Initializing fresh");
      setGameState(INITIAL_STATE);
      lastSavedStateRef.current = INITIAL_STATE;
      setIsInitialized(true);
    } else if (remoteSave) {
      // Server save exists? Use it.
      console.log("Loading from Cloud - Raw Save:", JSON.stringify(remoteSave));
      // log faction specifically
      console.log("Raw Faction:", remoteSave.faction);
      const clean = sanitizeState(remoteSave);
      console.log("Sanitized Faction:", clean.faction);
      setGameState(clean);
      lastSavedStateRef.current = clean;
      setIsInitialized(true);
    }
  }, [remoteSave, saveLoading, saveError, sanitizeState, toast, user, authLoading]);

  // Reactive Save Effect (Critical Actions)
  useEffect(() => {
    if (!isInitialized || !lastSavedStateRef.current) return;

    const current = gameState;
    const last = lastSavedStateRef.current;

    const generatorsChanged = JSON.stringify(current.generators) !== JSON.stringify(last.generators);
    const realmChanged = current.realm.id !== last.realm.id || current.realm.stage !== last.realm.stage;
    const factionChanged = current.faction !== last.faction;
    const upgradesChanged = current.upgrades.length !== last.upgrades.length;
    const achievementsChanged = current.achievements.length !== last.achievements.length;

    // CRITICAL SAFETY CHECK: Do not auto-save if we are at the initial empty state.
    // This prevents overwriting a valid save with a new game if loading fails.
    const isMostlyEmpty = current.resources.totalQi === 0 && current.realm.id === 1 && Object.values(current.generators).every(v => v === 0);

    if (isMostlyEmpty && !generatorsChanged && !realmChanged && !factionChanged) {
      console.log("Skipping save - State is empty/initial");
      return;
    }

    if (generatorsChanged || realmChanged || factionChanged || upgradesChanged || achievementsChanged) {
      console.log("Critical action - Saving immediately");

      // Calculate QiPerTap for stats
      let clickPower = 1;
      Object.entries(current.generators).forEach(([type, count]) => {
        const data = GENERATOR_DATA[type];
        if (data) clickPower += count * data.clickPowerBonus;
      });
      clickPower *= current.realm.multiplier;
      if (current.faction === FactionType.enum.demonic || current.faction === FactionType.enum.righteous) {
        clickPower *= 1.1;
      }

      const toSave = {
        ...current,
        stats: { qiPerTap: clickPower },
        lastSaveTime: Date.now()
      };

      // Backup locally immediately
      localStorage.setItem("idle_ascent_save", JSON.stringify(toSave));

      saveGame(toSave);
      lastSavedStateRef.current = toSave;
    }
  }, [gameState, isInitialized, saveGame]);

  // Periodic Save (Qi/Resources Batching - 30s)
  useEffect(() => {
    if (!isInitialized) return;

    const intervalId = setInterval(() => {
      const current = stateRef.current;
      // Only save if different from last save (optimization)
      if (JSON.stringify(current) !== JSON.stringify(lastSavedStateRef.current)) {
        console.log("Periodic Batch Save (Qi/Resources)");
        const toSave = { ...current, lastSaveTime: Date.now() };
        saveGame(toSave);
        lastSavedStateRef.current = toSave;
      }
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isInitialized, saveGame]);

  // Actions
  const syncToCloud = useCallback(async () => {
    try {
      const toSave = { ...stateRef.current, lastSaveTime: Date.now() };

      // Always backup locally first
      localStorage.setItem("idle_ascent_save", JSON.stringify(toSave));

      await saveGameAsync(toSave);
      lastSavedStateRef.current = toSave;
      toast({ title: "Progress Saved", description: "Your cultivation progress has been recorded." });
    } catch (e: any) {
      // Silent fail for UX, but data is safe locally
      console.error("Server save failed (local backup active):", e);
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
      const cost = calculateCost(data.baseCost, count);

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

  const selectFaction = useCallback(async (faction: string) => {
    // 1. Compute new state based on current (safe because this is a specific user action)
    const newState: GameState = {
      ...stateRef.current, // Use Ref to avoid stale closure if dependencies lag
      faction: faction as GameState['faction']
    };

    console.log("[Faction Select] Saving New Faction:", faction);

    // 2. Update Local UI immediately
    setGameState(newState);

    // 3. Force Server Save
    try {
      await saveGameAsync(newState);
      lastSavedStateRef.current = newState;
      toast({ title: "Path Chosen", description: `You have embraced the ${faction} path.` });
    } catch (e) {
      console.error("Failed to save faction choice:", e);
      toast({ title: "Save Failed", description: "Could not record your choice. Please check connection.", variant: "destructive" });
    }
  }, [saveGameAsync, toast]);

  const hardReset = useCallback(() => {
    if (confirm("Are you sure you want to cripple your cultivation and start over?")) {
      setGameState({ ...INITIAL_STATE, faction: null });
      // Clean server save too? Ideally yes, but for now just local reset triggers save eventually
      saveGameAsync({ ...INITIAL_STATE, faction: null });
    }
  }, [saveGameAsync]);

  return {
    gameState,
    isInitialized,
    clickCultivate,
    purchaseGenerator,
    breakthrough,
    selectFaction,
    syncToCloud,
    hardReset,
    isError: saveError || false,
    isSaving: saveLoading || false,
    // True while we are waiting for the FIRST save load attempt
    isLoading: !isInitialized && saveLoading
  };
}
