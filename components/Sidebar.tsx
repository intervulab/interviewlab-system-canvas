"use client";

import React from "react";
import { Server, Database, Network, GripVertical } from "lucide-react";

interface SidebarProps {
  onAddNode: (type: "server" | "database" | "loadBalancer") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddNode }) => {
  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: "server" | "database" | "loadBalancer"
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const nodeItems = [
    {
      type: "loadBalancer" as const,
      label: "Load Balancer",
      desc: "Traffic distributor (Round Robin)",
      icon: Network,
      color: "purple",
      iconBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      accent: "hover:border-purple-500/50 hover:bg-purple-950/20",
    },
    {
      type: "server" as const,
      label: "Server Node",
      desc: "Compute backend instance",
      icon: Server,
      color: "blue",
      iconBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      accent: "hover:border-blue-500/50 hover:bg-blue-950/20",
    },
    {
      type: "database" as const,
      label: "Database Node",
      desc: "Relational / Storage engine",
      icon: Database,
      color: "emerald",
      iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      accent: "hover:border-emerald-500/50 hover:bg-emerald-950/20",
    },
  ];

  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl p-4 flex flex-col justify-between select-none z-10 shrink-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-2 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 rounded-full" />
          <h1 className="font-bold text-slate-100 text-lg tracking-tight">System Canvas</h1>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Drag and drop components to architecture your cloud infrastructure.
        </p>

        <div className="space-y-3">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Available Nodes
          </span>

          {nodeItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onAddNode(item.type)}
                className={`group flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 cursor-grab active:cursor-grabbing transition-all ${item.accent}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-200 group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      {item.desc}
                    </div>
                  </div>
                </div>
                <GripVertical className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs text-slate-400 space-y-1.5">
        <div className="font-medium text-slate-300">💡 Instructions</div>
        <p>• Drag or click node to add to canvas.</p>
        <p>• Drag handles to connect with animated arrows.</p>
        <p>• Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">Backspace</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">Del</kbd> to remove.</p>
      </div>
    </aside>
  );
};
