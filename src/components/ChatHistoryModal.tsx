import React, { useEffect } from "react";
import {
  History,
  Plus,
  Trash2,
  X,
  MessageSquare,
  Clock,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ChatSession } from "../types";

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div
      id="chat-history-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="chat-history-modal-content"
        className="w-full max-w-lg max-h-[88vh] bg-black border border-neutral-800 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] ring-1 ring-white/10 relative flex flex-col overflow-hidden text-neutral-100"
      >
        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-neutral-900 bg-neutral-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                  हिस्ट्री चैट्स (Chat History)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-neutral-900 text-pink-300 border border-neutral-800">
                  {sessions.length} सेशंस
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                पुरानी बातचीत खोलें या नया चैट शुरू करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors active:scale-95"
            title="बंद करें (Close)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Action Button: "+ न्यू चैट" */}
        <div className="p-4 sm:p-5 pb-2 shrink-0">
          <button
            id="start-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-pink-950/40 border border-pink-400/30 flex items-center justify-center gap-2.5 transition-all active:scale-98 group"
          >
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <span>+ नया चैट शुरू करें (New Chat)</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pt-2 space-y-2.5">
          {sessions.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-neutral-300">
                कोई पुरानी चैट हिस्ट्री नहीं है
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                ऊपर दिए गए "+ नया चैट" बटन से अवनी के साथ नई बातचीत शुरू करें!
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const lastMessage =
                session.messages && session.messages.length > 0
                  ? session.messages[session.messages.length - 1].text
                  : "";

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-neutral-900 border-pink-500/50 shadow-md shadow-pink-950/30 ring-1 ring-pink-500/30"
                      : "bg-neutral-950 hover:bg-neutral-900/90 border-neutral-800/80 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                          : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {session.title || "बातचीत"}
                        </h4>
                        {isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30 shrink-0">
                            सक्रिय
                          </span>
                        )}
                      </div>

                      {lastMessage && (
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5 max-w-[220px] sm:max-w-sm">
                          {lastMessage}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-1">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {formatDate(session.updatedAt || session.createdAt)}
                        </span>
                        <span>•</span>
                        <span>{session.messages?.length || 0} संदेश</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Delete Session Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
                      title="इस चैट को डिलीट करें"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-pink-400 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-5 py-3 border-t border-neutral-900 bg-neutral-950/90 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Firebase Cloud Sync</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold transition-colors"
          >
            बंद करें (Close)
          </button>
        </footer>
      </div>
    </div>
  );
};
