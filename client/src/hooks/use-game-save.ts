import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
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
      if (res.status === 401) {
        // If 401, our session is invalid despite useAuth thinking we are logged in.
        // Force a refresh to sync auth state.
        window.location.reload();
        return null;
      }
      if (!res.ok) throw new Error("Failed to load save");
      return api.saves.get.responses[200].parse(await res.json());
    },
    // Don't refetch automatically, we control state locally mostly
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: !!useAuth().user, // Only fetch if logged in
  });

  const saveMutation = useMutation({
    mutationFn: async (data: GameState) => {
      const res = await fetch(api.saves.sync.path, {
        method: api.saves.sync.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (res.status === 401) {
        // Session expired (server restart?), force reload to login
        window.location.reload();
        throw new Error("Session expired");
      }

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
    isError: loadSaveQuery.isError, // Expose error state
    error: loadSaveQuery.error,
    saveGame: saveMutation.mutate,
    saveGameAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
