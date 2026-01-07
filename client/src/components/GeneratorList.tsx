import { motion } from "framer-motion";
import { GameState, GeneratorType } from "@shared/schema";
import { formatNumber, GENERATOR_DATA } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Zap, Lock, Sparkles, TrendingUp } from "lucide-react";

interface GeneratorListProps {
  state: GameState;
  onBuy: (type: string) => void;
}

const calculateCost = (baseCost: number, owned: number) => {
  return Math.floor(baseCost * Math.pow(1.15, owned));
};

// Icon mapping for generators
const generatorIcons: Record<string, string> = {
  meditation_mat: "🧘",
  spirit_well: "⛲",
  inner_disciple: "👤",
  qi_formation: "🔮",
  spirit_vein: "💎",
  ancient_array: "⚡",
  heavenly_sect: "🏛️",
};

export function GeneratorList({ state, onBuy }: GeneratorListProps) {
  const currentQi = state.resources.qi;
  const userGenerators = state.generators;
  const generators = Object.entries(GENERATOR_DATA);

  return (
    <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
      <div className="space-y-3 pb-10">
        {generators.map(([type, data], index) => {
          const count = userGenerators[type as keyof typeof userGenerators] ?? 0;
          const cost = calculateCost(data.baseCost, count);
          const canAfford = currentQi >= cost;

          // Hide generators that are too expensive (discovery mechanic)
          const prevType = index > 0 ? generators[index - 1][0] : null;
          const hasPrev = prevType ? (userGenerators[prevType as keyof typeof userGenerators] ?? 0) > 0 : true;

          if (count === 0 && !hasPrev && cost > currentQi * 5) {
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-32 rounded-xl border border-qi-500/20 bg-gradient-to-br from-qi-900/20 to-qi-800/10 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-qi-500/5 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
                <div className="flex flex-col items-center gap-2 text-qi-400/40">
                  <Lock className="w-8 h-8" />
                  <span className="text-sm font-display">Mysterious Technique</span>
                </div>
              </motion.div>
            );
          }

          const productionPerTap = data.clickPowerBonus * state.realm.multiplier;
          const isMaxed = count >= 100; // Arbitrary max for visual feedback

          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden transition-all duration-300",
                canAfford && !isMaxed
                  ? "border-qi-500/60 bg-gradient-to-br from-qi-900/40 to-qi-800/30 shadow-lg shadow-qi-500/20"
                  : count > 0
                    ? "border-qi-600/30 bg-gradient-to-br from-qi-900/30 to-qi-800/20"
                    : "border-muted/30 bg-gradient-to-br from-muted/10 to-muted/5",
                isMaxed && "border-celestial-gold/50 bg-gradient-to-br from-celestial-gold/20 to-celestial-gold/10"
              )}
            >
              {/* Glow effect for affordable items */}
              {canAfford && !isMaxed && (
                <div className="absolute inset-0 bg-gradient-to-r from-qi-500/10 via-qi-400/20 to-qi-500/10 animate-pulse-glow pointer-events-none" />
              )}

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" style={{ backgroundSize: "200% 100%" }} />

              <div className="relative p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "w-16 h-16 rounded-lg flex items-center justify-center text-3xl transition-all duration-300 shrink-0",
                    canAfford && !isMaxed
                      ? "bg-gradient-to-br from-qi-600/40 to-qi-700/40 shadow-lg shadow-qi-500/30"
                      : "bg-gradient-to-br from-qi-800/30 to-qi-900/30"
                  )}>
                    {generatorIcons[type] || "✨"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className={cn(
                          "font-display text-lg font-semibold tracking-wide",
                          canAfford && !isMaxed ? "text-qi-200" : "text-qi-300/80"
                        )}>
                          {data.label}
                        </h3>
                        {count > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-qi-400 font-mono">Owned: {count}</span>
                          </div>
                        )}
                      </div>

                      {/* Cost Badge */}
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-mono font-semibold whitespace-nowrap",
                        canAfford && !isMaxed
                          ? "bg-qi-500/30 text-qi-200 border border-qi-400/50"
                          : "bg-muted/30 text-muted-foreground border border-muted/30"
                      )}>
                        {formatNumber(cost)} Qi
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {data.description}
                    </p>

                    {/* Stats and Button */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-qi-400 font-mono">
                          <Zap className="w-3.5 h-3.5" />
                          <span className="font-semibold">+{formatNumber(productionPerTap)}/tap</span>
                        </div>
                        {count > 0 && (
                          <div className="flex items-center gap-1.5 text-celestial-jade font-mono">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="font-semibold">{formatNumber(productionPerTap * count)}/tap total</span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => onBuy(type)}
                        disabled={!canAfford || isMaxed}
                        size="sm"
                        className={cn(
                          "font-semibold transition-all duration-300",
                          canAfford && !isMaxed
                            ? "bg-gradient-to-r from-qi-600 to-qi-500 hover:from-qi-500 hover:to-qi-400 text-white shadow-lg shadow-qi-500/40 border border-qi-400/50"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/70",
                          isMaxed && "bg-celestial-gold/20 text-celestial-gold border-celestial-gold/50"
                        )}
                      >
                        {isMaxed ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            Mastered
                          </>
                        ) : count > 0 ? (
                          "Upgrade"
                        ) : (
                          "Acquire"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
