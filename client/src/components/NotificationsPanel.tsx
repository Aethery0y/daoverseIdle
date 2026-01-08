import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Notification {
    id: number;
    type: string;
    read: boolean;
    data: {
        requestId: number;
        fromId: number;
        fromName: string;
    };
    createdAt: string;
}

export function NotificationsPanel() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery<Notification[]>({
        queryKey: ["/api/notifications"],
        queryFn: async () => {
            const res = await fetch("/api/notifications");
            if (!res.ok) throw new Error("Failed");
            return res.json();
        }
    });

    const respondMutation = useMutation({
        mutationFn: async ({ requestId, status }: { requestId: number, status: 'accepted' | 'rejected' }) => {
            const res = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, status })
            });
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
            queryClient.invalidateQueries({ queryKey: ["/api/friends"] }); // Refresh friends list if accepted
            toast({
                title: variables.status === 'accepted' ? "Friend Accepted" : "Request Rejected",
                description: `You have ${variables.status} the request.`
            });
        },
        onError: () => {
            toast({ title: "Error", description: "Could not process request.", variant: "destructive" });
        }
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        }
    });

    return (
        <div className="h-full flex flex-col pt-4 px-4 pb-24 overflow-hidden">
            <h2 className="text-2xl font-display text-center mb-6 bg-gradient-to-r from-qi-300 to-white bg-clip-text text-transparent flex items-center justify-center gap-2">
                <Bell className="w-6 h-6" /> Notifications
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-qi-400" /></div>
                ) : notifications?.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">
                        <p>No new updates in the dao.</p>
                    </div>
                ) : (
                    notifications?.map(notif => (
                        <div key={notif.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${notif.read ? 'bg-card/20 border-white/5 opacity-70' : 'bg-card/40 border-qi-500/30'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-qi-200">
                                        {notif.type === 'friend_request' ? "Friend Request" : "System Notification"}
                                    </h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        <span className="text-qi-300 font-medium">{notif.data.fromName}</span> wants to connect with you.
                                    </p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-qi-500 animate-pulse" />
                                )}
                            </div>

                            {notif.type === 'friend_request' && (
                                <div className="flex gap-2 mt-1">
                                    <Button
                                        size="sm"
                                        className="bg-green-600/80 hover:bg-green-500 flex-1"
                                        onClick={() => {
                                            respondMutation.mutate({ requestId: notif.data.requestId, status: 'accepted' });
                                            markReadMutation.mutate(notif.id);
                                        }}
                                        disabled={respondMutation.isPending}
                                    >
                                        <Check className="w-4 h-4 mr-1" /> Accept
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-white/10 hover:bg-red-900/20 hover:text-red-400 flex-1"
                                        onClick={() => {
                                            respondMutation.mutate({ requestId: notif.data.requestId, status: 'rejected' });
                                            markReadMutation.mutate(notif.id);
                                        }}
                                        disabled={respondMutation.isPending}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
