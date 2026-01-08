import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { FactionType } from "@shared/schema";
import { FACTION_DATA } from "@/lib/game-constants";
import { Flame, Shield, Sparkles } from "lucide-react";

interface FactionModalProps {
  open: boolean;
  onSelect: (faction: string) => void;
}

const factionIcons: Record<string, React.ReactNode> = {
  demonic: <Flame className="w-16 h-16" />,
  righteous: <Shield className="w-16 h-16" />,
  heavenly: <Sparkles className="w-16 h-16" />,
};

const factionGradients: Record<string, string> = {
  demonic: "from-red-600 via-red-500 to-orange-500",
  righteous: "from-blue-600 via-blue-500 to-cyan-500",
  heavenly: "from-amber-600 via-yellow-500 to-amber-400",
};

const factionBg: Record<string, string> = {
  demonic: "from-red-950/40 to-red-900/20",
  righteous: "from-blue-950/40 to-blue-900/20",
  heavenly: "from-amber-950/40 to-amber-900/20",
};

const factionBorder: Record<string, string> = {
  demonic: "border-red-500/50 hover:border-red-400/70",
  righteous: "border-blue-500/50 hover:border-blue-400/70",
  heavenly: "border-amber-500/50 hover:border-amber-400/70",
};

const factionLore: Record<string, string> = {
  demonic: "Walk the path of power through unorthodox methods. Embrace the darkness to achieve rapid cultivation.",
  righteous: "Follow the orthodox path of virtue and discipline. Strengthen your foundation through righteous cultivation.",
  heavenly: "Seek balance and enlightenment. Reduce the burden of breakthroughs through celestial wisdom.",
};

export function FactionModal({ open, onSelect }: FactionModalProps) {
  const factions = Object.entries(FACTION_DATA);

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent
        className="sm:max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-background via-qi-950/30 to-background border-qi-500/30 backdrop-blur-xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-4 pb-6">
          <DialogTitle className="text-4xl font-display bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent">
            Choose Your Path
          </DialogTitle>
          <DialogDescription className="text-base text-qi-300/80">
            Select your cultivation path. This choice will shape your journey through the realms.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6">
          {factions.map(([key, data], index) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(key)}
              className={`relative group rounded-2xl border-2 ${factionBorder[key]} bg-gradient-to-br ${factionBg[key]} p-6 transition-all duration-300 overflow-hidden`}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${factionGradients[key]} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" style={{ backgroundSize: "200% 100%" }} />

              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                {/* Icon */}
                <div className={`p-4 rounded-full bg-gradient-to-br ${factionGradients[key]} text-white shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}>
                  {factionIcons[key]}
                </div>

                {/* Faction Name */}
                <h3 className={`text-2xl font-display font-bold bg-gradient-to-r ${factionGradients[key]} bg-clip-text text-transparent`}>
                  {data.label}
                </h3>

                {/* Benefit */}
                <div className="px-4 py-2 rounded-full bg-muted/30 border border-muted/50">
                  <p className="text-sm font-semibold text-qi-300">{data.description}</p>
                </div>

                {/* Lore */}
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[3rem]">
                  {factionLore[key]}
                </p>

                {/* Select indicator */}
                <div className="pt-2">
                  <div className={`px-6 py-2 rounded-lg bg-gradient-to-r ${factionGradients[key]} text-white font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg`}>
                    Choose Path
                  </div>
                </div>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-current opacity-20 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-current opacity-20 rounded-br-2xl" />
            </motion.button>
          ))}
        </div>

        {/* Footer note */}
        <div className="text-center pt-4 border-t border-qi-500/20">
          <p className="text-xs text-muted-foreground">
            Your choice is permanent and will influence your cultivation journey
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
