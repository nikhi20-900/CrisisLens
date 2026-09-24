import React from "react";
import {
  ShieldAlert,
  Activity,
  Pause,
  RotateCcw,
  FastForward,
  Server,
  Zap,
} from "lucide-react";

interface HeaderProps {
  isLiveApi: boolean;
  onToggleSource: () => void;
  autoSync: boolean;
  onToggleAutoSync: () => void;
  lastSynced: Date | null;
  // Demo simulation controls
  isDemoMode: boolean;
  simulationStep: number;
  totalSteps: number;
  onAdvanceSimulation: () => void;
  onResetSimulation: () => void;
  nextStepLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isLiveApi,
  onToggleSource,
  autoSync,
  onToggleAutoSync,
  lastSynced,
  isDemoMode,
  simulationStep,
  totalSteps,
  onAdvanceSimulation,
  onResetSimulation,
  nextStepLabel,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Mission Statement */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/80 text-red-400 flex items-center justify-center shadow-lg shadow-red-950/40">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
                <span>CRISISLENS</span>
                <span className="text-cyan-400 font-light">AI</span>
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-xs font-mono font-medium text-slate-300">COMMAND CENTER</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-red-950 text-red-400 border border-red-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Multimodal Evidence Analysis &bull; Incident Fusion &bull; Explainable Response Verification
            </p>
          </div>
        </div>

        {/* Tactical Controls & Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Simulation Stepper (When in Demo Mode) */}
          {isDemoMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-800/60 text-amber-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px]">
                Demo Step {simulationStep}/{totalSteps}
              </span>
              <button
                onClick={onAdvanceSimulation}
                disabled={simulationStep >= totalSteps}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-200 text-[10px] font-semibold border border-amber-500/40 flex items-center gap-1"
                title={nextStepLabel || "Advance to next disaster snapshot"}
              >
                <FastForward className="w-3 h-3" />
                <span>Next</span>
              </button>
              <button
                onClick={onResetSimulation}
                className="p-1 rounded hover:bg-amber-500/20 text-amber-400 text-[10px]"
                title="Reset simulation to initial flood report (10:02)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Source Toggle: Backend vs Demo */}
          <button
            onClick={onToggleSource}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all ${
              isLiveApi
                ? "bg-emerald-950/40 border-emerald-700/70 text-emerald-300 hover:bg-emerald-900/40"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Server className={`w-3.5 h-3.5 ${isLiveApi ? "text-emerald-400" : "text-slate-400"}`} />
            <span>{isLiveApi ? "LIVE API (Port 8000)" : "OFFLINE DEMO"}</span>
          </button>

          {/* Auto-Sync Toggle */}
          <button
            onClick={onToggleAutoSync}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono text-[11px] transition-all ${
              autoSync
                ? "bg-cyan-950/40 border-cyan-800 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-500"
            }`}
            title={autoSync ? "Pause live auto-sync" : "Resume live auto-sync (3s)"}
          >
            {autoSync ? <Activity className="w-3 h-3 animate-spin text-cyan-400" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline">{autoSync ? "Auto-Sync 3s" : "Paused"}</span>
          </button>

          {/* Last Sync Timestamp */}
          {lastSynced && (
            <span className="text-[10px] font-mono text-slate-500 hidden lg:inline">
              Updated {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
