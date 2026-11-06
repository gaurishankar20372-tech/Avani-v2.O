import React, { useState } from "react";
import { Brain, Sparkles, Trash2, Plus, X, Heart, CheckCircle2, Bookmark } from "lucide-react";
import { AvaniMemory } from "../services/avaniMemoryService";

interface AvaniMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: AvaniMemory[];
  onAddMemory: (content: string, category: "fact" | "preference" | "task" | "general") => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
}

export const AvaniMemoryModal: React.FC<AvaniMemoryModalProps> = ({
  isOpen,
  onClose,
  memories,
  onAddMemory,
  onDeleteMemory,
}) => {
  const [newContent, setNewContent] = useState("");
  const [category, setCategory] = useState<"fact" | "preference" | "task" | "general">("fact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Listen for Escape key to close modal
  React.useEffect(() => {
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    const contentToSave = newContent.trim();
    try {
      setIsSubmitting(true);
      await onAddMemory(contentToSave, category);
      setNewContent("");
      setSaveSuccess(`सुरक्षित कर दिया गया! अवनी इसे हमेशा याद रखेगी ✨`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      console.error("Save memory notice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await onDeleteMemory(id);
    } finally {
      setDeletingId(null);
    }
  };

  const categoryBadges: Record<string, { label: string; color: string }> = {
    fact: { label: "तथ्य (Fact)", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    preference: { label: "पसंद (Preference)", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
    task: { label: "कार्य (Task)", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
    general: { label: "नोट (General)", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  };

  return (
    <div
      id="avani-memory-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="avani-memory-window"
        style={{ backgroundColor: "#070b14" }}
        className="relative w-full max-w-xl max-h-[90vh] bg-slate-950 border border-purple-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <header
          style={{ backgroundColor: "#0b1120" }}
          className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  अवनी की मेमोरी (Avani's Memory)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Firebase Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                अवनी आपके बारे में सीखी गई बातें हमेशा याद रखती है
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Add Memory Form */}
          <form onSubmit={handleAdd} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                अवनी को कुछ नया याद कराएं
              </span>
              <div className="flex gap-1.5">
                {(["fact", "preference", "task", "general"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                      category === cat
                        ? "bg-purple-600 text-white border-purple-400"
                        : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="उदा: मुझे मीठा बहुत पसंद है, या मेरा नाम राहुल है..."
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!newContent.trim() || isSubmitting}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>सेव हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>याद रखें</span>
                  </>
                )}
              </button>
            </div>

            {saveSuccess && (
              <div className="px-3 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}
          </form>

          {/* Stored Memories List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                सुरक्षित यादें ({memories.length})
              </span>
              <span className="text-[11px] text-purple-400/80 font-sans">
                क्लाउड में हमेशा सेव्ड
              </span>
            </div>

            {memories.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <Brain className="w-10 h-10 text-purple-400/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">
                  अभी तक कोई बात याद नहीं कराई गई है
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  आप बोलकर भी अवनी से कह सकते हैं: "अवनी याद रखना मेरा नाम..." और यह अपने आप हमेशा के लिए याद रखेगी!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {memories.map((m) => {
                  const badge = categoryBadges[m.category] || categoryBadges.general;
                  return (
                    <div
                      key={m.id}
                      className="group p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition flex items-start justify-between gap-3 shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md border font-medium ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                          {m.content}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="यह याद हटाएँ (Forget this)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <footer
          style={{ backgroundColor: "#0b1120" }}
          className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0"
        >
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>फायरबेस मेमोरी एक्टिव</span>
          </div>
          <span className="text-slate-500">
            वॉइस और चैट दोनों में ऑटो-रिफ्लेक्टेड
          </span>
        </footer>
      </div>
    </div>
  );
};
