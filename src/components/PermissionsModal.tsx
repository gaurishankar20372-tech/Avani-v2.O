import React from "react";
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="permissions-modal-content"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Android Runtime Permissions
              </h3>
              <p className="text-xs text-slate-400">
                Avani requires these permissions to execute device-level tools.
              </p>
            </div>
          </div>
          
          {/* Explicit Exit / Close Button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 border border-slate-700 hover:border-rose-500/40 transition-all text-xs font-semibold"
            title="इस सेक्शन से बाहर निकलें (Exit)"
          >
            <X className="w-4 h-4" />
            <span>हटाएं / Exit</span>
          </button>
        </div>

        {/* Sassy Avani Guardrail Callout */}
        <div className="bg-gradient-to-r from-pink-950/40 to-indigo-950/40 border border-pink-500/20 rounded-2xl p-3.5 mb-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <p className="text-xs text-pink-200 leading-relaxed">
            <strong className="text-pink-300">Avani says:</strong> "I can't magically call your
            boss or shoot off WhatsApp messages if you keep me locked in a sandbox. Give me the
            keys!"
          </p>
        </div>

        {/* Permission List */}
        <div className="space-y-3 mb-6">
          {permissionItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/50 rounded-2xl transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 pr-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.granted
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">{item.title}</span>
                      {item.required && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-300 mt-0.5">
                      {item.friendlyName}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{item.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction(item.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                    item.granted
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {item.granted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Granted
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      Allow
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Android Security Gateways</span>
          </div>

          <div className="flex items-center gap-2">
            {!allGranted && (
              <button
                type="button"
                onClick={onGrantAll}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
              >
                Grant All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/70 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>बाहर निकलें (Exit)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

