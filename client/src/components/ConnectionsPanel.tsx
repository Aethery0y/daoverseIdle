import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Search, UserPlus, Users, Loader2, Shield, Zap, Sparkles, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { PublicProfileDialog } from "./PublicProfileDialog";

interface SearchResult {
    id: number;
    username: string;
    avatar: string;
}

interface Friendship {
    id: number;
    friendId: number;
    status: string;
    friend: {
        id: number;
        username: string;
        avatar: string;
    };
}

export function ConnectionsPanel() {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // -- Queries --
    const { data: friends, isLoading: loadingFriends } = useQuery<Friendship[]>({
        queryKey: ["/api/friends"],
        queryFn: async () => {
            const res = await fetch("/api/friends");
            if (!res.ok) throw new Error("Failed");
            return res.json();
        }
    });

    const { data: searchResults, isLoading: searchLoading, refetch: searchUsers, isFetched } = useQuery<SearchResult[]>({
        queryKey: ["/api/users/search", searchQuery],
        queryFn: async () => {
            if (searchQuery.length < 2) return [];
            const res = await fetch(`/api/users/search?q=${searchQuery}`);
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: false // Trigger manually
    });

    // -- Mutations --
    const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

    // ... (existing code)

    const requestMutation = useMutation({
        mutationFn: async (toUserId: number) => {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toUserId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            return { toUserId, ...data }; // Return toUserId for onSuccess
        },
        onSuccess: (data) => {
            setSentRequests(prev => new Set(prev).add(data.toUserId));
            toast({ title: "Request Sent", description: "The carrier pigeon has been dispatched." });
        },
        onError: (err: any) => {
            toast({ title: "Failed", description: err.message || "Could not send request.", variant: "destructive" });
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchUsers();
    };

    return (
        <div className="h-full flex flex-col pt-4 px-4 pb-24 overflow-hidden">
            <h2 className="text-2xl font-display text-center mb-4 bg-gradient-to-r from-qi-300 to-white bg-clip-text text-transparent">
                Dao Connections
            </h2>

            <Tabs defaultValue="friends" className="flex-1 flex flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2 bg-muted/20 border border-qi-500/20">
                    <TabsTrigger value="friends">My Friends</TabsTrigger>
                    <TabsTrigger value="search">Find Cultivators</TabsTrigger>
                </TabsList>

                {/* Friends List */}
                <TabsContent value="friends" className="flex-1 overflow-y-auto min-h-0 py-4 space-y-3">
                    {loadingFriends ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-qi-400" /></div>
                    ) : friends?.length === 0 ? (
                        <div className="text-center text-muted-foreground p-8">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>You walk this path alone.</p>
                            <p className="text-xs mt-1">Search for others to build your sect.</p>
                        </div>
                    ) : (
                        friends?.map(f => (
                            <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-white/5 hover:bg-card/60 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-qi-900/50 flex items-center justify-center border border-white/10 overflow-hidden">
                                    {f.friend.avatar ? (
                                        <img src={f.friend.avatar} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-qi-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-qi-200 truncate">{f.friend.username}</div>
                                    <div className="text-xs text-muted-foreground">Connected</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs h-7"
                                    onClick={() => setViewingProfileId(f.friend.id)}
                                >
                                    View
                                </Button>
                            </div>
                        ))
                    )}
                </TabsContent>

                {/* Search */}
                <TabsContent value="search" className="flex-1 overflow-y-auto min-h-0 py-4">
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <Input
                            placeholder="Search username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/20 border-white/10"
                        />
                        <Button type="submit" size="icon" disabled={searchLoading}>
                            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </form>

                    <div className="space-y-3">
                        {searchResults?.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-white/5 hover:bg-card/60 transition-colors">
                                <div
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => setViewingProfileId(user.id)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-qi-900/50 flex items-center justify-center border border-white/10 overflow-hidden shadow-sm group-hover:border-qi-500/50 transition-colors">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5 text-qi-400" />
                                        )}
                                    </div>
                                    <div className="font-medium text-qi-200 group-hover:text-qi-100 transition-colors">{user.username}</div>
                                </div>
                                <Button
                                    size="sm"
                                    className={sentRequests.has(user.id)
                                        ? "bg-muted/50 text-muted-foreground h-8 text-xs border border-white/5"
                                        : "bg-qi-600 hover:bg-qi-500 h-8 text-xs"}
                                    onClick={() => requestMutation.mutate(user.id)}
                                    disabled={requestMutation.isPending || sentRequests.has(user.id)}
                                >
                                    {sentRequests.has(user.id) ? (
                                        "Requested"
                                    ) : (
                                        <><UserPlus className="w-3 h-3 mr-1" /> Request</>
                                    )}
                                </Button>
                            </div>
                        ))}
                    </div>

                    {isFetched && searchResults?.length === 0 && !searchLoading && (
                        <div className="text-center text-muted-foreground p-8">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No cultivators found with that name.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <PublicProfileDialog
                userId={viewingProfileId}
                onClose={() => setViewingProfileId(null)}
            />
        </div>
    );
}
