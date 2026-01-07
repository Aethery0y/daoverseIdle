import { motion, AnimatePresence } from "framer-motion";
import { GameState, FactionType } from "@shared/schema";
import { formatNumber, REALM_DATA, GENERATOR_DATA } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NumberFlow } from "@/components/ui/number-flow";
import { cn } from "@/lib/utils";
import { Zap, Crown, ArrowUpCircle } from "lucide-react";
import { useState, useRef } from "react";

interface CultivationPanelProps {
  state: GameState;
  onClick: () => void;
  onBreakthrough: () => void;
}

export function CultivationPanel({ state, onClick, onBreakthrough }: CultivationPanelProps) {
  const [clickEffects, setClickEffects] = useState<{id: number, x: number, y: number, val: number}[]>([]);
  const clickIdRef = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentRealm = REALM_DATA[state.realm.name];
  
  // Calculate potential next realm requirement
  const realms = Object.keys(REALM_DATA);
  const currentIndex = realms.indexOf(state.realm.name);
  const nextRealmKey = realms[currentIndex + 1];
  const nextRealm = nextRealmKey ? REALM_DATA[nextRealmKey] : null;

  // Cost reduction logic for display
  let requiredQi = nextRealm?.requiredQi || Infinity;
  if (state.faction === FactionType.enum.heavenly) {
    requiredQi *= 0.9;
  }
  
  const progress = nextRealm ? Math.min(100, (state.resources.qi / requiredQi) * 100) : 100;
  const canBreakthrough = nextRealm && state.resources.qi >= requiredQi;

  const handleClick = (e: React.MouseEvent) => {
    // Add floating number effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      let clickPower = 1 * state.realm.multiplier;
      if (state.faction === FactionType.enum.demonic) clickPower *= 1.1;

      setClickEffects(prev => [...prev, { id: clickIdRef.current++, x, y, val: clickPower }]);
      
      // Cleanup effect after animation
      setTimeout(() => {
        setClickEffects(prev => prev.slice(1));
      }, 1000);
    }
    
    onClick();
  };

  // Passive calculation for display
  let passivePerSec = 0;
  Object.entries(state.generators).forEach(([type, count]) => {
    passivePerSec += count * GENERATOR_DATA[type].baseProduction;
  });
  passivePerSec *= state.realm.multiplier;
  if (state.faction === FactionType.enum.righteous) passivePerSec *= 1.1;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 p-6 relative overflow-hidden">
      {/* Background ambient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      {/* Realm Badge */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="bg-card/80 backdrop-blur border border-accent/20 px-4 py-1 rounded-full flex items-center gap-2 shadow-lg animate-float">
          <Crown className="w-4 h-4 text-accent" />
          <span className="text-accent font-display tracking-widest uppercase text-sm">
            {currentRealm.label} (x{state.realm.multiplier})
          </span>
        </div>
        
        {/* Main Qi Display */}
        <div className="text-center relative">
          <h1 className="text-6xl md:text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 text-glow tracking-tight">
            <NumberFlow value={state.resources.qi} />
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2 flex items-center justify-center gap-2">
            <Zap className="w-3 h-3" />
            <span>{formatNumber(passivePerSec)} Qi / sec</span>
          </p>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        {/* Cultivate Button */}
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="relative w-full h-full rounded-full bg-gradient-to-br from-background to-card border-4 border-primary/20 shadow-[0_0_50px_-10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_70px_-5px_rgba(34,197,94,0.4)] hover:border-primary/50 transition-all duration-300 group z-20 flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          
          <span className="relative z-10 text-3xl font-display text-primary/80 group-hover:text-primary tracking-widest group-hover:tracking-[0.2em] transition-all duration-300">
            CULTIVATE
          </span>

          {/* Click effects */}
          <AnimatePresence>
            {clickEffects.map(effect => (
              <motion.span
                key={effect.id}
                initial={{ opacity: 1, y: effect.y, x: effect.x, scale: 0.5 }}
                animate={{ opacity: 0, y: effect.y - 100, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute text-xl font-mono font-bold text-accent pointer-events-none"
                style={{ left: 0, top: 0 }} // Positioning handled by initial x/y relative to container
              >
                +{formatNumber(effect.val)}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>

        {/* Orbiting Particles (Decoration) */}
        <div className="absolute inset-0 animate-spin-slow pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full blur-[2px]" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-secondary rounded-full blur-[2px]" />
        </div>
      </div>

      {/* Breakthrough Section */}
      <div className="w-full max-w-md space-y-2 z-10">
        <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-widest">
          <span>Progress to {nextRealm?.label || "Max Realm"}</span>
          <span>{formatNumber(state.resources.qi)} / {nextRealm ? formatNumber(requiredQi) : "∞"}</span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2 bg-muted/50" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
          {canBreakthrough && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-0 right-0 flex justify-center"
            >
              <Button 
                onClick={onBreakthrough}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 animate-pulse-glow"
              >
                <ArrowUpCircle className="w-4 h-4 mr-2" />
                Attempt Breakthrough
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
