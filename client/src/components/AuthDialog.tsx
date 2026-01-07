import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User } from "lucide-react";

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const { login, register, isPending, user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const action = isRegister ? register : login;
    
    action({ username, password }, {
      onSuccess: () => setIsOpen(false)
    });
  };

  if (user) {
    return (
      <div className="flex items-center gap-2 text-primary font-mono text-sm px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
        <User className="w-4 h-4" />
        <span>{user.username}</span>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
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
