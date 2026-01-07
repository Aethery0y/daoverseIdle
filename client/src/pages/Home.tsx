import { useGameLoop } from "@/hooks/use-game-loop";
import { CultivationPanel } from "@/components/CultivationPanel";
import { GeneratorList } from "@/components/GeneratorList";
import { FactionModal } from "@/components/FactionModal";
import { AuthDialog } from "@/components/AuthDialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scroll, Info, Settings, Trophy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function Home() {
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

  if (!isInitialized) return (
    <div className="h-screen w-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-primary font-display text-xl">Entering the Dao...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col md:flex-row">
      
      {/* Required Modal for New Players */}
      <FactionModal open={!gameState.faction} onSelect={selectFaction} />

      {/* Main Gameplay Area (Left/Top) */}
      <div className="flex-1 relative border-r border-muted/30">
        {/* Top Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl text-primary tracking-tighter">Immortal Ascension</h1>
            <span className="text-xs text-muted-foreground font-mono">Build v0.9.2</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={syncToCloud} title="Sync Save">
               <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </Button>
            <AuthDialog />
          </div>
        </div>

        <CultivationPanel 
          state={gameState} 
          onClick={clickCultivate}
          onBreakthrough={breakthrough}
        />
      </div>

      {/* Sidebar / Management Area (Right/Bottom) */}
      <div className="w-full md:w-[450px] bg-card/30 backdrop-blur-sm border-l border-muted/20 flex flex-col h-[50vh] md:h-screen">
        <Tabs defaultValue="cultivate" className="flex-1 flex flex-col">
          <div className="p-4 border-b border-muted/20">
            <TabsList className="grid grid-cols-4 bg-muted/30">
              <TabsTrigger value="cultivate" className="data-[state=active]:bg-background"><Scroll className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="upgrades" className="data-[state=active]:bg-background"><Trophy className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-background"><Info className="w-4 h-4" /></TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-background"><Settings className="w-4 h-4" /></TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            <TabsContent value="cultivate" className="h-full mt-0">
              <h2 className="font-display text-xl mb-4 text-muted-foreground">Spiritual Assets</h2>
              <GeneratorList state={gameState} onBuy={purchaseGenerator} />
            </TabsContent>

            <TabsContent value="upgrades" className="mt-0 flex flex-col items-center justify-center h-full text-muted-foreground">
              <Trophy className="w-12 h-12 mb-4 opacity-20" />
              <p>Ancient manuals and techniques coming soon...</p>
            </TabsContent>
            
            <TabsContent value="info" className="mt-0 space-y-4">
              <Card className="p-4 bg-muted/10 border-muted/20">
                <h3 className="font-display text-lg text-primary mb-2">Current Dao</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Faction</span>
                    <span className="capitalize font-bold">{gameState.faction?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Lifetime Qi</span>
                    <span className="font-mono">{Math.floor(gameState.resources.totalQi).toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 space-y-4">
               <Card className="p-4 bg-muted/10 border-muted/20 space-y-4">
                 <h3 className="font-display text-lg text-destructive">Dangerous Techniques</h3>
                 <p className="text-xs text-muted-foreground">Some paths allow you to restart your journey with renewed potential, or destroy your cultivation entirely.</p>
                 
                 <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="destructive" className="w-full">
                       <AlertTriangle className="w-4 h-4 mr-2" />
                       Hard Reset Save
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="bg-card border-destructive/50">
                     <DialogHeader>
                       <DialogTitle className="text-destructive">Destroy Cultivation?</DialogTitle>
                       <DialogDescription>
                         This will completely wipe your local save data. There is no going back.
                         If you have cloud saves, they remain until overwritten.
                       </DialogDescription>
                     </DialogHeader>
                     <Button variant="destructive" onClick={hardReset}>Confirm Destruction</Button>
                   </DialogContent>
                 </Dialog>
               </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
