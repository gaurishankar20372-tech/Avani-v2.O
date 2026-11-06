import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneOff,
  MessageSquare,
  Mail,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Instagram,
  Send,
  FileCode,
  FileText,
  Archive,
  Download,
  Smartphone,
  X,
} from "lucide-react";
import { GeneratedFile, ToolCallEvent } from "../types";
import { downloadPdf, downloadZip, sendViaWhatsApp } from "../utils/fileExporter";

interface IntentExecutionHUDProps {
  currentEvent: ToolCallEvent | null;
  onDismiss: () => void;
  onOpenFileModal?: (file: GeneratedFile) => void;
}

export const IntentExecutionHUD: React.FC<IntentExecutionHUDProps> = ({
  currentEvent,
  onDismiss,
  onOpenFileModal,
}) => {
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);

  useEffect(() => {
    if (
      currentEvent &&
      currentEvent.name === "searchAndCallContact" &&
      currentEvent.status === "success"
    ) {
      setIsCallActive(true);
      setCallDuration(0);
      const timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setIsCallActive(false);
    }
  }, [currentEvent]);

  if (!currentEvent) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="intent-execution-hud"
      className="fixed bottom-6 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold block">
              Android Intent Dispatched
            </span>
            <h4 className="text-xs font-bold text-white font-mono">
              {currentEvent.intentAction || "android.intent.action.VIEW"}
            </h4>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sassy remark */}
      {currentEvent.sassyRemark && (
        <div className="my-3 bg-pink-500/10 border border-pink-500/20 rounded-xl p-2.5 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-pink-200 italic font-medium leading-tight">
            "{currentEvent.sassyRemark}"
          </p>
        </div>
      )}

      {/* Specific tool representation */}
      {currentEvent.name === "searchAndCallContact" && (
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 my-2">
          {currentEvent.status === "success" && isCallActive ? (
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 animate-pulse">
                  <Phone className="w-7 h-7" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h5 className="text-sm font-bold text-white">
                  {currentEvent.args.contactName || "Contact"}
                </h5>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">
                  In Call • {formatTimer(callDuration)}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {currentEvent.args.phoneNumber || "+1 (555) 019-2834"}
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-1">
                <button
                  onClick={() => setIsCallActive(false)}
                  className="px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-colors"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  End Call
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-300">{currentEvent.resultMessage}</p>
            </div>
          )}
        </div>
      )}

      {currentEvent.name === "sendWhatsAppMessage" && (
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 my-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Message
            </span>
            <span className="text-slate-400">To: {currentEvent.args.contactName}</span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl text-xs text-slate-200">
            "{currentEvent.args.message}"
          </div>
          {currentEvent.intentUri && (
            <a
              href={currentEvent.intentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Open in WhatsApp Web / App
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {currentEvent.name === "sendInstagramDirectMessage" && (
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-pink-500/40 my-2 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold bg-gradient-to-r from-pink-400 via-purple-400 to-amber-400 bg-clip-text text-transparent flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              Instagram Direct Message
            </span>
            <span className="text-pink-300 font-mono">@{currentEvent.args.username}</span>
          </div>
          <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900/50 border border-pink-500/30 p-2.5 rounded-xl text-xs text-slate-100">
            "{currentEvent.args.message}"
          </div>
          <div className="flex items-center gap-2">
            {currentEvent.intentUri && (
              <a
                href={currentEvent.intentUri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all"
              >
                <Send className="w-3 h-3" />
                Open Instagram DM
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(currentEvent.args.message || "");
              }}
              title="Copy message to clipboard"
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            💡 <em>Native Android note:</em> Instagram requires the chat deep-link or Share sheet for user privacy, letting you review and tap send seamlessly.
          </p>
        </div>
      )}

      {currentEvent.name === "sendGmail" && (
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 my-2 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-red-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Gmail Draft
            </span>
            <span className="text-slate-400 truncate max-w-[140px]">
              {currentEvent.args.recipientEmail}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/60 p-2 rounded-xl text-xs space-y-1">
            <div className="text-slate-300 font-semibold text-[11px]">
              Subject: {currentEvent.args.subject}
            </div>
            <div className="text-slate-400 text-[11px] line-clamp-2">
              {currentEvent.args.body}
            </div>
          </div>
          {currentEvent.intentUri && (
            <a
              href={currentEvent.intentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Launch Email App
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {currentEvent.name === "openApp" && (
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 my-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">
              {currentEvent.args.appName || "Target App"}
            </div>
            <div className="text-[11px] text-indigo-400 font-mono">
              {currentEvent.args.packageName || "com.android.app"}
            </div>
          </div>
          {currentEvent.intentUri && (
            <a
              href={currentEvent.intentUri}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              Open
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {currentEvent.name === "createAndDeliverFile" && (
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-pink-500/40 my-2 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-semibold text-pink-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              {currentEvent.args.title || "Generated Code & File"}
            </span>
            <span className="text-pink-300 font-mono text-[11px] uppercase bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30">
              {currentEvent.args.language || "file"}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-700/60 p-2.5 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span className="font-mono text-slate-300">{currentEvent.args.fileName}</span>
              <span>{(currentEvent.args.content || "").split("\n").length} lines</span>
            </div>
            <p className="text-slate-400 text-[11px] line-clamp-2 italic">
              {currentEvent.args.summary || "Ready for download and sharing"}
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            {currentEvent.fileData && (
              <>
                <button
                  onClick={() => downloadPdf(currentEvent.fileData!)}
                  className="py-1.5 px-2 bg-red-600/90 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  PDF डाउनलोड
                </button>

                <button
                  onClick={() => downloadZip(currentEvent.fileData!)}
                  className="py-1.5 px-2 bg-amber-600/90 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Archive className="w-3 h-3" />
                  ZIP डाउनलोड
                </button>
              </>
            )}

            {onOpenFileModal && currentEvent.fileData && (
              <button
                onClick={() => onOpenFileModal(currentEvent.fileData!)}
                className="col-span-2 py-1.5 px-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all"
              >
                <span>स्क्रीन पर पूरा कोड देखें & शेयर करें</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}


      {/* Footer status */}
      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          {currentEvent.status === "success" ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Executed
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              {currentEvent.status === "permission_denied" ? "Permission Denied" : "Failed"}
            </>
          )}
        </span>
        <span className="font-mono text-slate-500">
          {new Date(currentEvent.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};
