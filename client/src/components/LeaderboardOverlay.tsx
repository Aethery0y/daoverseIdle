import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Crown, Trophy, Medal, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/game-constants";

interface LeaderboardEntry {
    id: number;
    username: string;
    avatar: string;
    qiPerTap: number;
}

export function LeaderboardOverlay() {
    const [open, setOpen] = useState(false);

    const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
        queryKey: ["/api/leaderboard"],
        queryFn: async () => {
            const res = await fetch("/api/leaderboard");
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: open, // Only fetch when opened
    });

    const getRankStyle = (index: number) => {
        switch (index) {
            case 0: return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-500";
            case 1: return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50 text-gray-400";
            case 2: return "bg-gradient-to-r from-orange-700/20 to-amber-900/20 border-orange-700/50 text-orange-700";
            default: return "bg-card/40 border-white/5 text-muted-foreground";
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500/20 animate-pulse" />;
            case 1: return <Medal className="w-5 h-5 text-gray-400" />;
            case 2: return <Medal className="w-5 h-5 text-orange-700" />;
            default: return <span className="font-mono font-bold text-sm w-5 text-center">{index + 1}</span>;
        }
    };

    return (
        <>
            {/* Floating Crown Button */}
            <motion.button
                drag
                dragMomentum={false}
                // Allow dragging anywhere, but maybe constrain roughly to window?
                // For now, free drag is best for "doesn't bother user".
                whileDrag={{ scale: 1.2, cursor: "grabbing" }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1, cursor: "grab" }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setOpen(true)}
                className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600 to-amber-800 border-2 border-yellow-500/50 shadow-lg shadow-black/50 flex items-center justify-center group touch-none"
            >
                <div className="absolute inset-0 rounded-full animate-pulse-glow bg-yellow-500/20" />
                <Crown className="w-6 h-6 text-yellow-100 group-hover:text-white transition-colors drop-shadow-md" />
            </motion.button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md bg-gradient-to-b from-qi-950 via-background to-qi-950 border-qi-500/30 backdrop-blur-xl h-[80vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle className="text-2xl font-display text-center flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                            <Trophy className="w-6 h-6 text-amber-500" />
                            Heavenly Ranking
                        </DialogTitle>
                        <p className="text-center text-xs text-muted-foreground">The most powerful cultivators by raw output.</p>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                        ) : (
                            leaderboard?.map((entry, index) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${getRankStyle(index)} backdrop-blur-sm relative overflow-hidden`}
                                >
                                    {/* Rank Icon */}
                                    <div className="flex-shrink-0 w-8 flex justify-center">
                                        {getRankIcon(index)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex-shrink-0">
                                        {entry.avatar ? (
                                            <img src={entry.avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-5 h-5 opacity-50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate text-white/90">
                                            {entry.username}
                                        </div>
                                        <div className="text-xs opacity-70 flex items-center gap-1 font-mono">
                                            {formatNumber(entry.qiPerTap)} Qi/tap
                                        </div>
                                    </div>

                                    {/* Shine effect for top 1 */}
                                    {index === 0 && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" style={{ backgroundSize: '200% 100%' }} />
                                    )}
                                </motion.div>
                            ))
                        )}

                        {!isLoading && leaderboard?.length === 0 && (
                            <div className="text-center p-8 text-muted-foreground">
                                No cultivators have established their name yet.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
