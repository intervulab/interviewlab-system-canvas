"use client";

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Connection,
  Edge,
  Node,
  MarkerType,
  ReactFlowInstance,
  Panel,
  NodeChange,
} from "reactflow";
import { ServerNode } from "./nodes/ServerNode";
import { DatabaseNode } from "./nodes/DatabaseNode";
import { LoadBalancerNode } from "./nodes/LoadBalancerNode";
import { Sidebar } from "./Sidebar";
import { useSocketCanvas } from "@/hooks/useSocketCanvas";
import {
  Trash2,
  RotateCcw,
  Code2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  AlertTriangle,
  Radio,
} from "lucide-react";

export interface TopologyNode {
  id: string;
  type: string;
  coordinates: {
    x: number;
    y: number;
  };
}

export interface TopologyEdge {
  source: string;
  target: string;
}

export interface GraphTopologyMap {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

/**
 * Extracts a clean JSON graph topology map from the React Flow canvas state.
 */
export function extractGraphTopology(nodes: Node[], edges: Edge[]): GraphTopologyMap {
  const topologyNodes: TopologyNode[] = nodes.map((node) => ({
    id: node.id,
    type: node.type || "default",
    coordinates: {
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
    },
  }));

  const topologyEdges: TopologyEdge[] = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  return {
    nodes: topologyNodes,
    edges: topologyEdges,
  };
}

const initialNodes: Node[] = [
  {
    id: "lb-1",
    type: "loadBalancer",
    position: { x: 100, y: 220 },
    data: {
      label: "Ingress Gateway",
      algorithm: "Round Robin",
      throughput: "2.4k req/s",
      status: "running",
      flawed: false,
    },
  },
  {
    id: "server-1",
    type: "server",
    position: { x: 420, y: 120 },
    data: {
      label: "API Server Primary",
      ip: "10.0.1.20",
      cpu: "28% CPU",
      status: "running",
      flawed: false,
    },
  },
  {
    id: "server-2",
    type: "server",
    position: { x: 420, y: 320 },
    data: {
      label: "API Server Worker",
      ip: "10.0.1.21",
      cpu: "19% CPU",
      status: "running",
      flawed: false,
    },
  },
  {
    id: "db-1",
    type: "database",
    position: { x: 760, y: 220 },
    data: {
      label: "Primary Aurora DB",
      engine: "PostgreSQL 16",
      storage: "184 GB / 500 GB",
      status: "running",
      flawed: false,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-lb-s1",
    source: "lb-1",
    target: "server-1",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7", width: 18, height: 18 },
  },
  {
    id: "e-lb-s2",
    source: "lb-1",
    target: "server-2",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#a855f7", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7", width: 18, height: 18 },
  },
  {
    id: "e-s1-db",
    source: "server-1",
    target: "db-1",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6", width: 18, height: 18 },
  },
  {
    id: "e-s2-db",
    source: "server-2",
    target: "db-1",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6", width: 18, height: 18 },
  },
];

let idCounter = 10;
const getId = (prefix: string) => `${prefix}-${idCounter++}`;

const CanvasContent = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showJsonDrawer, setShowJsonDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedNodeIdForAlert, setSelectedNodeIdForAlert] = useState<string>("server-1");

  // Keep synchronous references to nodes & edges
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  /**
   * Handle flaw_detected incoming socket event
   */
  const handleFlawDetected = useCallback((targetNodeId: string) => {
    console.warn(`[Action] Triggering flaw alert on node: ${targetNodeId}`);
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === targetNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              flawed: true,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // WebSocket hook
  const { isConnected, socketId, emitTopology, simulateFlaw } = useSocketCanvas({
    serverUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
    onFlawDetected: handleFlawDetected,
  });

  /**
   * Log topology and emit to WebSocket
   */
  const broadcastTopology = useCallback(
    (reason: string, currentNodes = nodesRef.current, currentEdges = edgesRef.current) => {
      const topology = extractGraphTopology(currentNodes, currentEdges);
      console.group(`%c[Topology Update] ${reason}`, "color: #38bdf8; font-weight: bold; font-size: 12px;");
      console.log(JSON.stringify(topology, null, 2));
      console.log("Topology Object:", topology);
      console.groupEnd();

      // Emit to WebSocket
      emitTopology(topology);
    },
    [emitTopology]
  );

  // Emit initial topology on mount
  useEffect(() => {
    broadcastTopology("Initial Canvas Load", initialNodes, initialEdges);
  }, [broadcastTopology]);

  const nodeTypes = useMemo(
    () => ({
      server: ServerNode,
      database: DatabaseNode,
      loadBalancer: LoadBalancerNode,
    }),
    []
  );

  // Wrapper for onNodesChange with movement logging and emission
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeBase(changes);

      const hasPositionChange = changes.some(
        (c) => c.type === "position" && c.position && !c.dragging
      );
      if (hasPositionChange) {
        setTimeout(() => {
          broadcastTopology("Node Moved", nodesRef.current, edgesRef.current);
        }, 0);
      }
    },
    [onNodesChangeBase, broadcastTopology]
  );

