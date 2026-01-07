import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FACTION_DATA } from "@/lib/game-constants";
import { Scroll, Skull, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FactionModalProps {
  open: boolean;
  onSelect: (faction: string) => void;
}

export function FactionModal({ open, onSelect }: FactionModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-4xl bg-background border-border" showClose={false}>
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-3xl font-display text-primary">Choose Your Dao</DialogTitle>
          <DialogDescription className="text-lg">
            Every cultivator must walk a path. This choice will determine your destiny.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(FACTION_DATA).map(([key, data]) => {
            let Icon = Zap;
            if (key === 'demonic') Icon = Skull;
            if (key === 'righteous') Icon = Scroll;

            return (
              <Card 
                key={key} 
                className="group relative overflow-hidden border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 cursor-pointer bg-card/50"
                onClick={() => onSelect(key)}
              >
                <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500", 
                  key === 'demonic' ? 'bg-red-500' : key === 'righteous' ? 'bg-blue-500' : 'bg-amber-500')} 
                />
                
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-4 rounded-full bg-muted group-hover:scale-110 transition-transform duration-300">
                    <Icon className={cn("w-8 h-8", data.color)} />
                  </div>
                  <CardTitle className={cn("text-xl", data.color)}>{data.label}</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <p className="text-muted-foreground">{data.description}</p>
                  <Button 
                    className="w-full font-bold tracking-wider" 
                    variant={key === 'demonic' ? 'destructive' : 'default'}
                  >
                    SELECT PATH
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
