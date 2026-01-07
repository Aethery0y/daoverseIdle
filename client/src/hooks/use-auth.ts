import { useMutation } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function useAuth() {
  const { toast } = useToast();
  const [user, setUser] = useState<{id: number, username: string} | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.users.login.path, {
        method: api.users.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Invalid credentials");
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
      if (!res.ok) throw new Error("Registration failed");
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

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    isPending: loginMutation.isPending || registerMutation.isPending
  };
}
