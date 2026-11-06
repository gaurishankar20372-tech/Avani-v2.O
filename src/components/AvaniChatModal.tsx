import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  FileCode,
  FileText,
  Archive,
  Download,
  Share2,
  ExternalLink,
  Mic,
  MicOff,
  Trash2,
  ArrowDown,
  ArrowLeft,
  Check,
  Brain,
} from "lucide-react";
import { ChatMessage, GeneratedFile } from "../types";
import { downloadPdf, downloadZip, sendViaWhatsApp } from "../utils/fileExporter";

interface AvaniChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
  onOpenFileModal: (file: GeneratedFile) => void;
  onClearChat: () => void;
  onSpeakText: (text: string) => void;
  isVoiceMuted: boolean;
  onToggleVoiceMute: () => void;
  onOpenMemory?: () => void;
  memoriesCount?: number;
}

export function AvaniChatModal({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isThinking,
  onOpenFileModal,
  onClearChat,
  onSpeakText,
  isVoiceMuted,
  onToggleVoiceMute,
  onOpenMemory,
  memoriesCount = 0,
}: AvaniChatModalProps) {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [messages, isThinking, isOpen]);

  // Handle SpeechRecognition for text input
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "hi-IN, en-US";

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech recognition error:", e);
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;
    setInputText("");
    onSendMessage(trimmed);
  };

  const suggestions = [
    "अवनी, Python में एक कैलकुलेटर कोड लिखो और ZIP में भेजो",
    "अवनी, ऑफिस छुट्टी के लिए लीव एप्लीकेशन PDF में तैयार करो",
    "अवनी, एक मॉडर्न पोर्टफोलियो वेबसाइट का कोड लिखो",
    "अवनी, कोई चटपटी और मज़ेदार बात सुनाओ!",
  ];

  return (
    <div
      id="avani-chat-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="avani-chat-window"
        style={{ backgroundColor: "#070b14" }}
        className="relative w-full h-full sm:h-[88vh] sm:max-w-2xl bg-slate-950 border border-pink-500/30 sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Chat Header */}
        <header
          style={{ backgroundColor: "#0b1120" }}
          className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-md"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="वापस वॉइस मोड पर जाएं"
              aria-label="Back to Voice Orb"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-pink-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg tracking-tight">
                  Avani <span className="text-pink-400">2.O</span> Chat
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/40 font-mono">
                  चैट मोड
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {isThinking ? "अवनी लिख रही है..." : "ऑनलाइन • वॉइस & टेक्स्ट सक्षम"}
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-1.5">
            {/* Memory Button */}
            {onOpenMemory && (
              <button
                onClick={onOpenMemory}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all bg-purple-950/60 text-purple-300 border border-purple-500/40 hover:bg-purple-900/60 shadow-sm"
                title="अवनी की मेमोरी देखें (Avani's Memory)"
              >
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">मेमोरी</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-200 font-mono">
                  {memoriesCount}
                </span>
              </button>
            )}

            {/* Voice Mute / Speak Toggle */}
            <button
              onClick={onToggleVoiceMute}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-all border ${
                isVoiceMuted
                  ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  : "bg-pink-950/60 text-pink-300 border-pink-500/40 hover:bg-pink-900/60"
              }`}
              title={
                isVoiceMuted
                  ? "आवाज़ बंद है (टैप करें आवाज़ चालू करने के लिए)"
                  : "अवनी बोलकर भी जवाब देगी (टैप करें म्यूट करने के लिए)"
              }
            >
              {isVoiceMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-pink-400" />
              )}
            </button>

            {/* Clear Chat */}
            <button
              onClick={onClearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
              title="चैट साफ़ करें (Clear Chat)"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
              title="बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Message Feed */}
        <div
          style={{ backgroundColor: "#050912" }}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-sans text-sm"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-xl">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">अवनी से चैट शुरू करें</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                  आप हिंदी या अंग्रेज़ी में कोई भी सवाल पूछ सकते हैं, कोड लिखवा सकते हैं, या PDF / ZIP में दस्तावेज़ प्राप्त कर सकते हैं।
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="w-full max-w-md space-y-2 pt-2 text-left">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  सुझाव (Tap to ask):
                </p>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(s)}
                    className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-pink-500/40 text-slate-300 hover:text-white transition-all flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{s}</span>
                    <Send className="w-3.5 h-3.5 text-pink-400 shrink-0 opacity-70" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in duration-150`}
                >
                  <div
                    className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-lg ${
                      isUser
                        ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-tr-sm"
                        : "bg-slate-900 border border-pink-500/30 text-slate-100 rounded-tl-sm shadow-pink-950/20"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800/80">
                        <span className="text-[10px] font-bold text-pink-400 flex items-center gap-1 font-mono uppercase tracking-wider">
                          <Sparkles className="w-3 h-3" />
                          Avani (Persona)
                        </span>

                        <button
                          onClick={() => onSpeakText(msg.text)}
                          className="p-1 rounded-lg text-slate-400 hover:text-pink-300 transition-colors"
                          title="इस उत्तर को सुनें (Listen to audio)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm select-text">
                      {msg.text}
                    </p>

                    {/* Inline File Card if a file was created with this message */}
                    {msg.fileData && (
                      <div
                        style={{ backgroundColor: "#0b1120" }}
                        className="mt-3 rounded-xl border border-pink-500/40 p-3 text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
                              {msg.fileData.fileType === "code" ? (
                                <FileCode className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate">
                                {msg.fileData.title || msg.fileData.fileName}
                              </span>
                              <span className="text-[10px] text-pink-300 font-mono">
                                {msg.fileData.fileName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* File Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            onClick={() => onOpenFileModal(msg.fileData!)}
                            className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                          >
                            <span>पूरी स्क्रीन पर देखें</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => downloadPdf(msg.fileData!)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-medium text-[11px] flex items-center gap-1 transition-all"
                            title="Download PDF"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => downloadZip(msg.fileData!)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-medium text-[11px] flex items-center gap-1 transition-all"
                            title="Download ZIP"
                          >
                            <Archive className="w-3 h-3" />
                            <span>ZIP</span>
                          </button>

                          <button
                            onClick={() => sendViaWhatsApp(msg.fileData!)}
                            className="px-2 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1 transition-all"
                            title="Send via WhatsApp"
                          >
                            <Share2 className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-1 flex items-center justify-end text-[10px] text-slate-400/80 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Thinking / Typing indicator */}
          {isThinking && (
            <div className="flex items-center gap-2 p-3 bg-slate-900 border border-pink-500/30 rounded-2xl rounded-tl-sm w-fit animate-in fade-in duration-150">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
              <span className="text-xs text-pink-300 ml-1.5 italic font-medium">
                अवनी सोच रही है...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion pills above input if messages exist */}
        {messages.length > 0 && (
          <div
            style={{ backgroundColor: "#090e1a" }}
            className="px-3 py-1.5 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar"
          >
            <span className="text-slate-400 shrink-0 font-mono text-[10px]">सुझाव:</span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white transition-colors"
              >
                {s.split(" ")[0]} {s.split(" ")[1] || ""}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          style={{ backgroundColor: "#0b1120" }}
          className="p-3 border-t border-slate-800 flex items-center gap-2 shrink-0 shadow-lg"
        >
          {/* Voice to text dictation button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className={`p-2.5 rounded-2xl transition-all border ${
              isRecording
                ? "bg-rose-600 text-white border-rose-400 animate-pulse shadow-md shadow-rose-600/30"
                : "bg-slate-850 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:text-white"
            }`}
            title={isRecording ? "Listening... (Tap to stop)" : "वॉइस डिक्टेशन (Voice to Text)"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-pink-400" />}
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="अवनी से चैट करें... (Type a message to Avani)"
            className="flex-1 bg-slate-900 border border-slate-700/80 focus:border-pink-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-pink-600/25 transition-all hover:scale-105 active:scale-95"
            title="भेजें (Send)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
