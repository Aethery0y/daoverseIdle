import { GameState } from "@shared/schema";
import { GENERATOR_DATA, formatNumber } from "@/lib/game-constants";
import { calculateCost } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface GeneratorListProps {
  state: GameState;
  onBuy: (type: string) => void;
}

export function GeneratorList({ state, onBuy }: GeneratorListProps) {
  const generators = Object.entries(GENERATOR_DATA);
  const userGenerators = state.generators;
  const currentQi = state.resources.qi;

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
      <div className="space-y-4 pb-10">
        {generators.map(([type, data], index) => {
          const count = userGenerators[type as keyof typeof userGenerators];
          const cost = calculateCost(data.baseCost, count);
          const canAfford = currentQi >= cost;
          
          // Hide generators that are too expensive (discovery mechanic)
          // Show if: owned > 0 OR cost <= currentQi * 100 OR previous generator > 0
          const prevType = index > 0 ? generators[index-1][0] : null;
          const hasPrev = prevType ? userGenerators[prevType as keyof typeof userGenerators] > 0 : true;
          
          if (count === 0 && !hasPrev && cost > currentQi * 5) {
             return (
               <div key={type} className="h-24 rounded-xl border border-muted/30 bg-muted/5 flex items-center justify-center">
                 <div className="flex items-center gap-2 text-muted-foreground/30">
                   <Lock className="w-4 h-4" />
                   <span className="text-sm font-display">Locked</span>
                 </div>
               </div>
             );
          }

          return (
            <motion.div 
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group relative bg-card border rounded-xl p-4 transition-all duration-200",
                canAfford ? "border-muted hover:border-primary/50" : "border-muted/30 opacity-70"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={cn("font-display text-lg", count > 0 ? "text-primary" : "text-muted-foreground")}>
                    {data.label}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{data.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-foreground">{count}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Owned</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                  <Zap className="w-3 h-3" />
                  <span>+{formatNumber(data.baseProduction * state.realm.multiplier)}/s</span>
                </div>
                
                <Button 
                  size="sm"
                  variant={canAfford ? "default" : "secondary"}
                  disabled={!canAfford}
                  onClick={() => onBuy(type)}
                  className={cn(
                    "min-w-[100px] font-mono text-xs transition-all",
                    canAfford ? "bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20" : ""
                  )}
                >
                  Cost: {formatNumber(cost)}
                </Button>
              </div>
              
              {/* Progress bar background for cost visualization if affordable-ish */}
              {currentQi < cost && currentQi > 0 && (
                 <div 
                   className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-500 rounded-b-xl" 
                   style={{ width: `${Math.min(100, (currentQi / cost) * 100)}%` }} 
                 />
              )}
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
