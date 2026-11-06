import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileCode,
  FileText,
  Archive,
  ArrowLeft,
  Trash2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Instagram,
  Phone,
  Mail,
  Loader2,
  Download,
} from "lucide-react";
import { ChatMessage, GeneratedFile, LanguageMode } from "../types";
import { downloadPdf, downloadZip, downloadRawFile } from "../utils/fileExporter";

interface ChatModeViewProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  onBackToVoice: () => void;
  onOpenFileModal: (file: GeneratedFile) => void;
  languageMode: LanguageMode;
  isLoading: boolean;
}

export const ChatModeView: React.FC<ChatModeViewProps> = ({
  messages,
  onSendMessage,
  onClearChat,
  onBackToVoice,
  onOpenFileModal,
  languageMode,
  isLoading,
}) => {
  const [inputText, setInputText] = useState("");
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition for input bar mic
  const toggleSpeechInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListeningInput) {
      speechRecognitionRef.current?.stop();
      setIsListeningInput(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = languageMode === "hi" ? "hi-IN" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningInput(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = () => {
        setIsListeningInput(false);
      };

      recognition.onend = () => {
        setIsListeningInput(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech recognition error:", e);
      setIsListeningInput(false);
    }
  };

  // Play audio for a specific message
  const handlePlayAudio = async (msg: ChatMessage) => {
    // If already playing this message, stop
    if (playingAudioId === msg.id) {
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
        activeAudioElementRef.current = null;
      }
      setPlayingAudioId(null);
      return;
    }

    // Stop previous audio if any
    if (activeAudioElementRef.current) {
      activeAudioElementRef.current.pause();
      activeAudioElementRef.current = null;
    }

    // If we already have audioBase64
    if (msg.audioBase64) {
      playBase64Audio(msg.id, msg.audioBase64);
      return;
    }

    // Fetch audio from server TTS endpoint or use client speech synthesis
    setAudioLoadingId(msg.id);
    try {
      const textToSpeak = msg.text.replace(/```[\s\S]*?```/g, "Code delivered on screen.");
      let played = false;

      try {
        const res = await fetch("/api/avani/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: textToSpeak, voice: "Kore" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.audioBase64) {
            msg.audioBase64 = data.audioBase64;
            playBase64Audio(msg.id, data.audioBase64);
            played = true;
          }
        }
      } catch (_fetchErr) {
        // Continue to native speech
      }

      if (!played && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 1.05;
        utterance.pitch = 1.08;
        const isHindi = /[\u0900-\u097F]/.test(textToSpeak);
        utterance.lang = isHindi ? "hi-IN" : "en-US";
        setPlayingAudioId(msg.id);
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      }
    } catch (_err) {
      setPlayingAudioId(null);
    } finally {
      setAudioLoadingId(null);
    }
  };

  const playBase64Audio = (msgId: string, base64: string) => {
    try {
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      activeAudioElementRef.current = audio;
      setPlayingAudioId(msgId);
      audio.onended = () => {
        setPlayingAudioId(null);
        activeAudioElementRef.current = null;
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
        activeAudioElementRef.current = null;
      };
      audio.play();
    } catch (e) {
      console.error("Audio playback error:", e);
      setPlayingAudioId(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    setInputText("");
    onSendMessage(trimmed);
  };

  const handleSuggestionClick = (text: string) => {
    onSendMessage(text);
  };

  return (
    <div
      id="chat-mode-container"
      className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col relative select-text"
    >
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-3">
        {/* Back to Voice Button */}
        <button
          onClick={onBackToVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-all hover:scale-102 active:scale-98"
          title="Voice Mode पर वापस जाएं (Swipe left-to-right)"
        >
          <ArrowLeft className="w-4 h-4 text-pink-400" />
          <span>Voice Mode</span>
        </button>

        {/* Center Title */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-pink-200 to-pink-400 bg-clip-text text-transparent">
            AVANI CHAT
          </h1>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20">
            Live AI
          </span>
        </div>

        {/* Clear Chat Action */}
        <button
          onClick={onClearChat}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 max-w-3xl w-full mx-auto pb-32">
        {messages.length === 0 ? (
          /* Zero State with Prompt Suggestions */
          <div className="h-full flex flex-col items-center justify-center text-center my-auto py-12 px-4 space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-pink-500/25">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-lg font-bold text-white">Avani Chat Assistant</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                यहाँ आप बोलकर या टाइप करके कुछ भी करवा सकते हैं—कोड, पीडीएफ, वॉट्सऐप या इंस्टाग्राम मैसेज!
              </p>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
              <button
                onClick={() =>
                  handleSuggestionClick("मेरे लिए Python में कैलकुलेटर का कोड लिखो और मुझे ZIP फाइल में भेजो")
                }
                className="p-3 text-left rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-slate-200 text-xs transition-all flex items-center gap-2.5"
              >
                <Archive className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">🐍 Python कैलकुलेटर (ZIP)</span>
              </button>

              <button
                onClick={() =>
                  handleSuggestionClick("मेरे लिए ऑफिस के लिए लीव एप्लीकेशन लिखो और मुझे PDF में भेजो")
                }
                className="p-3 text-left rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/50 text-slate-200 text-xs transition-all flex items-center gap-2.5"
              >
                <FileText className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">📄 लीव एप्लीकेशन (PDF)</span>
              </button>

              <button
                onClick={() =>
                  handleSuggestionClick("रिया को वॉट्सऐप मैसेज भेजो कि 'मीटिंग 5 बजे है'")
                }
                className="p-3 text-left rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-xs transition-all flex items-center gap-2.5"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">💬 वॉट्सऐप मैसेज भेजें</span>
              </button>

              <button
                onClick={() =>
                  handleSuggestionClick("अवनी, मुझे कोई बहुत मज़ेदार और चटपटी बात सुनाओ ज़रा!")
                }
                className="p-3 text-left rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 text-slate-200 text-xs transition-all flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                <span className="truncate">✨ अवनी की चटपटी बातें</span>
              </button>
            </div>
          </div>
        ) : (
          /* Render Conversation Messages */
          messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
              >
                {/* Message Bubble Container */}
                <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%]">
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md shadow-pink-600/20">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                      isUser
                        ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-br-none"
                        : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Inline Tool Execution: Generated File Card */}
                    {msg.fileData && (
                      <div className="mt-3 bg-slate-950 border border-pink-500/30 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {msg.fileData.fileType === "code" ? (
                              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-red-400 shrink-0" />
                            )}
                            <span className="font-semibold text-white truncate text-xs">
                              {msg.fileData.title || msg.fileData.fileName}
                            </span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-mono text-[10px] uppercase shrink-0">
                            {msg.fileData.language || "file"}
                          </span>
                        </div>

                        {msg.fileData.summary && (
                          <p className="text-[11px] text-slate-400 italic">
                            {msg.fileData.summary}
                          </p>
                        )}

                        {/* File Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <button
                            onClick={() => downloadPdf(msg.fileData!)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                          </button>

                          <button
                            onClick={() => downloadZip(msg.fileData!)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          >
                            <Archive className="w-3 h-3" />
                            <span>ZIP</span>
                          </button>

                          <button
                            onClick={() => downloadRawFile(msg.fileData!)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3 text-slate-400" />
                            <span>सेव</span>
                          </button>

                          <button
                            onClick={() => onOpenFileModal(msg.fileData!)}
                            className="px-2.5 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/40 text-pink-300 text-[11px] font-semibold flex items-center gap-1 transition-colors ml-auto"
                          >
                            <span>स्क्रीन पर देखें</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline Tool Execution: WhatsApp Intent Card */}
                    {msg.toolEvent && msg.toolEvent.name === "sendWhatsAppMessage" && (
                      <div className="mt-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp to {msg.toolEvent.args.contactName}</span>
                        </div>
                        <p className="text-slate-200 italic bg-slate-900/60 p-2 rounded-lg">
                          "{msg.toolEvent.args.message}"
                        </p>
                        {msg.toolEvent.intentUri && (
                          <a
                            href={msg.toolEvent.intentUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Open WhatsApp
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Inline Tool Execution: Instagram DM Card */}
                    {msg.toolEvent && msg.toolEvent.name === "sendInstagramDirectMessage" && (
                      <div className="mt-3 bg-pink-950/40 border border-pink-500/30 rounded-xl p-2.5 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-pink-400 font-semibold">
                          <Instagram className="w-3.5 h-3.5" />
                          <span>Instagram to @{msg.toolEvent.args.username}</span>
                        </div>
                        <p className="text-slate-200 italic bg-slate-900/60 p-2 rounded-lg">
                          "{msg.toolEvent.args.message}"
                        </p>
                        {msg.toolEvent.intentUri && (
                          <a
                            href={msg.toolEvent.intentUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Open Instagram DM
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Inline Tool Execution: Phone Call Card */}
                    {msg.toolEvent && msg.toolEvent.name === "searchAndCallContact" && (
                      <div className="mt-3 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {msg.toolEvent.args.contactName}
                            </div>
                            <div className="text-[11px] text-emerald-400 font-mono">
                              {msg.toolEvent.args.phoneNumber || "Calling..."}
                            </div>
                          </div>
                        </div>
                        {msg.toolEvent.intentUri && (
                          <a
                            href={msg.toolEvent.intentUri}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold"
                          >
                            Call
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Timestamp & Audio Play Action */}
                <div
                  className={`flex items-center gap-2 px-1 text-[10px] text-slate-500 ${
                    isUser ? "flex-row-reverse" : "flex-row pl-9"
                  }`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  {/* Audio Play Button for Avani messages */}
                  {!isUser && (
                    <button
                      onClick={() => handlePlayAudio(msg)}
                      disabled={audioLoadingId === msg.id}
                      className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-pink-400 transition-colors flex items-center gap-1"
                      title={playingAudioId === msg.id ? "Stop audio" : "Listen in Avani's voice"}
                    >
                      {audioLoadingId === msg.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                      ) : playingAudioId === msg.id ? (
                        <>
                          <VolumeX className="w-3 h-3 text-pink-400" />
                          <span className="text-[10px] text-pink-400">Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span className="text-[10px]">Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 max-w-[80%] animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-pink-600 to-purple-600 flex items-center justify-center text-white shrink-0 mt-1">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-pink-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
              <span>Avani is thinking & executing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 p-3 sm:p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-2 bg-slate-900 border border-slate-800 focus-within:border-pink-500/50 rounded-2xl p-1.5 shadow-xl transition-all"
        >
          {/* Quick Voice Mic Button */}
          <button
            type="button"
            onClick={toggleSpeechInput}
            className={`p-2.5 rounded-xl transition-all ${
              isListeningInput
                ? "bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title={isListeningInput ? "Stop speech input" : "Speak your message"}
          >
            {isListeningInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListeningInput
                ? "Listening to your voice..."
                : "Ask Avani, write code, send WhatsApp, or create PDF..."
            }
            className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:hover:bg-pink-600 text-white shadow-md shadow-pink-600/20 transition-all active:scale-95 shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400 mt-2">
          Swipe left-to-right to return to Voice Mode
        </p>
      </div>
    </div>
  );
};
