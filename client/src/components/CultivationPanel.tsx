import { motion, AnimatePresence } from "framer-motion";
import { GameState, FactionType } from "@shared/schema";
import { formatNumber, GENERATOR_DATA, getRealm, getNextRealm, calculateRequiredQi } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { NumberFlow } from "@/components/ui/number-flow";
import { ArrowUpCircle, Sparkles, Globe, Zap } from "lucide-react";
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

  const currentRealmData = getRealm(state.realm.id);

  // Calculate Requirement using helpers
  let requiredQi = calculateRequiredQi(state.realm.id, state.realm.stage);

  // Discount Logic
  if (state.faction === FactionType.enum.heavenly) {
    requiredQi *= 0.9;
  }

  const progress = Math.min(100, (state.resources.qi / requiredQi) * 100);
  const canBreakthrough = state.resources.qi >= requiredQi;

  // Determine Next Label
  let nextLabel = "Transcending...";
  if (currentRealmData) {
    if (state.realm.stage < currentRealmData.stages) {
      nextLabel = `${state.realm.name} Stage ${state.realm.stage + 1}`;
    } else {
      const nextData = getNextRealm(state.realm.id);
      nextLabel = nextData ? nextData.name : "Supreme Transcendence";
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Add floating number effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate click power (Should reuse helper or cache, but simplest is re-calc for animation)
      // Actually rely on cached multiplier for efficiency in loop, here it's visual
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


      {/* Main Content Wrapper - Constrained width for desktop responsiveness */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center relative z-10">

        {/* World & Realm Header */}
        <div className="mb-8 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-qi-400 text-sm uppercase tracking-widest font-display">
            <Globe className="w-3 h-3" />
            {state.realm.world || "Unknown World"}
          </div>
          <div className="text-2xl font-display text-qi-200 bg-gradient-to-br from-white to-qi-300 bg-clip-text text-transparent">
            {state.realm.name} <span className="text-qi-500 text-lg">Stage {state.realm.stage}</span>
          </div>
        </div>

        {/* Main Qi Display */}
        <div className="text-center mb-4 md:mb-10 flex-shrink-0 w-full">
          <motion.h1
            className="text-4xl sm:text-6xl md:text-7xl font-mono font-bold bg-gradient-to-b from-qi-200 via-qi-400 to-qi-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <NumberFlow value={state.resources.qi} />
          </motion.h1>
          <div className="flex items-center justify-center gap-2 mt-2 md:mt-3 text-qi-300 font-mono text-xs md:text-sm shadow-sm backdrop-blur-sm bg-background/20 rounded-full px-4 py-1 border border-qi-500/20 inline-flex">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
            <span className="font-semibold">{formatNumber(clickPower)} Qi / tap</span>
          </div>
        </div>

        {/* Cultivation Circle/Mandala - Made smaller for mobile */}
        <div className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center mb-6 md:mb-10 flex-shrink-0">
          {/* Rotating Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-qi-500/30 animate-rotate-slow" />
          <div className="absolute inset-4 rounded-full border border-qi-400/20 animate-rotate-slow" style={{ animationDirection: "reverse" }} />

          {/* Cultivation Button */}
          <motion.div
            ref={buttonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="relative w-44 h-44 sm:w-60 sm:h-60 md:w-64 md:h-64 rounded-full cursor-pointer group"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-radial from-qi-500/40 via-qi-600/20 to-transparent blur-xl group-hover:from-qi-400/60 transition-all duration-300" />

            {/* Main Circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-qi-900/80 via-qi-800/60 to-qi-900/80 border-4 border-qi-500/40 group-hover:border-qi-400/60 transition-all duration-300 backdrop-blur-sm shadow-[0_0_60px_-10px_rgba(168,85,247,0.6)]">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-qi-400/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl sm:text-3xl font-display text-qi-300 group-hover:text-qi-200 tracking-widest transition-all duration-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
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
        <div className="w-full max-w-md px-4 md:px-0 z-10 flex-shrink-0">
          <div className="flex justify-between text-xs text-qi-300/80 uppercase tracking-widest mb-2 font-display">
            <span>Progress to {nextLabel}</span>
            <span>{formatNumber(state.resources.qi)} / {formatNumber(requiredQi)}</span>
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
    </div>
  );
}
