import React from "react";
import { Radio, Mic, MicOff, Power, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { AssistantState } from "../types";

interface ForegroundServiceNotificationProps {
  isServiceRunning: boolean;
  onToggleService: () => void;
  assistantState: AssistantState;
  wakeWordDetectedCount: number;
  lastWakeWordPhrase: string | null;
  onTestWakeWord: () => void;
}

export const ForegroundServiceNotification: React.FC<ForegroundServiceNotificationProps> = ({
  isServiceRunning,
  onToggleService,
  assistantState,
  wakeWordDetectedCount,
  lastWakeWordPhrase,
  onTestWakeWord,
}) => {
  return (
    <div
      id="foreground-service-notification"
      className="w-full max-w-2xl mx-auto mb-4 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-indigo-500/40"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Side: Android Icon & Service Meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0 transition-colors ${
              isServiceRunning
                ? "bg-gradient-to-br from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            {isServiceRunning ? (
              <Radio className="w-5 h-5 animate-pulse" />
            ) : (
              <Power className="w-5 h-5" />
            )}
            {isServiceRunning && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Android Foreground Service
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                Sticky
              </span>
            </div>
            <p className="text-sm font-medium text-slate-200 truncate flex items-center gap-1.5 mt-0.5">
              {isServiceRunning ? (
                <>
                  <span className="text-emerald-400 font-semibold">Active:</span>
                  Listening for <span className="text-pink-300 font-bold">"Avani"</span> in background
                </>
              ) : (
                <span className="text-slate-400">Foreground Service Inactive</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isServiceRunning && (
            <button
              id="test-wake-word-btn"
              onClick={onTestWakeWord}
              title="Simulate Wake-Word Trigger"
              className="px-2.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 text-xs font-medium border border-pink-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trigger "Avani"</span>
            </button>
          )}

          <button
            id="toggle-foreground-service-btn"
            onClick={onToggleService}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              isServiceRunning
                ? "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
            }`}
          >
            {isServiceRunning ? (
              <>
                <MicOff className="w-3.5 h-3.5 text-rose-400" />
                Stop
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Start Service
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-status bar for wake word telemetry */}
      {isServiceRunning && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>PCM16 AudioRecord @ 16kHz</span>
          </div>
          <div className="flex items-center gap-3">
            {lastWakeWordPhrase && (
              <span className="text-slate-300 font-mono">
                Heard: <span className="text-pink-300">"{lastWakeWordPhrase}"</span>
              </span>
            )}
            <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded font-mono text-[10px]">
              Triggers: {wakeWordDetectedCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
