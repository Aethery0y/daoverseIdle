import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User, ChevronDown } from "lucide-react";
import { ProfilePanel } from "@/components/ProfilePanel";

export function AuthDialog({ onLogout }: { onLogout?: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const { login, register, isPending, user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = isRegister ? register : login;

    action({ username, password }, {
      onSuccess: () => setIsOpen(false)
    });
  };

  if (user) {
    const avatar = localStorage.getItem('userAvatar');

    return (
      <>
        <button
          onClick={() => setProfileOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-qi-600/20 to-qi-500/20 border-2 border-qi-500/40 hover:border-qi-400/60 transition-all duration-300 hover:shadow-lg hover:shadow-qi-500/30 group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-qi-600 to-qi-500 p-0.5 shadow-md">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-qi-400" />
              )}
            </div>
          </div>
          <span className="font-mono text-sm text-qi-300 font-semibold">{user.username}</span>
          <ChevronDown className="w-4 h-4 text-qi-400 group-hover:text-qi-300 transition-colors" />
        </button>

        <ProfilePanel open={profileOpen} onOpenChange={setProfileOpen} onLogout={onLogout} />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-qi-500/30 hover:bg-qi-500/10 hover:border-qi-400/50">
          <User className="w-4 h-4" />
          Cloud Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">
            {isRegister ? "Join the Sect" : "Enter the Archives"}
          </DialogTitle>
          <DialogDescription>
            {isRegister
              ? "Create a spiritual identity to preserve your cultivation across realms."
              : "Access your existing cultivation progress."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Daoist Name</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="bg-muted border-border focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label>Spirit Lock (Password)</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-muted border-border focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={isPending} className="w-full font-bold">
              {isPending ? "Connecting..." : (isRegister ? "Begin Journey" : "Access Archives")}
            </Button>

            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors text-center mt-2"
            >
              {isRegister ? "Already a disciple? Login" : "New to the path? Register"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
