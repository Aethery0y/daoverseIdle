import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGameLoop } from "@/hooks/use-game-loop";
import { useAuth } from "@/hooks/use-auth";
import { CultivationPanel } from "@/components/CultivationPanel";
import { GeneratorList } from "@/components/GeneratorList";
import { ConnectionsPanel } from "@/components/ConnectionsPanel";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { FactionModal } from "@/components/FactionModal";
import { AuthDialog } from "@/components/AuthDialog";
import { AuthModal } from "@/components/AuthModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scroll, Zap, Users, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaderboardOverlay } from "@/components/LeaderboardOverlay";
import { motion, AnimatePresence } from "framer-motion";

import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  useWebSocket();
  const { user, isLoading: authLoading, setUser, logout } = useAuth();
  const {
    gameState,
    isInitialized,
    clickCultivate,
    purchaseGenerator,
    breakthrough,
    selectFaction,
    syncToCloud,
    hardReset,
    isError
  } = useGameLoop();

  const [activeTab, setActiveTab] = useState<"cultivate" | "assets" | "connections" | "notifications">("cultivate");

  // Poll for Unread Notifications Count
  const { data: notifications } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.read).length : 0;



  // Show loading while checking authentication


  // Show loading while checking authentication (User identity only)
  if (authLoading) return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-primary font-display text-xl">Entering the Dao...</div>
    </div>
  );

  // CRITICAL: Show auth modal if not authenticated.
  // This MUST precede the Blocking Error State, otherwise a 401 save error will block login.
  if (!user) {
    return <AuthModal open={true} onSuccess={setUser} />;
  }

  // BLOCKING ERROR STATE (Only if we have no data)
  // If we have data (isInitialized && totalQi > 0), we let them play offline.
  // But if we failed to load and are sitting at 0, we MUST block to prevent confusion.
  if (isError && isInitialized && gameState.resources.totalQi === 0) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col gap-4 items-center justify-center p-4">
        <div className="text-red-500 font-display text-xl mb-2">Connection Failed</div>
        <p className="text-muted-foreground text-center mb-4">
          Could not retrieve your cultivation progress.
          <br />
          <span className="text-xs opacity-70">Preventing new game to protect your save.</span>
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Retry Connection
          </Button>
          <Button
            onClick={logout}
            variant="outline"
            className="border-red-500/50 text-red-400"
          >
            Log Out
          </Button>
        </div>
      </div>
    );
  }

  // Show proper loading screen while initializing game state
  if (!isInitialized) return (
    <div className="h-screen w-screen bg-black/95 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambient Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-qi-900/20 to-black pointer-events-none" />
      
      {/* Loading Icon */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 border-qi-500/30 border-t-qi-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="h-2 w-2 bg-qi-200 rounded-full animate-pulse shadow-[0_0_10px_#fff]" />
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-2 relative z-10">
        <h2 className="text-2xl font-display text-transparent bg-clip-text bg-gradient-to-r from-qi-200 to-qi-500 animate-pulse">
            Resonating with the Dao...
        </h2>
        <p className="text-muted-foreground text-xs tracking-widest uppercase opacity-70">
            Fetching Soul Imprint
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-b from-background via-qi-950/10 to-background text-foreground overflow-hidden flex flex-col select-none">

      {/* Required Modal for New Players */}
      {/* Required Modal for New Players - Only show after we are fully initialized */}
      {isInitialized && <FactionModal open={!gameState.faction} onSelect={selectFaction} />}

      {/* Top Header */}
      <div className="p-4 md:p-6 flex justify-between items-start bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm border-b border-qi-500/20 z-50">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl md:text-3xl bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent tracking-wider drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            Immortal Ascension
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isError && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 mr-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 font-medium">Sync Error</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={syncToCloud}
            title={isError ? "Connection Failed - Click to Retry" : "Sync Save"}
            className="hover:bg-qi-500/10 hover:text-qi-400"
          >
            <span className={`h-2 w-2 rounded-full ${isError ? 'bg-red-500' : 'bg-celestial-jade'} animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]`} />
          </Button>
          <AuthDialog onLogout={syncToCloud} gameState={gameState} />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-background/50">
        <AnimatePresence mode="wait">
          {activeTab === "cultivate" && (
            <motion.div
              key="cultivate"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 overflow-hidden relative">
                <CultivationPanel
                  state={gameState}
                  onClick={clickCultivate}
                  onBreakthrough={breakthrough}
                />
              </div>
            </motion.div>
          )}
          {activeTab === "assets" && (
            <motion.div
              key="assets"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 overflow-y-auto p-6 pb-32">
                <h2 className="font-display text-2xl mb-6 bg-gradient-to-r from-qi-200 to-qi-400 bg-clip-text text-transparent text-center">
                  Spiritual Assets
                </h2>
                <GeneratorList
                  state={gameState}
                  onBuy={purchaseGenerator}
                />
              </div>
            </motion.div>
          )}
          {activeTab === "connections" && (
            <motion.div
              key="connections"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ConnectionsPanel />
            </motion.div>
          )}
          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NotificationsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-qi-500/20 bg-background/95 backdrop-blur-xl fixed bottom-0 w-full z-50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto relative">
          <button
            onClick={() => setActiveTab("cultivate")}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === "cultivate" ? "text-qi-400 scale-110" : "text-muted-foreground hover:text-qi-300"}`}
          >
            <div className={`p-1 rounded-full ${activeTab === "cultivate" ? "bg-qi-500/10" : ""}`}>
              <Zap className={`w-5 h-5 ${activeTab === "cultivate" ? "text-qi-500 drop-shadow-glow" : ""}`} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">Cultivate</span>
          </button>

          <button
            onClick={() => setActiveTab("assets")}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === "assets" ? "text-qi-400 scale-110" : "text-muted-foreground hover:text-qi-300"}`}
          >
            <div className={`p-1 rounded-full ${activeTab === "assets" ? "bg-qi-500/10" : ""}`}>
              <Scroll className={`w-5 h-5 ${activeTab === "assets" ? "text-qi-500 drop-shadow-glow" : ""}`} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">Assets</span>
          </button>

          <button
            onClick={() => setActiveTab("connections")}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === "connections" ? "text-qi-400 scale-110" : "text-muted-foreground hover:text-qi-300"}`}
          >
            <div className={`p-1 rounded-full ${activeTab === "connections" ? "bg-qi-500/10" : ""}`}>
              <Users className={`w-5 h-5 ${activeTab === "connections" ? "text-qi-500 drop-shadow-glow" : ""}`} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">Connect</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === "notifications" ? "text-qi-400 scale-110" : "text-muted-foreground hover:text-qi-300"}`}
          >
            <div className={`p-1 rounded-full ${activeTab === "notifications" ? "bg-qi-500/10" : ""} relative`}>
              <Bell className={`w-5 h-5 ${activeTab === "notifications" ? "text-qi-500 drop-shadow-glow" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider">Alerts</span>
          </button>

          {/* Active Indicator Line */}
          <motion.div
            className="absolute bottom-0 h-0.5 bg-qi-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"
            initial={false}
            animate={{
              width: "25%",
              x: activeTab === "cultivate" ? "0%" : activeTab === "assets" ? "100%" : activeTab === "connections" ? "200%" : "300%"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </nav>
      <LeaderboardOverlay />
    </div>
  );
}
