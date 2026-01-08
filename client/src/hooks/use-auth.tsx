import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  avatar?: string;
  theme?: string;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (data: InsertUser) => void;
  register: (data: InsertUser) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const user = await res.json();
          setUser(user);
        } else {
          setUser(null);
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
        throw new Error(error.message || "Login failed");
      }
      return api.users.login.responses[200].parse(await res.json());
    },
    onSuccess: (user: User) => {
      setUser(user);
      toast({ title: "Welcome back, Daoist " + user.username });
    },
    onError: (err: Error) => {
      setError(err);
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
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
    onSuccess: (user: User) => {
      setUser(user);
      toast({ title: "Welcome to the path, Daoist " + user.username });
    },
    onError: (err: Error) => {
      setError(err);
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  const logout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed, forcing local cleanup", err);
    } finally {
      setUser(null);
      toast({ title: "Logged out" });
      window.location.reload();
    }
  };

  const contextValue = {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={contextValue} >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