  // Connecting an edge
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      let strokeColor = "#38bdf8";
      if (params.source?.startsWith("lb")) strokeColor = "#a855f7";
      else if (params.source?.startsWith("server")) strokeColor = "#3b82f6";
      else if (params.source?.startsWith("db")) strokeColor = "#10b981";

      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 18,
          height: 18,
        },
      } as Edge;

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge, eds);
        broadcastTopology("Edge Connected", nodesRef.current, updatedEdges);
        return updatedEdges;
      });
    },
    [setEdges, broadcastTopology]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const createNodeObject = (type: "server" | "database" | "loadBalancer", position: { x: number; y: number }): Node => {
    if (type === "server") {
      return {
        id: getId("server"),
        type,
        position,
        data: {
          label: `Server ${nodesRef.current.filter((n) => n.type === "server").length + 1}`,
          ip: `10.0.1.${20 + nodesRef.current.length}`,
          cpu: `${Math.floor(Math.random() * 40) + 10}% CPU`,
          status: "running",
          flawed: false,
        },
      };
    } else if (type === "database") {
      return {
        id: getId("db"),
        type,
        position,
        data: {
          label: `DB Node ${nodesRef.current.filter((n) => n.type === "database").length + 1}`,
          engine: "PostgreSQL 16",
          storage: "45 GB / 250 GB",
          status: "running",
          flawed: false,
        },
      };
    } else {
      return {
        id: getId("lb"),
        type,
        position,
        data: {
          label: `Load Balancer ${nodesRef.current.filter((n) => n.type === "loadBalancer").length + 1}`,
          algorithm: "Round Robin",
          throughput: "850 req/s",
          status: "running",
          flawed: false,
        },
      };
    }
  };

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      broadcastTopology(`Node Drag Stopped (${node.id})`, nodesRef.current, edgesRef.current);
    },
    [broadcastTopology]
  );

  // Node Drop from sidebar
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow") as
        | "server"
        | "database"
        | "loadBalancer";

      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createNodeObject(type, position);
      setNodes((nds) => {
        const updatedNodes = nds.concat(newNode);
        broadcastTopology("Node Dropped", updatedNodes, edgesRef.current);
        return updatedNodes;
      });
    },
    [reactFlowInstance, setNodes, broadcastTopology]
  );

  const handleAddNodeFromSidebar = (type: "server" | "database" | "loadBalancer") => {
    const position = {
      x: 350 + Math.random() * 120,
      y: 200 + Math.random() * 120,
    };
    const newNode = createNodeObject(type, position);
    setNodes((nds) => {
      const updatedNodes = nds.concat(newNode);
      broadcastTopology("Node Added (Click)", updatedNodes, edgesRef.current);
      return updatedNodes;
    });
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
    broadcastTopology("Canvas Cleared", [], []);
  };

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    broadcastTopology("Canvas Reset", initialNodes, initialEdges);
  };

  const resetFlaws = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, flawed: false },
      }))
    );
  };

  const currentTopologyJson = useMemo(() => {
    return JSON.stringify(extractGraphTopology(nodes, edges), null, 2);
  }, [nodes, edges]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentTopologyJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar onAddNode={handleAddNodeFromSidebar} />

      <main className="relative flex-1 h-full w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
            },
          }}
        >
          <Background
            color="#334155"
            gap={20}
            size={1.5}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-xl [&>button]:!bg-transparent [&>button]:!border-b [&>button]:!border-slate-800 [&>button]:!text-slate-200 hover:[&>button]:!bg-slate-800"
          />
          <MiniMap
            nodeStrokeColor="#475569"
            nodeColor={(n) => {
              if (n.data?.flawed) return "#ef4444";
              if (n.type === "server") return "#3b82f6";
              if (n.type === "database") return "#10b981";
              if (n.type === "loadBalancer") return "#a855f7";
              return "#64748b";
            }}
            maskColor="rgba(15, 23, 42, 0.75)"
            className="!bg-slate-900/90 !border-slate-800 !rounded-xl !overflow-hidden !shadow-xl"
          />

          <Panel position="top-right" className="flex items-center gap-2">
            {/* WebSocket connection badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 shadow-xl text-xs">
              {isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-slate-200">Socket Connected</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-slate-400">Socket Standby</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                </>
              )}
            </div>

            {/* Simulation test triggers */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-1.5 shadow-xl">
              <select
                value={selectedNodeIdForAlert}
                onChange={(e) => setSelectedNodeIdForAlert(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.id} ({n.type})
                  </option>
                ))}
              </select>

              <button
                onClick={() => simulateFlaw(selectedNodeIdForAlert)}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-colors"
                title="Trigger flaw_detected event on selected node"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Test Flaw Alert
              </button>

              <button
                onClick={resetFlaws}
                className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                title="Clear red flaw alerts"
              >
                Clear Alert
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-1.5 shadow-xl">
              <button
                onClick={() => setShowJsonDrawer(!showJsonDrawer)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showJsonDrawer
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title="View JSON Graph Topology Map"
              >
                <Code2 className="h-3.5 w-3.5" />
                Topology JSON
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                title="Reset to default architecture"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                title="Clear all nodes and connections"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </Panel>
        </ReactFlow>

        {/* Live Topology JSON Drawer */}
        {showJsonDrawer && (
          <div className="absolute right-4 bottom-4 top-16 w-96 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl flex flex-col z-20 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Graph Topology Map
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live JSON
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={copyToClipboard}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                  title="Copy JSON"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setShowJsonDrawer(false)}
                  className="text-slate-400 hover:text-slate-100 text-sm px-1.5 py-0.5 rounded-md hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-[11px] text-slate-300 leading-relaxed bg-slate-950/70">
              <pre>{currentTopologyJson}</pre>
            </div>
            <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between bg-slate-950/40">
              <span>{nodes.length} nodes · {edges.length} edges</span>
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <Radio className="h-3 w-3 animate-pulse" /> Emitted via WebSocket
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export const Canvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
};
