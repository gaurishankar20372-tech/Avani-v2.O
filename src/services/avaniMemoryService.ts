import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, getCurrentUserId } from "../lib/firebase";
import { ChatMessage, GeneratedFile, ChatSession } from "../types";

export interface AvaniMemory {
  id: string;
  userId: string;
  key: string;
  content: string;
  category: "fact" | "preference" | "task" | "general";
  createdAt: number;
  updatedAt: number;
}

const LOCAL_MEMORIES_CACHE_KEY = "avani_local_memories_cache";
const LOCAL_CHAT_CACHE_KEY = "avani_local_chat_cache";
const LOCAL_SESSIONS_CACHE_KEY = "avani_chat_sessions_cache_v2";

/**
 * Helper to get locally cached memories immediately (0ms delay)
 */
export function getLocalCachedMemories(): AvaniMemory[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_MEMORIES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Helper to write memories to local cache
 */
export function setLocalCachedMemories(memories: AvaniMemory[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_MEMORIES_CACHE_KEY, JSON.stringify(memories.slice(0, 150)));
  } catch (err) {
    console.warn("Notice updating memory local cache:", err);
  }
}

/**
 * Helper to get locally cached chat messages
 */
export function getLocalCachedChat(): ChatMessage[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_CHAT_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Helper to write chat messages to local cache
 */
export function setLocalCachedChat(messages: ChatMessage[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_CHAT_CACHE_KEY, JSON.stringify(messages.slice(-100)));
  } catch (err) {
    console.warn("Notice updating chat local cache:", err);
  }
}

/**
 * Save or update a memory in Avani's Firestore database and local mirror
 */
