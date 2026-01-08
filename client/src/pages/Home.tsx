import { useGameLoop } from "@/hooks/use-game-loop";
import { useAuth } from "@/hooks/use-auth";
import { CultivationPanel } from "@/components/CultivationPanel";
import { GeneratorList } from "@/components/GeneratorList";
import { FactionModal } from "@/components/FactionModal";
import { AuthDialog } from "@/components/AuthDialog";
import { AuthModal } from "@/components/AuthModal";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scroll, Settings, Trophy, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function Home() {
  const { user, isLoading: authLoading, setUser } = useAuth();
  const {
    gameState,
    isInitialized,
    clickCultivate,
    purchaseGenerator,
    breakthrough,
    selectFaction,
    syncToCloud,
    hardReset
  } = useGameLoop();

  // Show loading while checking authentication
  if (authLoading || !isInitialized) return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-primary font-display text-xl">Entering the Dao...</div>
    </div>
  );

  // Show auth modal if not authenticated
  if (!user) {
    return <AuthModal open={true} onSuccess={setUser} />;
  }

  return (
    <div className="h-screen bg-gradient-to-b from-background via-qi-950/10 to-background text-foreground overflow-hidden flex flex-col">

      {/* Required Modal for New Players */}
      <FactionModal open={!gameState.faction} onSelect={selectFaction} />

      {/* Top Header */}
      <div className="p-4 md:p-6 flex justify-between items-start bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm border-b border-qi-500/20 z-50">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl md:text-3xl bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent tracking-wider drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">
            Immortal Ascension
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={syncToCloud}
            title="Sync Save"
            className="hover:bg-qi-500/10 hover:text-qi-400"
          >
            <span className="h-2 w-2 rounded-full bg-celestial-jade animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </Button>
          <AuthDialog onLogout={syncToCloud} gameState={gameState} />
        </div>
      </div>

      {/* Main Content Area with Bottom Tabs */}
      <Tabs defaultValue="cultivate" className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Content - Takes full remaining space */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="cultivate" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
            <CultivationPanel
              state={gameState}
              onClick={clickCultivate}
              onBreakthrough={breakthrough}
            />
          </TabsContent>

          <TabsContent value="assets" className="h-full m-0 p-6 pb-32 overflow-auto">
            <h2 className="font-display text-2xl mb-6 bg-gradient-to-r from-qi-200 to-qi-400 bg-clip-text text-transparent">
              Spiritual Assets
            </h2>
            <GeneratorList state={gameState} onBuy={purchaseGenerator} />
          </TabsContent>

        </div>

        {/* Bottom Navigation */}
        <div className="flex-none bg-background/80 backdrop-blur-md border-t border-qi-500/20 pb-safe">
          <TabsList className="w-full h-16 grid grid-cols-2 bg-transparent rounded-none border-0 p-0">
            <TabsTrigger
              value="cultivate"
              className="h-full flex flex-col gap-1 data-[state=active]:bg-qi-600/20 data-[state=active]:text-qi-300 data-[state=active]:border-t-2 data-[state=active]:border-qi-500 rounded-none"
            >
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-medium">Cultivate</span>
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="h-full flex flex-col gap-1 data-[state=active]:bg-qi-600/20 data-[state=active]:text-qi-300 data-[state=active]:border-t-2 data-[state=active]:border-qi-500 rounded-none"
            >
              <Scroll className="w-5 h-5" />
              <span className="text-xs font-medium">Assets</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
