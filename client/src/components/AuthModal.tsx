import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles } from "lucide-react";

interface AuthModalProps {
    open: boolean;
    onSuccess: (user: { id: number; username: string }) => void;
}

export function AuthModal({ open, onSuccess }: AuthModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });
    const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginForm),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            onSuccess(data);
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (registerForm.password !== registerForm.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (registerForm.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: registerForm.username,
                    password: registerForm.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Registration failed");
                return;
            }

            onSuccess(data);
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent
                className="sm:max-w-md bg-gradient-to-b from-background via-qi-950/30 to-background border-qi-500/30 backdrop-blur-xl"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Mystical background pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-qi-400 via-transparent to-transparent" />
                </div>

                <DialogHeader className="relative z-10 text-center space-y-3">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-full bg-gradient-to-br from-qi-600 to-qi-500 shadow-lg shadow-qi-500/50">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-3xl font-display bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent">
                        Immortal Ascension
                    </DialogTitle>
                    <DialogDescription className="text-qi-300/80">
                        Begin your cultivation journey
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="login" className="w-full relative z-10">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/30 border border-qi-500/20">
                        <TabsTrigger
                            value="login"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-qi-600 data-[state=active]:to-qi-500 data-[state=active]:text-white"
                        >
                            Enter Realm
                        </TabsTrigger>
                        <TabsTrigger
                            value="register"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-qi-600 data-[state=active]:to-qi-500 data-[state=active]:text-white"
                        >
                            Begin Journey
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                        <form onSubmit={handleLogin} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="login-username" className="text-qi-300">Daoist Name</Label>
                                <Input
                                    id="login-username"
                                    type="text"
                                    value={loginForm.username}
                                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="username"
                                    className="bg-muted/30 border-qi-500/30 focus:border-qi-400 focus:ring-qi-400/20"
                                    placeholder="Enter your name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-password" className="text-qi-300">Spirit Lock</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    className="bg-muted/30 border-qi-500/30 focus:border-qi-400 focus:ring-qi-400/20"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="border-red-500/50 bg-red-950/30">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-qi-600 to-qi-500 hover:from-qi-500 hover:to-qi-400 text-white font-semibold shadow-lg shadow-qi-500/40"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enter the Realm
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="register">
                        <form onSubmit={handleRegister} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-username" className="text-qi-300">Daoist Name</Label>
                                <Input
                                    id="register-username"
                                    type="text"
                                    value={registerForm.username}
                                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="username"
                                    className="bg-muted/30 border-qi-500/30 focus:border-qi-400 focus:ring-qi-400/20"
                                    placeholder="Choose your name..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-password" className="text-qi-300">Spirit Lock</Label>
                                <Input
                                    id="register-password"
                                    type="password"
                                    value={registerForm.password}
                                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    minLength={6}
                                    className="bg-muted/30 border-qi-500/30 focus:border-qi-400 focus:ring-qi-400/20"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="register-confirm" className="text-qi-300">Confirm Spirit Lock</Label>
                                <Input
                                    id="register-confirm"
                                    type="password"
                                    value={registerForm.confirmPassword}
                                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    autoComplete="new-password"
                                    minLength={6}
                                    className="bg-muted/30 border-qi-500/30 focus:border-qi-400 focus:ring-qi-400/20"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="border-red-500/50 bg-red-950/30">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-qi-600 to-qi-500 hover:from-qi-500 hover:to-qi-400 text-white font-semibold shadow-lg shadow-qi-500/40"
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Begin Cultivation
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>

                {/* Footer decoration */}
                <div className="relative z-10 text-center pt-4 border-t border-qi-500/20">
                    <p className="text-xs text-muted-foreground">
                        Your journey to immortality awaits
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
