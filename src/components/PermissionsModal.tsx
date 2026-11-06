import React, { useEffect } from "react";
import {
  ShieldAlert,
  Mic,
  Users,
  PhoneCall,
  Bell,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { PermissionsState } from "../types";

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: PermissionsState;
  onTogglePermission: (key: keyof PermissionsState) => void;
  onGrantAll: () => void;
  onRequestMicPermission?: () => void;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({
  isOpen,
  onClose,
  permissions,
  onTogglePermission,
  onGrantAll,
  onRequestMicPermission,
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

  const permissionItems = [
    {
      key: "recordAudio" as keyof PermissionsState,
      title: "RECORD_AUDIO",
      friendlyName: "Microphone & Voice Input (माइक्रोफ़ोन)",
      desc: "Captures 16kHz PCM audio stream for real-time Gemini Live and local wake-word listener.",
      icon: Mic,
      required: true,
      granted: permissions.recordAudio,
    },
    {
      key: "readContacts" as keyof PermissionsState,
      title: "READ_CONTACTS",
      friendlyName: "Android Contacts Provider (कॉन्टैक्ट्स)",
      desc: "Allows Avani to query contact names, phone numbers, and emails for calling and WhatsApp messaging.",
      icon: Users,
      required: false,
      granted: permissions.readContacts,
    },
    {
      key: "callPhone" as keyof PermissionsState,
      title: "CALL_PHONE",
      friendlyName: "Direct Phone Dialer (फोन कॉलिंग)",
      desc: "Empowers Avani to trigger native outgoing phone calls directly without dialing manually.",
      icon: PhoneCall,
      required: false,
      granted: permissions.callPhone,
    },
    {
      key: "postNotifications" as keyof PermissionsState,
      title: "POST_NOTIFICATIONS",
      friendlyName: "Foreground Service Notifications (नोटिफिकेशन)",
      desc: "Ensures the Android OS doesn't kill Avani in the background by keeping a persistent status notification.",
      icon: Bell,
      required: false,
      granted: permissions.postNotifications,
    },
  ];

  const allGranted = Object.values(permissions).every(Boolean);

  const handleAction = (key: keyof PermissionsState) => {
    if (key === "recordAudio" && onRequestMicPermission && !permissions.recordAudio) {
      onRequestMicPermission();
    } else {
      onTogglePermission(key);
    }
  };

  return (
    <div
      id="permissions-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="permissions-modal-content"
        className="w-full max-w-lg max-h-[90vh] bg-black border border-neutral-800 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.98)] ring-1 ring-white/10 relative flex flex-col overflow-hidden text-neutral-100"
      >
        {/* Decorative subtle background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header (Fixed at top) */}
        <header className="px-5 py-4 border-b border-neutral-900 bg-neutral-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-pink-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                डिवाइस परमिशन्स (Permissions)
              </h3>
              <p className="text-xs text-neutral-400">
                Android & Web Runtime Tools Access
              </p>
            </div>
          </div>

          {/* Top Close Button (Always visible) */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-colors active:scale-95"
            title="बंद करें (Close)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Sassy Avani Callout */}
          <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <p className="text-xs text-pink-200 leading-relaxed font-sans">
              <strong className="text-pink-300 font-bold">अवनी:</strong> "अगर आप मुझे कॉल करने या WhatsApp मैसेज भेजने को कहेंगे, तो मुझे सिस्टम की परमिशन चाहिए होगी। अपनी अवनी को खुली छूट दीजिए!"
            </p>
          </div>

          {/* Permission Items List */}
          <div className="space-y-2.5">
            {permissionItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3.5 bg-neutral-950 hover:bg-neutral-900/90 border border-neutral-800/90 rounded-2xl transition-all"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.granted
                          ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{item.title}</span>
                        {item.required && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-neutral-200 mt-0.5">
                        {item.friendlyName}
                      </p>
                      <p className="text-[11px] text-neutral-400 leading-normal mt-0.5">{item.desc}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAction(item.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                      item.granted
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                        : "bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700"
                    }`}
                  >
                    {item.granted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Granted
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-neutral-400" />
                        Allow
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer (Fixed at bottom) */}
        <footer className="px-5 py-3.5 border-t border-neutral-900 bg-neutral-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <Info className="w-3.5 h-3.5 text-pink-400" />
            <span>Android Security Gateways</span>
          </div>

          <div className="flex items-center gap-2">
            {!allGranted && (
              <button
                type="button"
                onClick={onGrantAll}
                className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                सभी अनुमति दें (Grant All)
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white hover:text-rose-200 border border-neutral-700 hover:border-neutral-600 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>बाहर निकलें (Exit)</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
