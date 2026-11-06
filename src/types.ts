export type AssistantState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "EXECUTING_TOOL"
  | "ERROR";

export type LanguageMode = "auto" | "en" | "hi";

export interface PermissionsState {
  recordAudio: boolean;
  readContacts: boolean;
  callPhone: boolean;
  postNotifications: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  relationship?: string;
}

export interface InstalledApp {
  packageName: string;
  name: string;
  iconName: string;
  category: "Social" | "Productivity" | "Media" | "Utilities" | "System";
  launchUrl?: string;
  deepLinkScheme?: string;
}

export interface GeneratedFile {
  id: string;
  title: string;
  fileName: string;
  content: string;
  fileType: "code" | "document" | "notes" | "letter" | "text";
  language: string;
  exportFormat?: "pdf" | "zip" | "raw" | "auto";
  deliveryMethod?: "screen" | "download" | "whatsapp" | "email" | "share";
  recipient?: string;
  summary?: string;
  timestamp: number;
}

export type NoiseSuppressionMode = "high_rejection" | "balanced" | "sensitive";

export interface ToolCallEvent {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: "executing" | "success" | "permission_denied" | "failed";
  resultMessage?: string;
  sassyRemark?: string;
  intentAction?: string;
  intentUri?: string;
  fileData?: GeneratedFile;
}

export interface LiveTranscriptItem {
  id: string;
  sender: "user" | "avani" | "system";
  text: string;
  timestamp: number;
  isSassy?: boolean;
}

export interface AudioTelemetry {
  inputVolume: number;
  outputVolume: number;
  frequencyData: number[];
  isInterrupted: boolean;
  noiseFloor?: number;
  isSpeechDetected?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "avani";
  text: string;
  timestamp: number;
  fileData?: GeneratedFile;
  intentAction?: string;
  sassyRemark?: string;
  audioBase64?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  messageCount?: number;
}

