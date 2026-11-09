import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Server as ServerIcon, AlertTriangle } from "lucide-react";

export interface ServerNodeData {
  label?: string;
  ip?: string;
  cpu?: string;
  status?: "running" | "stopped" | "warning";
  flawed?: boolean;
}

export const ServerNode = memo(({ data, selected }: NodeProps<ServerNodeData>) => {
  const isFlawed = !!data?.flawed;
  const status = isFlawed ? "warning" : data?.status || "running";

  return (
    <div
      className={`min-w-[190px] rounded-xl border bg-slate-900/95 backdrop-blur-md px-4 py-3 shadow-xl transition-all ${
        isFlawed
          ? "flaw-alert ring-2 ring-red-500"
          : selected
          ? "border-blue-500 shadow-blue-500/30 ring-2 ring-blue-500/40"
          : "border-slate-700/80 hover:border-slate-600"
      }`}
    >
      {/* Input handles (top & left) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-blue-500"
        }`}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-blue-500"
        }`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
            isFlawed
              ? "bg-red-500/20 border-red-500/50 text-red-400"
              : "bg-blue-500/15 border-blue-500/30 text-blue-400"
          }`}
        >
          {isFlawed ? <AlertTriangle className="h-5 w-5 animate-bounce" /> : <ServerIcon className="h-5 w-5" />}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-slate-100">
              {data?.label || "App Server"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {data?.ip || "192.168.1.10"}
          </span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isFlawed
                ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping"
                : status === "running"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                : "bg-rose-400"
            }`}
          />
          <span className={`capitalize ${isFlawed ? "font-bold text-red-400" : "text-slate-400"}`}>
            {isFlawed ? "FLAW DETECTED" : status}
          </span>
        </div>
        <span className="font-mono text-slate-400">{data?.cpu || "14% CPU"}</span>
      </div>

      {/* Output handles (bottom & right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-blue-500"
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-blue-500"
        }`}
      />
    </div>
  );
});

ServerNode.displayName = "ServerNode";
