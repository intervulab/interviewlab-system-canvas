"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { GraphTopologyMap } from "@/components/Canvas";

interface UseSocketCanvasProps {
  serverUrl?: string;
  onFlawDetected?: (nodeId: string) => void;
}

function resolveSessionId(): string {
  if (typeof window === "undefined") return "canvas-demo";
  return new URLSearchParams(window.location.search).get("sessionId") || "canvas-demo";
}

export function useSocketCanvas({
  serverUrl = "http://localhost:4000",
  onFlawDetected,
}: UseSocketCanvasProps = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [lastFlawedNodeId, setLastFlawedNodeId] = useState<string | null>(null);

  useEffect(() => {
    // Initialise WebSocket connection
    const socket = io(serverUrl, {
      query: { sessionId: resolveSessionId() },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`%c[WebSocket Connected] ID: ${socket.id}`, "color: #10b981; font-weight: bold;");
      setIsConnected(true);
      setSocketId(socket.id || null);
    });

    socket.on("disconnect", (reason) => {
      console.log(`%c[WebSocket Disconnected] Reason: ${reason}`, "color: #f59e0b; font-weight: bold;");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      // Graceful log without breaking UI when local server is offline
      console.debug("[WebSocket Info] Waiting for backend socket server at", serverUrl, err.message);
      setIsConnected(false);
    });

    /**
     * Listener for flaw_detected event from backend:
     * Expects either { node_id: "..." } or "..." (string)
     */
    socket.on("flaw_detected", (payload: string | { node_id?: string; nodeId?: string }) => {
      console.group("%c[WebSocket Event: flaw_detected]", "color: #ef4444; font-weight: bold; font-size: 13px;");
      console.log("Payload:", payload);
      console.groupEnd();

      const targetId = typeof payload === "string" ? payload : payload?.node_id || payload?.nodeId;
      if (targetId) {
        setLastFlawedNodeId(targetId);
        if (onFlawDetected) {
          onFlawDetected(targetId);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl, onFlawDetected]);

  /**
   * Emit graph topology map to socket server
   */
  const emitTopology = useCallback((topology: GraphTopologyMap) => {
    if (socketRef.current) {
      socketRef.current.emit("topology_update", topology);
      // Also emit standard 'topology' or 'graph_update' event aliases for compatibility
      socketRef.current.emit("topology", topology);
      console.log("%c[WebSocket Emitted: topology]", "color: #6366f1; font-weight: bold;", topology);
    }
  }, []);

  /**
   * Helper function for testing flaw_detected locally directly in UI
   */
  const simulateFlaw = useCallback((nodeId: string) => {
    console.log(`%c[Simulating flaw_detected for node: ${nodeId}]`, "color: #ef4444; font-weight: bold;");
    setLastFlawedNodeId(nodeId);
    if (onFlawDetected) {
      onFlawDetected(nodeId);
    }
  }, [onFlawDetected]);

  return {
    socket: socketRef.current,
    isConnected,
    socketId,
    lastFlawedNodeId,
    emitTopology,
    simulateFlaw,
  };
}
