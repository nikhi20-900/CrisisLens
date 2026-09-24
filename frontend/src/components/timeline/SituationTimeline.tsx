import React from "react";
import type { IncidentSnapshot } from "@/types/domain";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { EmptyState } from "@/components/common/EmptyState";
import { formatTime } from "@/lib";
import { Clock, History } from "lucide-react";

interface SituationTimelineProps {
  snapshots: IncidentSnapshot[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const SituationTimeline: React.FC<SituationTimelineProps> = ({
  snapshots,
  loading = false,
  error = null,
  onRetry,
}) => {
  return (
    <Card
      title="Incident Evolution Timeline"
      icon={<History className="w-4 h-4 text-cyan-400" />}
      headerExtra={
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
          {snapshots.length} Snapshots
        </span>
      }
    >
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <Spinner size="md" message="Loading situation timeline..." />
        </div>
      ) : error ? (
        <ErrorAlert message={error} onRetry={onRetry} />
      ) : snapshots.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-slate-600" />}
          title="No Timeline Snapshots"
          description="Situation evolution snapshots have not been recorded yet."
        />
      ) : (
        <div className="relative pl-6 space-y-4">
          {/* Vertical Stepper Line */}
          <div className="absolute top-2 bottom-2 left-2 w-0.5 bg-slate-800" />

          {snapshots.map((snap, idx) => {
            const isLatest = idx === snapshots.length - 1;

            return (
              <div key={snap.snapshot_id} className="relative group">
                {/* Stepper Dot */}
                <div
                  className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full transition-all ${
                    isLatest
                      ? "bg-cyan-400 ring-4 ring-cyan-500/20"
                      : "bg-slate-700 group-hover:bg-slate-500"
                  }`}
                />

                {/* Snapshot Card */}
                <div
                  className={`p-3.5 rounded-lg border transition-all ${
                    isLatest
                      ? "border-cyan-500/50 bg-slate-900/90 shadow-md shadow-cyan-950/20"
                      : "border-slate-800/80 bg-slate-900/50 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {formatTime(snap.timestamp)}
                      </span>
                      <Badge
                        variant={
                          snap.severity === "critical"
                            ? "critical"
                            : snap.severity === "high"
                            ? "high"
                            : "medium"
                        }
                      >
                        {snap.severity.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] font-mono text-slate-500">
                        #{snap.snapshot_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>People affected: <strong className="text-slate-200">{snap.people_affected}</strong></span>
                      <span>Priority: <strong className="text-amber-400">{snap.priority_score.toFixed(1)}</strong></span>
                      <span className="capitalize text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {snap.access_status} Access
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 mb-2 leading-relaxed">
                    {snap.summary}
                  </p>

                  {/* Deltas & Changes */}
                  {snap.delta_summary && snap.delta_summary.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-800/70">
                      {snap.delta_summary.map((delta, dIdx) => (
                        <span
                          key={dIdx}
                          className="text-[11px] px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300"
                        >
                          &bull; {delta}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
