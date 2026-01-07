import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type GameStateSchema } from "@shared/routes";
import { z } from "zod";
import { GameState } from "@shared/schema";

// Hook to sync game state with backend
export function useGameSave() {
  const queryClient = useQueryClient();

  const loadSaveQuery = useQuery({
    queryKey: [api.saves.get.path],
    queryFn: async () => {
      const res = await fetch(api.saves.get.path, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to load save");
      return api.saves.get.responses[200].parse(await res.json());
    },
    // Don't refetch automatically, we control state locally mostly
    staleTime: Infinity, 
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: GameState) => {
      const res = await fetch(api.saves.sync.path, {
        method: api.saves.sync.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to sync save");
      return api.saves.sync.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Could invalidate, but local state is truth
    },
  });

  return {
    remoteSave: loadSaveQuery.data,
    isLoading: loadSaveQuery.isLoading,
    saveGame: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
