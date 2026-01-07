import { useMutation } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export function useAuth() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: number, username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.users.login.path, {
        method: api.users.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Invalid credentials");
      }
      return api.users.login.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Welcome back, Daoist " + data.username });
    },
    onError: (err) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.users.register.path, {
        method: api.users.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      return api.users.register.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      setUser(data);
      toast({ title: "Welcome to the path, Daoist " + data.username });
    },
    onError: (err) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    }
  });

  const logout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
      setUser(null);
      toast({ title: "Logged out successfully" });
      // Reload to clear any cached state
      window.location.reload();
    } catch (err) {
      toast({ title: "Logout failed", variant: "destructive" });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isPending: loginMutation.isPending || registerMutation.isPending,
    setUser,
  };
}
