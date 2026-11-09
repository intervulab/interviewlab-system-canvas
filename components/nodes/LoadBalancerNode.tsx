import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Network as NetworkIcon, AlertTriangle } from "lucide-react";

export interface LoadBalancerNodeData {
  label?: string;
  algorithm?: string;
  throughput?: string;
  status?: "running" | "stopped" | "warning";
  flawed?: boolean;
}

export const LoadBalancerNode = memo(({ data, selected }: NodeProps<LoadBalancerNodeData>) => {
  const isFlawed = !!data?.flawed;
  const status = isFlawed ? "warning" : data?.status || "running";

  return (
    <div
      className={`min-w-[190px] rounded-xl border bg-slate-900/95 backdrop-blur-md px-4 py-3 shadow-xl transition-all ${
        isFlawed
          ? "flaw-alert ring-2 ring-red-500"
          : selected
          ? "border-purple-500 shadow-purple-500/30 ring-2 ring-purple-500/40"
          : "border-slate-700/80 hover:border-slate-600"
      }`}
    >
      {/* Input handles (top & left) */}
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-purple-500"
        }`}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-purple-500"
        }`}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
            isFlawed
              ? "bg-red-500/20 border-red-500/50 text-red-400"
              : "bg-purple-500/15 border-purple-500/30 text-purple-400"
          }`}
        >
          {isFlawed ? <AlertTriangle className="h-5 w-5 animate-bounce" /> : <NetworkIcon className="h-5 w-5" />}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="truncate text-sm font-semibold text-slate-100">
            {data?.label || "Load Balancer"}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {data?.algorithm || "Round Robin"}
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
                : "bg-amber-400"
            }`}
          />
          <span className={`capitalize ${isFlawed ? "font-bold text-red-400" : "text-slate-400"}`}>
            {isFlawed ? "FLAW DETECTED" : status}
          </span>
        </div>
        <span className="font-mono text-slate-400">{data?.throughput || "1.2k req/s"}</span>
      </div>

      {/* Output handles (bottom & right) */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-purple-500"
        }`}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 !border-slate-900 !transition-transform hover:!scale-125 ${
          isFlawed ? "!bg-red-500" : "!bg-purple-500"
        }`}
      />
    </div>
  );
});

LoadBalancerNode.displayName = "LoadBalancerNode";
