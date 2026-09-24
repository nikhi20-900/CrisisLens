import React from "react";
import type { IncidentSnapshot, SeverityLevel } from "@/types/domain";
import { formatTime } from "@/lib";
import { Zap, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface WhatChangedBannerProps {
  snapshot?: IncidentSnapshot | null;
  previousSeverity?: SeverityLevel;
}

export const WhatChangedBanner: React.FC<WhatChangedBannerProps> = ({
  snapshot,
  previousSeverity,
}) => {
  if (!snapshot) {
    return (
      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-500">
        Waiting for situation evolution snapshots...
      </div>
    );
  }

  const deltas = snapshot.delta_summary || [];
  const isSeverityEscalated =
    previousSeverity && previousSeverity !== snapshot.severity;

  return (
    <div className="p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950 shadow-lg shadow-cyan-950/20">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-cyan-400">
            WHAT CHANGED? (Situation Evolution)
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Snapshot {snapshot.snapshot_id} &bull; {formatTime(snapshot.timestamp)}
        </span>
      </div>

      {/* Snapshot summary */}
      <p className="text-xs text-slate-200 mb-3 font-medium">
        {snapshot.summary}
      </p>

      {/* Delta Badges */}
      <div className="flex flex-wrap gap-2">
        {isSeverityEscalated && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-red-950/80 border border-red-700 text-red-300">
            {snapshot.severity === "critical" || snapshot.severity === "high" ? (
              <TrendingUp className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            )}
            Severity changed: {previousSeverity?.toUpperCase()} &rarr; {snapshot.severity.toUpperCase()}
          </span>
        )}

        {deltas.length > 0 ? (
          deltas.map((delta, idx) => {
            const isCritical =
              delta.toLowerCase().includes("critical") ||
              delta.toLowerCase().includes("medical") ||
              delta.toLowerCase().includes("trapped");
            const isBlocked = delta.toLowerCase().includes("blocked");

            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                  isCritical
                    ? "bg-red-950/70 border-red-800 text-red-300"
                    : isBlocked
                    ? "bg-amber-950/70 border-amber-800 text-amber-300"
                    : "bg-slate-900 border-slate-700 text-slate-200"
                }`}
              >
                {isCritical ? (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                ) : (
                  <span className="text-cyan-400 font-bold">&bull;</span>
                )}
                <span>{delta}</span>
              </span>
            );
          })
        ) : (
          <span className="text-xs text-slate-400 italic">
            No delta changes recorded in this snapshot.
          </span>
        )}
      </div>
    </div>
  );
};
