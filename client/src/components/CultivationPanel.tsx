import { motion, AnimatePresence } from "framer-motion";
import { GameState, FactionType } from "@shared/schema";
import { formatNumber, REALM_DATA, GENERATOR_DATA } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { NumberFlow } from "@/components/ui/number-flow";
import { cn } from "@/lib/utils";
import { Zap, Crown, ArrowUpCircle, Sparkles } from "lucide-react";
import { useState, useRef } from "react";
import { ParticleSystem } from "@/components/ParticleSystem";

interface CultivationPanelProps {
  state: GameState;
  onClick: () => void;
  onBreakthrough: () => void;
}

export function CultivationPanel({ state, onClick, onBreakthrough }: CultivationPanelProps) {
  const [clickEffects, setClickEffects] = useState<{ id: number, x: number, y: number, val: number }[]>([]);
  const clickIdRef = useRef(0);
  const buttonRef = useRef<HTMLDivElement>(null);

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

      // Calculate click power (same as in use-game-loop)
      let clickPower = 1;
      Object.entries(state.generators).forEach(([type, count]) => {
        clickPower += count * GENERATOR_DATA[type].clickPowerBonus;
      });
      clickPower *= state.realm.multiplier;
      if (state.faction === FactionType.enum.demonic || state.faction === FactionType.enum.righteous) {
        clickPower *= 1.1;
      }

      setClickEffects(prev => [...prev, { id: clickIdRef.current++, x, y, val: clickPower }]);

      // Cleanup effect after animation
      setTimeout(() => {
        setClickEffects(prev => prev.slice(1));
      }, 1000);
    }

    onClick();
  };

  // Click power calculation for display
  let clickPower = 1;
  Object.entries(state.generators).forEach(([type, count]) => {
    const data = GENERATOR_DATA[type];
    if (data) {
      clickPower += count * data.clickPowerBonus;
    }
  });
  clickPower *= state.realm.multiplier;
  if (state.faction === FactionType.enum.demonic || state.faction === FactionType.enum.righteous) {
    clickPower *= 1.1;
  }

  return (
    <div className="h-full flex flex-col items-center justify-start relative overflow-y-auto overflow-x-hidden bg-gradient-to-b from-background via-qi-900/10 to-background pt-8 pb-32 px-4">
      {/* Ambient Particle System */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <ParticleSystem density={40} color="#a855f7" speed={0.5} />
      </div>

      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-qi-600/10 via-transparent to-transparent pointer-events-none" />


      {/* Main Qi Display */}
      <div className="text-center relative z-10 mb-6 md:mb-12 flex-shrink-0">
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-mono font-bold bg-gradient-to-b from-qi-200 via-qi-400 to-qi-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <NumberFlow value={state.resources.qi} />
        </motion.h1>
        <div className="flex items-center justify-center gap-2 mt-3 text-qi-300 font-mono text-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="font-semibold">{formatNumber(clickPower)} Qi / tap</span>
        </div>
      </div>

      {/* Cultivation Circle/Mandala */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-96 lg:h-96 flex items-center justify-center mb-6 md:mb-12 flex-shrink-0">
        {/* Rotating Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-qi-500/30 animate-rotate-slow" />
        <div className="absolute inset-4 rounded-full border border-qi-400/20 animate-rotate-slow" style={{ animationDirection: "reverse" }} />

        {/* Cultivation Button */}
        <motion.div
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full cursor-pointer group"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-qi-500/40 via-qi-600/20 to-transparent blur-xl group-hover:from-qi-400/60 transition-all duration-300" />

          {/* Main Circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-qi-900/80 via-qi-800/60 to-qi-900/80 border-4 border-qi-500/40 group-hover:border-qi-400/60 transition-all duration-300 backdrop-blur-sm shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-qi-400/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Center Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display text-qi-300 group-hover:text-qi-200 tracking-widest transition-all duration-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
              CULTIVATE
            </span>
          </div>

          {/* Click Effects */}
          <AnimatePresence>
            {clickEffects.map(effect => (
              <motion.span
                key={effect.id}
                initial={{ opacity: 1, y: effect.y, x: effect.x, scale: 0.5 }}
                animate={{ opacity: 0, y: effect.y - 100, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute text-2xl font-mono font-bold text-qi-300 pointer-events-none drop-shadow-[0_0_10px_rgba(168,85,247,1)]"
                style={{ left: 0, top: 0 }}
              >
                +{formatNumber(effect.val)}
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Orbiting Energy Particles */}
        <div className="absolute inset-0 animate-rotate-slow pointer-events-none">
          <div className="absolute top-0 left-1/2 w-3 h-3 bg-qi-400 rounded-full blur-sm shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-qi-500 rounded-full blur-sm shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        </div>
        <div className="absolute inset-0 animate-rotate-slow pointer-events-none" style={{ animationDuration: "15s", animationDirection: "reverse" }}>
          <div className="absolute top-1/2 left-0 w-2 h-2 bg-qi-300 rounded-full blur-sm shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
          <div className="absolute top-1/2 right-0 w-2 h-2 bg-qi-600 rounded-full blur-sm shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
        </div>
      </div>

      {/* Breakthrough Section */}
      <div className="w-full max-w-md px-4 md:px-6 z-10 flex-shrink-0">
        <div className="flex justify-between text-xs text-qi-300/80 uppercase tracking-widest mb-2 font-display">
          <span>Progress to {nextRealm?.label || "Transcendence"}</span>
          <span>{formatNumber(state.resources.qi)} / {nextRealm ? formatNumber(requiredQi) : "∞"}</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted/30 rounded-full overflow-hidden border border-qi-500/20">
          <motion.div
            className="h-full bg-gradient-to-r from-qi-600 via-qi-500 to-qi-400 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.6)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ backgroundSize: "200% 100%" }} />
        </div>

        {/* Breakthrough Button */}
        {canBreakthrough && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-6"
          >
            <Button
              onClick={onBreakthrough}
              size="lg"
              className="bg-gradient-to-r from-qi-600 to-qi-500 hover:from-qi-500 hover:to-qi-400 text-white font-bold shadow-lg shadow-qi-500/50 border-2 border-qi-400/50 animate-pulse-glow"
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Attempt Breakthrough
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
