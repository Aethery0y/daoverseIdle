import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./use-auth";

export function useWebSocket() {
    const { user } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        // Connect
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log("[WS] Connecting to", wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WS] Connected");
            // Auth
            ws.send(JSON.stringify({ type: "auth", userId: user.id }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("[WS] Received:", message);

                switch (message.type) {
                    case "FRIEND_REQUEST":
                        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                        toast({
                            title: "New Friend Request",
                            description: `${message.payload.fromName} wants to connect!`,
                        });
                        break;
                    case "FRIEND_ACCEPTED":
                        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
                        // Also refresh notifications to clear the request? No, separate.
                        toast({
                            title: "Request Accepted",
                            description: `${message.payload.friendName} is now a friend!`,
                        });
                        break;
                    case "FRIEND_REJECTED":
                        // Minimal feedback needed
                        break;
                    case "NOTIFICATION":
                        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
                        toast({
                            title: message.payload.title || "New Notification",
                            description: message.payload.message || "You have a new alert.",
                        });
                        break;
                }
            } catch (err) {
                console.error("[WS] Parse error", err);
            }
        };

        ws.onclose = () => {
            console.log("[WS] Disconnected");
        };

        return () => {
            ws.close();
        };
    }, [user, queryClient, toast]);

    return wsRef.current;
}
