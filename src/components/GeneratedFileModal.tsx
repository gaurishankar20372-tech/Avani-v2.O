import React, { useState } from "react";
import {
  FileText,
  FileCode,
  Archive,
  Download,
  Share2,
  Copy,
  Check,
  Send,
  Mail,
  X,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { GeneratedFile } from "../types";
import {
  downloadPdf,
  downloadZip,
  downloadRawFile,
  sendViaWhatsApp,
  sendViaEmail,
  shareFileOrText,
} from "../utils/fileExporter";

interface GeneratedFileModalProps {
  file: GeneratedFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GeneratedFileModal({ file, isOpen, onClose }: GeneratedFileModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  if (!isOpen || !file) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadZip = async () => {
    try {
      setDownloadingZip(true);
      await downloadZip(file);
    } finally {
      setDownloadingZip(false);
    }
  };

  const lines = (file.content || "").split("\n");
  const isCode = file.fileType === "code";

  return (
    <div
      id="dedicated-file-delivery-view"
      style={{ backgroundColor: "#070b14" }}
      className="fixed inset-0 z-[100] flex flex-col w-full h-full text-slate-100 overflow-hidden animate-in fade-in duration-200 select-text"
    >
      {/* Top Header Bar */}
      <header
        style={{ backgroundColor: "#0b1120" }}
        className="w-full border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0 shadow-lg"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
            title="वापस अवनी पर जाएं"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">वापस अवनी पर जाएं</span>
            <span className="sm:hidden">वापस</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 shrink-0">
              {isCode ? <FileCode className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-white text-sm sm:text-base truncate">
                  {file.title || file.fileName}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-mono uppercase font-bold">
                  {file.language || "text"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                  {lines.length} lines
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {file.fileName}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0 border border-slate-700"
          aria-label="Close"
          title="स्क्रीन बंद करें"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Avani Delivery Message Banner */}
      <div
        style={{ backgroundColor: "#111827" }}
        className="px-4 py-2 border-b border-pink-500/20 flex items-center justify-between gap-3 text-xs text-pink-300 shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <p className="truncate">
            अवनी: <span className="text-white font-medium">{file.summary || "आपकी स्क्रीन पर फ़ाइल तैयार है!"}</span>
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden md:inline shrink-0">
          {file.exportFormat === "zip" ? "📦 ZIP Archive Ready" : "📄 PDF Document Ready"}
        </span>
      </div>

      {/* Quick Action Toolbar */}
      <div
        style={{ backgroundColor: "#0c1322" }}
        className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0"
      >
        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Download */}
          <button
            onClick={() => downloadPdf(file)}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-all hover:scale-102 active:scale-98"
            title="Download formatted PDF document"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF डाउनलोड</span>
          </button>

          {/* ZIP Download */}
          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
            title="Download ZIP package with README"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{downloadingZip ? "जिप बन रहा है..." : "ZIP डाउनलोड"}</span>
          </button>

          {/* Raw File Download */}
          <button
            onClick={() => downloadRawFile(file)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Download raw source code / text file"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">फ़ाइल सेव करें</span>
          </button>
        </div>

        {/* Share & Copy Buttons */}
        <div className="flex items-center gap-1.5">
          {/* WhatsApp */}
          <button
            onClick={() => sendViaWhatsApp(file, file.recipient)}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium flex items-center gap-1.5 transition-all"
            title="WhatsApp पर भेजें"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* Email */}
          <button
            onClick={() => sendViaEmail(file, file.recipient)}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-medium flex items-center gap-1.5 transition-all"
            title="ईमेल पर भेजें"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">ईमेल</span>
          </button>

          {/* Share */}
          <button
            onClick={() => shareFileOrText(file)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-medium flex items-center gap-1.5 transition-all"
            title="शेयर करें"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">शेयर</span>
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-all"
            title="कॉपी करें"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">कॉपी हुआ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>कॉपी</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area - 100% Solid, High Readability */}
      <div
        style={{ backgroundColor: "#050912" }}
        className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-sm leading-relaxed"
      >
        <div className="max-w-4xl mx-auto">
          {/* Document or Code content */}
          {isCode ? (
            <div
              style={{ backgroundColor: "#0b1120" }}
              className="rounded-2xl border border-slate-800 p-4 overflow-x-auto shadow-inner"
            >
              <table className="w-full border-collapse">
                <tbody>
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="w-12 pr-4 text-right text-slate-600 select-none align-top font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="whitespace-pre-wrap break-all text-slate-200 font-mono text-xs sm:text-sm">
                        {line || " "}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{ backgroundColor: "#0b1120" }}
              className="rounded-2xl border border-slate-800 p-6 sm:p-8 font-sans text-slate-100 shadow-inner space-y-4"
            >
              <div className="border-b border-slate-800 pb-4 mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {file.title || file.fileName}
                </h1>
                <p className="text-xs text-pink-400 mt-1 font-mono">
                  {file.fileName} • {lines.length} lines
                </p>
              </div>

              <div className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {file.content}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Return Bar */}
      <footer
        style={{ backgroundColor: "#0b1120" }}
        className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>अवनी: फ़ाइल सफलतापूर्वक स्क्रीन पर डिलीवर हुई</span>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-pink-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>वापस अवनी पर जाएं</span>
        </button>
      </footer>
    </div>
  );
}