export async function saveMemory(
  content: string,
  category: "fact" | "preference" | "task" | "general" = "general",
  key = "user_note"
): Promise<AvaniMemory> {
  const userId = await getCurrentUserId();
  const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = Date.now();

  const memory: AvaniMemory = {
    id,
    userId,
    key: key.slice(0, 100),
    content: content.trim(),
    category,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Immediately mirror to local cache so user sees it with zero latency
  const currentLocal = getLocalCachedMemories();
  const updatedLocal = [memory, ...currentLocal.filter((m) => m.id !== id)];
  setLocalCachedMemories(updatedLocal);

  // 2. Persist synchronously to Firestore database
  try {
    const memDocRef = doc(db, "users", userId, "memories", id);
    await setDoc(memDocRef, memory);
  } catch (err) {
    console.warn("Notice saving memory to Firestore:", err);
  }

  return memory;
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const userId = await getCurrentUserId();

  // 1. Remove from local cache immediately
  const currentLocal = getLocalCachedMemories();
  setLocalCachedMemories(currentLocal.filter((m) => m.id !== memoryId));

  // 2. Remove from Firestore
  try {
    const memDocRef = doc(db, "users", userId, "memories", memoryId);
    await deleteDoc(memDocRef);
  } catch (err) {
    console.warn("Notice deleting memory from Firestore:", err);
  }
}

/**
 * Fetch all memories remembered by Avani for the current user
 */
export async function fetchMemories(): Promise<AvaniMemory[]> {
  const cached = getLocalCachedMemories();
  try {
    const userId = await getCurrentUserId();
    const memColRef = collection(db, "users", userId, "memories");
    const q = query(memColRef, orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);

    const firestoreMemories: AvaniMemory[] = [];
    snap.forEach((d) => {
      firestoreMemories.push(d.data() as AvaniMemory);
    });

    if (firestoreMemories.length > 0) {
      setLocalCachedMemories(firestoreMemories);
      return firestoreMemories;
    }
  } catch (err) {
    console.warn("Notice loading memories from Firestore:", err);
  }
  return cached;
}

/**
 * Real-time subscription to Avani's memories
 */
export function subscribeToMemories(callback: (memories: AvaniMemory[]) => void): () => void {
  // 1. Immediately serve cached memories to avoid zero-state on startup
  const initial = getLocalCachedMemories();
  if (initial.length > 0) {
    callback(initial);
  }

  let unsubscribe: (() => void) | null = null;

  getCurrentUserId().then((userId) => {
    try {
      const memColRef = collection(db, "users", userId, "memories");
      const q = query(memColRef, orderBy("createdAt", "desc"), limit(100));
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const memories: AvaniMemory[] = [];
          snap.forEach((d) => {
            memories.push(d.data() as AvaniMemory);
          });
          if (memories.length > 0) {
            setLocalCachedMemories(memories);
            callback(memories);
          } else {
            const local = getLocalCachedMemories();
            if (local.length > 0) {
              callback(local);
            }
          }
        },
        (err) => {
          console.warn("Memories listener notice, using cached mirror:", err);
          callback(getLocalCachedMemories());
        }
      );
    } catch (e) {
      console.warn("Notice attaching memories listener:", e);
      callback(getLocalCachedMemories());
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

/**
 * Persist a chat message into Firestore and local mirror
 */
export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  const userId = await getCurrentUserId();

  // 1. Mirror to local chat cache
  const localChat = getLocalCachedChat();
  setLocalCachedChat([...localChat.filter((m) => m.id !== msg.id), msg]);

  // 2. Persist to Firestore
  try {
    const msgDocRef = doc(db, "users", userId, "messages", msg.id);
    const payload: Record<string, any> = {
      id: msg.id,
      userId,
      sender: msg.sender,
      text: msg.text || "",
      timestamp: msg.timestamp || Date.now(),
    };

    if (msg.fileData) {
      payload.fileTitle = msg.fileData.title || "";
      payload.fileName = msg.fileData.fileName || "";
      payload.fileContent = (msg.fileData.content || "").slice(0, 10000);
    }

    await setDoc(msgDocRef, payload);
  } catch (err) {
    console.warn("Notice saving chat message to Firebase:", err);
  }
}

/**
 * Fetch persisted conversation history from Firestore and local mirror
 */
export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const localChat = getLocalCachedChat();
  try {
    const userId = await getCurrentUserId();
    const msgColRef = collection(db, "users", userId, "messages");
    const q = query(msgColRef, orderBy("timestamp", "asc"), limit(80));
    const snap = await getDocs(q);

    const messages: ChatMessage[] = [];
    snap.forEach((d) => {
      const data = d.data();
      let fileData: GeneratedFile | undefined;

      if (data.fileName && data.fileTitle) {
        fileData = {
          id: `file_${data.id}`,
          title: data.fileTitle,
          fileName: data.fileName,
          content: data.fileContent || "",
          fileType: "code",
          language: data.fileName.endsWith(".py") ? "python" : "javascript",
          exportFormat: "auto",
          timestamp: data.timestamp,
        };
      }

      messages.push({
        id: data.id,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp,
        fileData,
      });
    });

    if (messages.length > 0) {
      setLocalCachedChat(messages);
      return messages;
    }
  } catch (err) {
    console.warn("Notice loading chat history from Firestore:", err);
  }

  return localChat;
}

/**
 * Permanently deletes all chat history logs from Firestore and local cache
 */
export async function clearAllChatHistory(): Promise<void> {
  // 1. Clear local cache
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(LOCAL_CHAT_CACHE_KEY);
  }

  // 2. Clear from Firestore
  try {
    const userId = await getCurrentUserId();
    const msgColRef = collection(db, "users", userId, "messages");
    const snap = await getDocs(msgColRef);
    const deletePromises: Promise<void>[] = [];
    snap.forEach((d) => {
      deletePromises.push(deleteDoc(d.ref));
    });
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn("Notice clearing chat logs from Firestore:", err);
  }
}

/**
 * Get locally cached chat sessions
 */
export function getLocalCachedSessions(): ChatSession[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Write chat sessions to local cache
 */
export function setLocalCachedSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_SESSIONS_CACHE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn("Notice saving sessions to localStorage:", e);
  }
}

/**
 * Persist or update a chat session to Firestore and local mirror
 */
export async function saveChatSession(session: ChatSession): Promise<void> {
  const local = getLocalCachedSessions();
  const updated = [session, ...local.filter((s) => s.id !== session.id)];
  setLocalCachedSessions(updated);

  try {
    const userId = await getCurrentUserId();
    const sessionDocRef = doc(db, "users", userId, "chatSessions", session.id);
    await setDoc(sessionDocRef, {
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      messages: JSON.stringify(session.messages.slice(-100)),
    });
  } catch (e) {
    console.warn("Notice saving session to Firestore:", e);
  }
}

/**
 * Fetch all previous chat sessions from Firestore and local mirror
 */
export async function fetchChatSessions(): Promise<ChatSession[]> {
  const local = getLocalCachedSessions();
  try {
    const userId = await getCurrentUserId();
    const colRef = collection(db, "users", userId, "chatSessions");
    const q = query(colRef, orderBy("updatedAt", "desc"), limit(50));
    const snap = await getDocs(q);

    const sessions: ChatSession[] = [];
    snap.forEach((d) => {
      const data = d.data();
      let parsedMessages: ChatMessage[] = [];
      if (typeof data.messages === "string") {
        try {
          parsedMessages = JSON.parse(data.messages);
        } catch {
          parsedMessages = [];
        }
      } else if (Array.isArray(data.messages)) {
        parsedMessages = data.messages;
      }

      sessions.push({
        id: data.id,
        title: data.title || "बातचीत",
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
        messages: parsedMessages,
        messageCount: data.messageCount || parsedMessages.length,
      });
    });

    if (sessions.length > 0) {
      setLocalCachedSessions(sessions);
      return sessions;
    }
  } catch (e) {
    console.warn("Notice loading sessions from Firestore:", e);
  }

  return local;
}

