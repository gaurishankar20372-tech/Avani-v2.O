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
import { ChatMessage, GeneratedFile } from "../types";

export interface AvaniMemory {
  id: string;
  userId: string;
  key: string;
  content: string;
  category: "fact" | "preference" | "task" | "general";
  createdAt: number;
  updatedAt: number;
}

/**
 * Save or update a memory in Avani's Firestore database
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

  const memDocRef = doc(db, "users", userId, "memories", id);
  await setDoc(memDocRef, memory);
  return memory;
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(memoryId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const memDocRef = doc(db, "users", userId, "memories", memoryId);
  await deleteDoc(memDocRef);
}

/**
 * Fetch all memories remembered by Avani for the current user
 */
export async function fetchMemories(): Promise<AvaniMemory[]> {
  try {
    const userId = await getCurrentUserId();
    const memColRef = collection(db, "users", userId, "memories");
    const q = query(memColRef, orderBy("createdAt", "desc"), limit(100));
    const snap = await getDocs(q);

    const memories: AvaniMemory[] = [];
    snap.forEach((d) => {
      memories.push(d.data() as AvaniMemory);
    });
    return memories;
  } catch (err) {
    console.warn("Notice loading memories:", err);
    return [];
  }
}

/**
 * Real-time subscription to Avani's memories
 */
export function subscribeToMemories(callback: (memories: AvaniMemory[]) => void): () => void {
  let unsubscribe: (() => void) | null = null;

  getCurrentUserId().then((userId) => {
    const memColRef = collection(db, "users", userId, "memories");
    const q = query(memColRef, orderBy("createdAt", "desc"), limit(100));
    unsubscribe = onSnapshot(
      q,
      (snap) => {
        const memories: AvaniMemory[] = [];
        snap.forEach((d) => {
          memories.push(d.data() as AvaniMemory);
        });
        callback(memories);
      },
      (err) => {
        console.warn("Memories listener notice:", err);
      }
    );
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

/**
 * Persist a chat message into Firestore
 */
export async function saveChatMessage(msg: ChatMessage): Promise<void> {
  try {
    const userId = await getCurrentUserId();
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
 * Fetch persisted conversation history from Firestore
 */
export async function fetchChatHistory(): Promise<ChatMessage[]> {
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

    return messages;
  } catch (err) {
    console.warn("Notice loading chat history:", err);
    return [];
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
export function formatMemoriesForContext(memories: AvaniMemory[]): string {
  if (!memories || memories.length === 0) return "";

  const facts = memories.map((m) => `- ${m.content} [Category: ${m.category}]`).join("\n");
  return `\n[AVANI_LONG_TERM_MEMORY_DATABASE]:
The following are real facts, notes, and preferences you permanently remember about this user from past interactions:
${facts}
Instructions: Use these memories naturally when responding. When relevant, acknowledge that you remember these details affectionately with your trademark charm and sassy wit!\n`;
}
