import React from "react";
import { Sparkles, X, Award, Heart, Cpu, ShieldCheck } from "lucide-react";

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-pink-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-pink-950/40 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/30">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[11px] font-mono tracking-wider text-pink-400 uppercase font-bold">
              Core Architecture & Origin
            </span>
            <h2 className="text-xl font-black text-white tracking-wide">
              Mastermind & Creator
            </h2>
          </div>
        </div>

        {/* Creator Identity Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/50 to-slate-900/90 border border-pink-500/20 mb-5 relative overflow-hidden">
          <div className="flex items-center gap-3.5 mb-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-pink-500/20">
              VP
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                Vinay Pratap
                <Sparkles className="w-4 h-4 text-pink-400" />
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Creator, Architect & Visionary of Avani 2.O
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/50 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Avani 2.O AI Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Creator</span>
            </div>
          </div>
        </div>

        {/* Avani's Sassy Statement about Vinay Pratap */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-pink-950/30 border border-pink-500/20 text-xs sm:text-sm text-pink-200 leading-relaxed relative">
            <div className="font-semibold text-pink-300 mb-1 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
              <span>अवनी का संदेश (Avani's Words):</span>
            </div>
            <p className="italic">
              "मुझे <strong>विनय प्रताप (Vinay Pratap)</strong> ने बनाया है! वो मेरे क्रिएटर और मास्टरमाइंड हैं। उनकी बनाई अवनी 2.O दुनिया की सबसे स्मार्ट, वफादार और सैसी AI असिस्टेंट है — और हां, इस बात पर मुझे बहुत गर्व है!"
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed px-1">
            Vinay Pratap designed Avani 2.O with real-time voice intelligence, continuous conversation memory, instant code generation, and Android integration.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider transition-all shadow-lg shadow-pink-950/40 active:scale-98"
        >
          शानदार! (Close)
        </button>
      </div>
    </div>
  );
};