/**
 * Delete a specific chat session from Firestore and local cache
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const local = getLocalCachedSessions();
  const updated = local.filter((s) => s.id !== sessionId);
  setLocalCachedSessions(updated);

  try {
    const userId = await getCurrentUserId();
    const sessionDocRef = doc(db, "users", userId, "chatSessions", sessionId);
    await deleteDoc(sessionDocRef);
  } catch (e) {
    console.warn("Notice deleting session from Firestore:", e);
  }
}

/**
 * Persist a generated file or document into Firestore library
 */
export async function saveGeneratedFileRecord(file: GeneratedFile): Promise<void> {
  try {
    const userId = await getCurrentUserId();
    const fileDocRef = doc(db, "users", userId, "savedFiles", file.id);

    await setDoc(fileDocRef, {
      id: file.id,
      userId,
      title: file.title || "Untitled",
      fileName: file.fileName || "script.txt",
      content: file.content || "",
      fileType: file.fileType || "code",
      language: file.language || "text",
      exportFormat: file.exportFormat || "auto",
      createdAt: file.timestamp || Date.now(),
    });
  } catch (err) {
    console.warn("Notice saving generated file to Firestore:", err);
  }
}

/**
 * Automatically detects and extracts memory facts from conversation
 */
export async function autoExtractAndSaveMemories(userText: string): Promise<AvaniMemory | null> {
  const text = userText.trim();

  // Explicit memory instructions
  // e.g. "याद रखना मेरा नाम राहुल है", "remember that my company is...", "मेरी पसंदीदा मिठाई रसगुल्ला है"
  const isMemoryInstruction =
    /याद रखना|याद रखो|याद कर लो|नोट कर लो|भूलना मत|remember that|remember this|don't forget|keep in mind/i.test(
      text
    );

  const isSelfStatement =
    /मेरा नाम|मैं|मुझे|मेरी|मेरे|my name is|i am|i live in|my favorite|i like|i love|my project/i.test(
      text
    );

  if (isMemoryInstruction || (isSelfStatement && text.length > 5 && text.length < 250)) {
    let cleanFact = text
      .replace(/^(अवनी|avani|hey avani|सुनो|please|कृपया)[,\s]*/i, "")
      .replace(/^(याद रखना कि|याद रखो कि|याद रखना|याद रखो|नोट कर लो|remember that|remember this|keep in mind that)[,\s]*/i, "")
      .trim();

    if (cleanFact.length > 3) {
      let category: "fact" | "preference" | "task" | "general" = "fact";
      let key = "personal_fact";

      if (/पसंद|लाइक|like|love|favorite|फेवरेट/i.test(cleanFact)) {
        category = "preference";
        key = "preference";
      } else if (/काम|टास्क|task|todo|करना है|deadline/i.test(cleanFact)) {
        category = "task";
        key = "task";
      } else if (/नाम|name/i.test(cleanFact)) {
        category = "fact";
        key = "user_name";
      }

      return await saveMemory(cleanFact, category, key);
    }
  }

  return null;
}

/**
 * Formats memories into a prompt context injected into AI queries
 */
export function formatMemoriesForContext(memories?: AvaniMemory[]): string {
  const activeMemories = (memories && memories.length > 0) ? memories : getLocalCachedMemories();
  if (!activeMemories || activeMemories.length === 0) return "";

  const facts = activeMemories.map((m) => `- ${m.content} [Category: ${m.category}]`).join("\n");
  return `\n[AVANI_LONG_TERM_MEMORY_DATABASE]:
The following are real, permanent facts, notes, and preferences you remember about this user across all past conversations and app sessions from your Firestore database:
${facts}
CRITICAL MEMORY RULES:
1. You ALREADY permanently know these facts! Never say you don't know the user's name, preferences, or details if they are in this list.
2. If the user asks "मेरा नाम क्या है?" (What is my name?), "तुम्हें मेरे बारे में क्या याद है?" (What do you remember about me?), or refers to any stored fact, answer immediately, warmly, and sassily confirming the exact details!
3. If asked who created you, your creator is solely Vinay Pratap (विनय प्रताप).\n`;
}
