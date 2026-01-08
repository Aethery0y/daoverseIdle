import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Scroll, Trophy, Globe, Zap, Sparkles, Sword } from "lucide-react";
import { formatNumber } from "@/lib/game-constants";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PublicProfileDialogProps {
    userId: number | null;
    onClose: () => void;
}

export function PublicProfileDialog({ userId, onClose }: PublicProfileDialogProps) {
    const { data: profile, isLoading } = useQuery({
        queryKey: [`/api/users/${userId}/stats`],
        queryFn: async () => {
            if (!userId) return null;
            const res = await fetch(`/api/users/${userId}/stats`);
            if (!res.ok) throw new Error("Failed to load profile");
            return res.json();
        },
        enabled: !!userId
    });

    if (!userId) return null;

    return (
        <Dialog open={!!userId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-background via-qi-950/30 to-background border-qi-500/30 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent text-center">
                        Cultivator Insight
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Sparkles className="w-8 h-8 text-qi-400 animate-spin" />
                    </div>
                ) : profile ? (
                    <div className="space-y-6 pt-4">
                        {/* Avatar & Identity */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-qi-600 to-qi-500 p-1 shadow-lg shadow-qi-500/50">
                                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                    {profile.avatar ? (
                                        <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-qi-400" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-display text-qi-300">{profile.username}</h3>
                                {profile.faction && (
                                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-qi-500/10 border border-qi-500/20 text-xs text-qi-300 mt-2 capitalize">
                                        <Sword className="w-3 h-3" />
                                        {profile.faction} Sect
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded-lg border border-qi-500/10">
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                    <Globe className="w-3 h-3" /> World
                                </div>
                                <div className="font-display text-qi-300 capitalize text-sm">
                                    {profile.realm?.world || "Unknown"}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-3 rounded-lg border border-qi-500/10">
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                    <Trophy className="w-3 h-3" /> Realm
                                </div>
                                <div className="font-display text-qi-300 capitalize text-sm">
                                    {profile.realm?.name || "Mortal"}
                                    {profile.realm?.stage && <span className="text-xs text-muted-foreground ml-1">Stage {profile.realm.stage}</span>}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg border border-qi-500/10 col-span-2">
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                    <Scroll className="w-3 h-3" /> Lifetime Qi Accumulated
                                </div>
                                <div className="font-mono text-xl text-qi-200">
                                    {formatNumber(profile.totalQi || 0)}
                                </div>
                            </div>
                        </div>
                        {/* Actions (Unfriend) */}
                        <div className="flex justify-center pt-2">
                            <UnfriendButton userId={userId} onClose={onClose} />
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        Failed to commune with this cultivator.
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}

function UnfriendButton({ userId, onClose }: { userId: number, onClose: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Check if friend
    const { data: friends } = useQuery<any[]>({
        queryKey: ["/api/friends"],
        enabled: false // Use cached data if available
    });

    const isFriend = friends?.some(f => f.friendId === userId || f.userId === userId);

    const { mutate: unfriend, isPending } = useMutation({
        mutationFn: async () => {
            await fetch(`/api/friends/${userId}`, { method: 'DELETE' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
            toast({ title: "Unfriended", description: "You have severed ties." });
            onClose();
        },
        onError: () => {
            toast({ title: "Error", description: "Could not unfriend.", variant: "destructive" });
        }
    });

    if (!isFriend) return null;

    return (
        <Button
            variant="destructive"
            size="sm"
            className="w-full opacity-80 hover:opacity-100"
            onClick={() => unfriend()}
            disabled={isPending}
        >
            {isPending ? "Severing..." : "Unfriend"}
        </Button>
    );
}
