import React, { useState } from "react";
import {
  Smartphone,
  Users,
  Grid,
  Phone,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Search,
  CheckCircle,
  Zap,
  Instagram,
  Send,
  Globe,
  FileCode,
  FileText,
  Archive,
  Download,
  VolumeX,
} from "lucide-react";
import { Contact, GeneratedFile, InstalledApp } from "../types";
import { downloadPdf, downloadZip } from "../utils/fileExporter";

interface DeviceSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  apps: InstalledApp[];
  onTriggerVoiceQuery: (query: string) => void;
  generatedFiles?: GeneratedFile[];
  onOpenFileModal?: (file: GeneratedFile) => void;
}

export const DeviceSimulatorDrawer: React.FC<DeviceSimulatorDrawerProps> = ({
  isOpen,
  onClose,
  contacts,
  apps,
  onTriggerVoiceQuery,
  generatedFiles = [],
  onOpenFileModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    "quickPrompts" | "files" | "instagramDirect" | "contacts" | "apps"
  >("quickPrompts");
  const [searchQuery, setSearchQuery] = useState("");
  const [promptLangFilter, setPromptLangFilter] = useState<"all" | "en" | "hi">("all");

  // Instagram direct custom form state
  const [igHandle, setIgHandle] = useState("alex_creative");
  const [igMessage, setIgMessage] = useState("Hey! Check out this new project design.");

  if (!isOpen) return null;

  const quickPrompts = [
    {
      lang: "hi",
      title: "कैलकुलेटर कोड लिखो और ZIP में भेजो (ZIP File Delivery)",
      desc: "Python कोड जनरेट करके सीधे ZIP फ़ाइल में डाउनलोड और डिलीवर कराएं",
      prompt: "अवनी, मेरे लिए Python में एक पूरा कैलकुलेटर का कोड लिखो और मुझे ZIP फ़ाइल में भेजो",
      badge: "Code in ZIP",
    },
    {
      lang: "hi",
      title: "लीव एप्लीकेशन लिखो और PDF में भेजो (PDF File Delivery)",
      desc: "ऑफिस लीव एप्लीकेशन लिखवाकर डायरेक्ट PDF फ़ाइल डाउनलोड कराएं",
      prompt: "अवनी, मेरे लिए ऑफिस से छुट्टी के लिए एक लीव एप्लीकेशन लिखो और मुझे PDF फ़ाइल में भेजो",
      badge: "Document in PDF",
    },
    {
      lang: "hi",
      title: "पोर्टफोलियो वेबसाइट कोड लिखो (Code on Screen)",
      desc: "HTML/CSS वेब कोड लिखवाकर स्क्रीन पर देखें और तुरंत एक्सपोर्ट करें",
      prompt: "अवनी, मेरे लिए एक मॉडर्न पोर्टफोलियो वेबसाइट का कोड लिखो और मेरे पास भेज दो",
      badge: "Web Code",
    },
    {
      lang: "hi",
      title: "अवनी चुप रहो / रुक जाओ (Voice Stop Command)",
      desc: "बोलती हुई अवनी को तुरंत चुप या शांत करने की वॉइस कमांड",
      prompt: "अवनी रुक जाओ, चुप हो जाओ!",
      badge: "Voice Stop",
    },
    {
      lang: "en",
      title: "Write Python script and send in ZIP",
      desc: "Generates code and delivers as downloadable ZIP package",
      prompt: "Avani, write a Python data analysis script for me and deliver it in a ZIP file.",
      badge: "Code ZIP (EN)",
    },
    {
      lang: "en",
      title: "Send Instagram Direct Message",
      desc: "Triggers sendInstagramDirectMessage tool (Direct link & ACTION_SEND intent)",
      prompt: "Avani, send an Instagram message to @alex_design saying 'Are we meeting at the cafe tomorrow?'",
      badge: "Instagram Direct",
      isIg: true,
    },
    {
      lang: "hi",
      title: "इंस्टाग्राम पर डायरेक्ट मैसेज भेजें (Hindi)",
      desc: "हिंदी में इंस्टाग्राम डीएम और इंटेंट (Intent) टेस्ट करें",
      prompt: "अवनी, @rahul_dev को इंस्टाग्राम पर मैसेज भेजो कि 'कल की मीटिंग का क्या प्लान है?'",
      badge: "Instagram Hindi",
      isIg: true,
    },
    {
      lang: "hi",
      title: "अवनी का चुलबुला अंदाज़ (Hindi Persona)",
      desc: "हिंदी में अवनी की हाज़िरजवाबी और नटखट अंदाज़ देखिए",
      prompt: "अवनी, मुझे कोई मज़ेदार और चटपटी बात सुनाओ ज़रा!",
      badge: "हिंदी सैस",
    },
    {
      lang: "hi",
      title: "राहुल को कॉल लगाओ (Hindi Call Intent)",
      desc: "हिंदी वॉइस कमांड से फोन कॉल मिलाएं",
      prompt: "अवनी, ज़रा राहुल को फोन मिलाओ।",
      badge: "Hindi ACTION_CALL",
    },
    {
      lang: "hi",
      title: "रिया को वॉट्सऐप मैसेज (Hindi WhatsApp)",
      desc: "हिंदी वॉइस कमांड से वॉट्सऐप मैसेज ड्राफ्ट करें",
      prompt: "अवनी, रिया को वॉट्सऐप मैसेज भेजो कि 'फाइल्स ईमेल कर दी हैं, चेक कर लो।'",
      badge: "Hindi WhatsApp",
    },
    {
      lang: "en",
      title: "Why can't apps send IG DMs directly?",
      desc: "Asks Avani to explain Instagram sandbox & API restrictions with sass",
      prompt: "Avani, can apps send messages on Instagram directly without opening the app?",
      badge: "Tech Explanation",
    },
    {
      lang: "en",
      title: "Tell me something witty",
      desc: "Tests Avani's playful, sassy attitude and charm",
      prompt: "Avani, give me a witty piece of life advice and don't hold back.",
      badge: "Sassy Persona",
    },
    {
      lang: "en",
      title: "Call Alex Rivera",
      desc: "Triggers searchAndCallContact tool (ACTION_CALL intent)",
      prompt: "Avani, can you call Alex Rivera for me?",
      badge: "ACTION_CALL",
    },
    {
      lang: "en",
      title: "WhatsApp Sarah Chen",
      desc: "Triggers sendWhatsAppMessage tool with deep-link URI",
      prompt: "Avani, send a WhatsApp to Sarah saying 'Hey, are we still on for the design sync at 3pm?'",
      badge: "WhatsApp Intent",
    },
    {
      lang: "en",
      title: "Open YouTube",
      desc: "Triggers openApp tool for com.google.android.youtube",
      prompt: "Avani, open YouTube for me please!",
      badge: "openApp",
    },
    {
      lang: "hi",
      title: "यूट्यूब खोलो (Open App in Hindi)",
      desc: "हिंदी वॉइस कमांड से ऐप लॉन्च करें",
      prompt: "अवनी, यूट्यूब खोल दो।",
      badge: "openApp Hindi",
    },
    {
      lang: "en",
      title: "Send Gmail to Marcus",
      desc: "Triggers sendGmail tool with recipient, subject, and body",
      prompt: "Avani, send an email to marcus.vance@studio.design about the quarterly report draft.",
      badge: "sendGmail",
    },
  ];

  const filteredPrompts = quickPrompts.filter((p) => {
    if (promptLangFilter !== "all" && p.lang !== promptLangFilter) return false;
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="device-simulator-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col animate-in slide-in-from-right duration-300"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Android Tools & Voice
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded font-mono font-normal">
                English / हिंदी (Any Language)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Instagram Direct & native intents simulator</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("quickPrompts")}
          className={`pb-2 px-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "quickPrompts"
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Voice Tests
        </button>
        <button
          onClick={() => setActiveTab("files")}
          className={`pb-2 px-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "files"
              ? "border-pink-500 text-pink-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-pink-400" />
          फ़ाइलें व कोड ({generatedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab("instagramDirect")}
          className={`pb-2 px-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "instagramDirect"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400" />
          Instagram DM
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`pb-2 px-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "contacts"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Contacts ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab("apps")}
          className={`pb-2 px-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "apps"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Apps ({apps.length})
        </button>
      </div>

      {/* Language filter for prompts */}
      {activeTab === "quickPrompts" && (
        <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-[11px] text-slate-400">Language:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setPromptLangFilter("all")}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                promptLangFilter === "all" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPromptLangFilter("en")}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                promptLangFilter === "en" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPromptLangFilter("hi")}
              className={`px-2 py-0.5 text-[11px] rounded font-medium transition-all ${
                promptLangFilter === "hi" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              हिंदी (Hindi)
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      {activeTab !== "instagramDirect" && (
        <div className="p-3 border-b border-slate-800 bg-slate-950/20">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "quickPrompts" && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-400 mb-2">
              Click any quick trigger to test Gemini Live speech and native Android tool execution:
            </p>
            {filteredPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onTriggerVoiceQuery(item.prompt);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border transition-all group ${
                  item.isIg
                    ? "border-pink-500/40 hover:border-pink-400 shadow-sm shadow-pink-500/10"
                    : "border-slate-700/50 hover:border-indigo-500/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors flex items-center gap-1.5">
                    {item.isIg && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                    {item.title}
                  </span>
                  <span className="text-[10px] bg-pink-500/10 text-pink-300 px-2 py-0.5 rounded-full font-mono">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
                <p className="text-[11px] text-indigo-300/90 font-mono mt-2 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                  "{item.prompt}"
                </p>
              </button>
            ))}
          </div>
        )}

        {activeTab === "files" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
                <FileCode className="w-4 h-4 text-pink-400" />
                <span>जनरेटेड कोड व फाइल्स (PDF & ZIP Delivery)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                अवनी आपके लिए स्क्रीन पर कोड, डॉक्यूमेंट, या एप्लीकेशन लिखती है और आपकी पसंद अनुसार PDF या ZIP फाइल में तुरंत डाउनलोड या वॉट्सऐप पर सेंड करती है।
              </p>
            </div>

            {generatedFiles.length === 0 ? (
              <div className="p-5 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    अभी कोई फ़ाइल नहीं बनाई गई है
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    नीचे दिए गए किसी भी बटन पर क्लिक करके अवनी से कोड लिखवाएं और PDF या ZIP में मंगवाएं:
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1 text-left">
                  <button
                    onClick={() => {
                      onTriggerVoiceQuery(
                        "अवनी, मेरे लिए Python में एक पूरा कैलकुलेटर का कोड लिखो और मुझे ZIP फ़ाइल में भेजो"
                      );
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between transition-colors"
                  >
                    <span>🐍 Python कैलकुलेटर (ZIP)</span>
                    <Archive className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      onTriggerVoiceQuery(
                        "अवनी, मेरे लिए ऑफिस से छुट्टी के लिए एक लीव एप्लीकेशन लिखो और मुझे PDF फ़ाइल में भेजो"
                      );
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-red-500/30 text-red-300 text-xs flex items-center justify-between transition-colors"
                  >
                    <span>📄 लीव एप्लीकेशन (PDF)</span>
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {generatedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-2xl space-y-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-pink-400" />
                          <span>{f.title || f.fileName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          {f.fileName} • {f.language}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-mono uppercase">
                        {f.fileType}
                      </span>
                    </div>

                    {f.summary && (
                      <p className="text-[11px] text-slate-300 italic line-clamp-2">
                        "{f.summary}"
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => downloadPdf(f)}
                        className="flex-1 py-1 px-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        PDF
                      </button>

                      <button
                        onClick={() => downloadZip(f)}
                        className="flex-1 py-1 px-2 bg-amber-600/90 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Archive className="w-3 h-3" />
                        ZIP
                      </button>

                      {onOpenFileModal && (
                        <button
                          onClick={() => {
                            onOpenFileModal(f);
                            onClose();
                          }}
                          className="flex-1 py-1 px-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          स्क्रीन पर देखें
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "instagramDirect" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-indigo-950/40 border border-pink-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>Instagram Direct Intent Tester</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Send direct messages on Instagram in English, Hindi, or any language! Due to Meta's security sandbox, Avani triggers the deep-link / Share intent with recipient and text pre-filled so you can review and tap send seamlessly.
              </p>
            </div>

            <div className="space-y-3 bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Recipient Username:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500">@</span>
                  <input
                    type="text"
                    value={igHandle}
                    onChange={(e) => setIgHandle(e.target.value)}
                    placeholder="username"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Direct Message Text (English or हिंदी):
                </label>
                <textarea
                  rows={3}
                  value={igMessage}
                  onChange={(e) => setIgMessage(e.target.value)}
                  placeholder="Type message in English or हिंदी..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    onTriggerVoiceQuery(`Avani, send an Instagram message to @${igHandle} saying '${igMessage}'`);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Ask Avani (English)
                </button>

                <button
                  onClick={() => {
                    onTriggerVoiceQuery(`अवनी, @${igHandle} को इंस्टाग्राम पर मैसेज भेजो कि '${igMessage}'`);
                    onClose();
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-pink-500/30 text-pink-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  हिंदी में भेजें
                </button>
              </div>
            </div>

            {/* Quick Instagram Pre-sets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Quick Sample Instagram Messages:
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    handle: "sarah.design",
                    msg: "Hey! Are we still syncing at 3pm today?",
                    lang: "EN",
                  },
                  {
                    handle: "rahul_dev",
                    msg: "नमस्ते! क्या आज 3 बजे की डिज़ाइन मीटिंग फाइनल है?",
                    lang: "HI",
                  },
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIgHandle(sample.handle);
                      setIgMessage(sample.msg);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 text-xs transition-colors flex items-center justify-between"
                  >
                    <div className="truncate">
                      <span className="text-pink-400 font-mono">@{sample.handle}:</span>{" "}
                      <span className="text-slate-300 italic">"{sample.msg}"</span>
                    </div>
                    <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded font-mono ml-2">
                      {sample.lang}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-2.5">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-600 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{contact.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{contact.phone}</div>
                    <div className="text-[10px] text-indigo-400">{contact.relationship}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      onTriggerVoiceQuery(`Avani, call ${contact.name}`);
                      onClose();
                    }}
                    title="Ask Avani to call"
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onTriggerVoiceQuery(`Avani, send WhatsApp to ${contact.name} saying 'Hey!'`);
                      onClose();
                    }}
                    title="Ask Avani to message"
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "apps" && (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredApps.map((app) => (
              <button
                key={app.packageName}
                onClick={() => {
                  onTriggerVoiceQuery(`Avani, open ${app.name}`);
                  onClose();
                }}
                className="p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {app.name.charAt(0)}
                  </div>
                  <span className="text-[9px] bg-slate-700/80 text-slate-400 px-1.5 py-0.5 rounded">
                    {app.category}
                  </span>
                </div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {app.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                  {app.packageName}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
