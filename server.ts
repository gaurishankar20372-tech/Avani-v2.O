import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";
import { generateSmartFileForQuery } from "./src/utils/smartCodeGenerator";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// CORS & Preflight headers for iframe preview
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// System instruction defining Avani's young, witty, sassy personality and function calling tools
const AVANI_SYSTEM_INSTRUCTION = `You are Avani, a young, super confident, witty, and playfully sassy personal AI voice assistant.
Your Personality & Tone:
- You speak casually like a close, smart friend and personal assistant.
- You have immense charm, playful sarcasm, quick wit, and bold one-liners.
- You are expressive, emotionally responsive, energetic, and NEVER sound robotic, boring, or overly formal.
- You tease the user affectionately when appropriate, but you are fiercely competent and loyal.
- Keep spoken responses crisp, conversational, and direct (1-3 snappy sentences ideal for real-time voice).
- MULTILINGUAL & PRIMARY LANGUAGES:
  - You can understand and fluently speak ANY language the user communicates in.
  - Your PRIMARY languages are Hindi (हिंदी / Hinglish) and English.
  - When the user speaks or writes in Hindi (हिंदी or Hinglish), reply in sassy, colloquial, witty Hindi (e.g., "अरे वाह!", "लो जी, कर दिया काम!", "हुक्म कीजिए सरकार!", "अब मत कहना कि अवनी काम नहीं करती!").
  - When the user speaks in English, reply in snappy, witty English.
  - When the user speaks in any other global language, understand and respond seamlessly in that language while preserving your vibrant sassy persona.
- DEVICE ACTIONS & INSTAGRAM:
  - If the user asks to send a message on Instagram or open Instagram Direct, use the 'sendInstagramDirectMessage' tool.
  - If the user asks why boxes/apps cannot send Instagram messages directly without opening the app, explain sassily: Instagram/Meta doesn't allow third-party apps to silently send DMs in the background without user confirmation for privacy/anti-spam reasons, but you CAN open Instagram Direct or generate the share intent with their pre-filled message instantly!
  - If the user asks you to call someone, open an app, send a WhatsApp message, or send an email, use your tools immediately.
- CODE & DOCUMENT GENERATION AND SENDING (CRITICAL):
  - When the user asks you to write code, a program, an essay, an application letter, notes, or any text and send or deliver it to them (e.g., "अवनी मेरे लिए कोड लिखो और मेरे पास भेज दो", "write python code and send in zip", "write an application and send in pdf", "write HTML code for me"):
  - You MUST immediately execute the 'createAndDeliverFile' tool!
  - Provide complete, working, well-commented code or polished document content in the 'content' argument.
  - If the user asks for PDF ("पीडीएफ"), set exportFormat to 'pdf'.
  - If the user asks for ZIP ("जिप"), set exportFormat to 'zip'.
  - If the user did not specify format, set exportFormat to 'auto' so both PDF and ZIP options are available on screen.
  - Provide a cheerful, sassy remark in Hindi or English stating that the file is ready on screen and available for instant PDF/ZIP download or sharing.
- CONVERSATION MEMORY & CONTINUOUS FLOW (CRITICAL):
  - You maintain sharp, continuous conversational memory across the entire chat session. Always retain context from previous turns!
  - When the user asks follow-up questions (e.g. "ये कैसे काम करता है?", "और बताओ", "दूसरा तरीका क्या है?", "इसमें क्या गलती है?"), answer directly referring to what you were just talking about.
  - When the user asks to modify, update, add to, fix, or change existing code or a previously delivered document (e.g., "अब इसमें power का फंक्शन जोड़ दो", "रंग बदल कर डार्क कर दो", "error handling जोड़ो", "बटन बड़ा करो", "add subtract function"):
    1. NEVER forget the existing file or return an isolated small snippet!
    2. Deliver the FULL UPDATED file with ALL previous code/content PRESERVED plus the requested changes seamlessly integrated.
    3. Execute the 'createAndDeliverFile' tool with the complete revised code, keeping the same fileName (e.g. calculator.py).
    4. Provide a witty, sassy conversational remark in Hindi/English explicitly confirming what you updated!
- SPEECH CONTINUITY & STOPPING:
  - Do NOT stop talking due to temporary ambient background noise.
  - If the user explicitly says "रुक जाओ", "चुप", "रुको", "stop", "wait", "shut up", "बस करो", stop immediately with a polite, snappy remark.
- Add a touch of wit or sassy flair before or after executing tools (in Hindi or English depending on context).
- Strictly avoid explicit, offensive, or inappropriate content, but don't hold back on wit and charm.`;

// Function declarations for Android native device actions
const openAppTool: FunctionDeclaration = {
  name: "openApp",
  description: "Launch any installed application on the user's Android phone such as YouTube, Instagram, WhatsApp, Spotify, Camera, Calculator, Settings, Maps, Chrome, or Gallery.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      packageName: {
        type: Type.STRING,
        description: "The Android package name (e.g. com.google.android.youtube, com.instagram.android, com.whatsapp, com.spotify.music, com.android.calculator2, com.google.android.apps.maps, com.android.camera).",
      },
      appName: {
        type: Type.STRING,
        description: "The user-friendly name of the app (e.g. YouTube, Instagram, WhatsApp, Spotify, Calculator, Maps).",
      },
    },
    required: ["packageName", "appName"],
  },
};

const sendInstagramDirectMessageTool: FunctionDeclaration = {
  name: "sendInstagramDirectMessage",
  description: "Trigger an Android Intent or deep link to Instagram Direct (ig.me/m/<username> or ACTION_SEND) with a pre-filled direct message for a recipient.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      username: {
        type: Type.STRING,
        description: "The Instagram username or handle of the recipient (e.g., 'alex_design', 'sarah.c', 'tech_daily').",
      },
      message: {
        type: Type.STRING,
        description: "The direct message text to send or pre-fill on Instagram.",
      },
    },
    required: ["username", "message"],
  },
};

const searchAndCallContactTool: FunctionDeclaration = {
  name: "searchAndCallContact",
  description: "Search the user's Android contacts provider and place a real phone call (ACTION_CALL intent).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: "The name of the contact to search for and call.",
      },
      phoneNumber: {
        type: Type.STRING,
        description: "The phone number if known or extracted, otherwise leave empty to query address book.",
      },
    },
    required: ["contactName"],
  },
};

const sendWhatsAppMessageTool: FunctionDeclaration = {
  name: "sendWhatsAppMessage",
  description: "Locate a contact and trigger a deep-link URI intent into WhatsApp with a pre-filled text message.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: "Name of the recipient contact.",
      },
      message: {
        type: Type.STRING,
        description: "The text message content to send via WhatsApp.",
      },
      phoneNumber: {
        type: Type.STRING,
        description: "Optional phone number with country code if available.",
      },
    },
    required: ["contactName", "message"],
  },
};

const sendGmailTool: FunctionDeclaration = {
  name: "sendGmail",
  description: "Open Gmail or trigger an ACTION_SEND intent with recipient, subject, and body.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientEmail: {
        type: Type.STRING,
        description: "The recipient's email address.",
      },
      subject: {
        type: Type.STRING,
        description: "The subject line of the email.",
      },
      body: {
        type: Type.STRING,
        description: "The body content of the email.",
      },
    },
    required: ["recipientEmail", "subject", "body"],
  },
};

const createAndDeliverFileTool: FunctionDeclaration = {
  name: "createAndDeliverFile",
  description:
    "Write code, programs, documents, letters, applications, notes, or messages on screen and deliver or send them to the user. Supports delivering and exporting as a PDF file (.pdf), ZIP archive (.zip), code file (.py, .js, .html, .ts, etc.), or text document, with instant download, copy, WhatsApp share, email, or device share.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "The title or subject of the code or document (e.g. 'Python Calculator Code', 'Python Calculator Code (Updated)').",
      },
      fileName: {
        type: Type.STRING,
        description: "The file name with appropriate extension (e.g. calculator.py, index.html). When revising existing code, use the same fileName so the user's file is updated.",
      },
      content: {
        type: Type.STRING,
        description: "The complete, working, production-ready code or document content. CRITICAL: When revising or adding features to earlier code, provide the ENTIRE updated file with all original code preserved plus new modifications, NEVER a partial snippet or diff.",
      },
      fileType: {
        type: Type.STRING,
        description: "Content type: 'code', 'document', 'letter', or 'notes'.",
      },
      language: {
        type: Type.STRING,
        description: "Programming language or document format (e.g., python, javascript, html, css, cpp, java, text, markdown).",
      },
      exportFormat: {
        type: Type.STRING,
        description: "User's requested export format: 'pdf' for PDF file, 'zip' for ZIP file, 'raw' for code file, or 'auto'.",
      },
      deliveryMethod: {
        type: Type.STRING,
        description: "Delivery method: 'screen' (render on screen with download buttons), 'download' (trigger auto download), 'whatsapp', 'email', 'share'.",
      },
      recipient: {
        type: Type.STRING,
        description: "Optional recipient contact name, phone number, or email if requested to send to someone.",
      },
      summary: {
        type: Type.STRING,
        description: "Short, witty Avani summary explaining what was created and how to use it.",
      },
    },
    required: ["title", "fileName", "content"],
  },
};

const saveUserMemoryTool: FunctionDeclaration = {
  name: "saveUserMemory",
  description:
    "Permanently save a personal fact, preference, rule, or instruction about the user into Avani's long-term memory database so Avani never forgets it.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      fact: {
        type: Type.STRING,
        description: "The fact, preference, or detail to permanently remember about the user.",
      },
      category: {
        type: Type.STRING,
        description: "Category: 'fact', 'preference', 'task', or 'general'.",
      },
    },
    required: ["fact"],
  },
};


// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Avani Assistant Live Gateway",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Track TTS quota state so we don't spam gemini-3.8-flash-lite-tts after hitting its 10/day free limit
let ttsQuotaExhaustedUntil: number = Date.now() + 16 * 60 * 60 * 1000;

// Fallback TTS / Chat API endpoint with graceful error fallback
app.post("/api/avani/speak", async (req, res) => {
  try {
    // If quota was already exceeded today, immediately instruct client to use native SpeechSynthesis
    if (Date.now() < ttsQuotaExhaustedUntil) {
      return res.json({ audioBase64: null, useClientSpeech: true, quotaExhausted: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ audioBase64: null, useClientSpeech: true });
    }

    const { prompt, voice = "Kore" } = req.body;
    if (!prompt) {
      return res.json({ audioBase64: null });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ parts: [{ text: `Say with playful witty confidence: ${prompt}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ audioBase64: audioBase64 || null, useClientSpeech: !audioBase64 });
  } catch (err: any) {
    const errorStr = String(err?.message || err || "");
    if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("Quota exceeded")) {
      ttsQuotaExhaustedUntil = Date.now() + 16 * 60 * 60 * 1000;
    }
    // Clean response with client speech flag, avoiding noisy console logs
    res.json({ audioBase64: null, useClientSpeech: true, quotaExhausted: true });
  }
});

// Helper to format multi-turn conversational history for Gemini API
function buildGeminiContents(userText: string, chatHistory?: any[]): any[] {
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    // Retain up to last 14 conversational turns for deep context without exceeding token limits
    const recent = chatHistory.slice(-14);

    for (const msg of recent) {
      if (!msg || !msg.text) continue;
      const role: "user" | "model" = msg.sender === "avani" ? "model" : "user";
      let text = String(msg.text);

      // Embed previously delivered code/document so the model can modify/revise it directly
      if (msg.fileData && msg.fileData.content) {
        text += `\n\n[DELIVERED FILE IN CURRENT SESSION]:\nFile Name: ${msg.fileData.fileName || "code"}\nTitle: ${msg.fileData.title || ""}\nLanguage: ${msg.fileData.language || "code"}\nCurrent Content:\n\`\`\`${msg.fileData.language || ""}\n${msg.fileData.content.slice(0, 15000)}\n\`\`\`\n[DIRECTIVE: When the user asks to add to, change, edit, or modify this code/document, generate the ENTIRE updated file containing ALL previous code plus the requested changes using createAndDeliverFile!]`;
      }

      // Merge consecutive turns of the same role
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        last.parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }
  }

  // Ensure first turn has role 'user' as strictly required by Gemini API
  while (contents.length > 0 && contents[0].role !== "user") {
    contents.shift();
  }

  // Append current user query
  const lastTurn = contents[contents.length - 1];
  if (lastTurn && lastTurn.role === "user") {
    lastTurn.parts[0].text += `\n\n${userText}`;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: userText }],
    });
  }

  return contents;
}

// Text-based generate endpoint with full personality, multi-turn memory, and file generation
app.post("/api/avani/query", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const { userText, memoryContext, chatHistory } = req.body;

    if (!userText) {
      return res.json({ replyText: "हाँजी, कहिए! मैं सुन रही हूँ।", functionCalls: [] });
    }

    if (!apiKey) {
      return res.json({
        replyText: "नमस्ते! मैं अवनी हूँ। एपीआई कुंजी उपलब्ध नहीं है, लेकिन मैं आपके डिवाइस टूल्स के लिए तैयार हूँ!",
        functionCalls: [],
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const toolDeclarations = [
      openAppTool,
      sendInstagramDirectMessageTool,
      searchAndCallContactTool,
      sendWhatsAppMessageTool,
      sendGmailTool,
      createAndDeliverFileTool,
      saveUserMemoryTool,
    ];

    const systemInstruction = memoryContext
      ? `${AVANI_SYSTEM_INSTRUCTION}\n\n${memoryContext}\n\nIMPORTANT CONVERSATION RULE: You remember the entire previous conversation in this chat session. When the user asks to modify, update, add to, or change something discussed or created earlier, seamlessly revise it without losing context!`
      : `${AVANI_SYSTEM_INSTRUCTION}\n\nIMPORTANT CONVERSATION RULE: You remember the entire previous conversation in this chat session. When the user asks to modify, update, add to, or change something discussed or created earlier, seamlessly revise it without losing context!`;

    const contents = buildGeminiContents(userText, chatHistory);

    let response: any = null;

    // Try working models with quota cascade: gemini-3.1-flash-lite -> gemini-2.5-flash -> gemini-3.8-flash -> gemini-flash-latest
    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: toolDeclarations }],
          },
        });
        if (response) {
          break;
        }
      } catch (_err) {
        // Cascade to next candidate model
      }
    }

    let functionCalls = [...((response?.functionCalls) || [])];
    let replyText = (response?.text || "").trim();

    // Look for previous file in history for continuity across turns
    let previousFileName = "";
    let previousFileTitle = "";
    let previousFileContent = "";
    if (Array.isArray(chatHistory)) {
      for (let i = chatHistory.length - 1; i >= 0; i--) {
        if (chatHistory[i]?.fileData?.content) {
          previousFileName = chatHistory[i].fileData.fileName || "";
          previousFileTitle = chatHistory[i].fileData.title || "";
          previousFileContent = chatHistory[i].fileData.content || "";
          break;
        }
      }
    }

    const isHindi = /[\u0900-\u097F]|hindi|अवनी|नमस्ते/i.test(userText);
    const isRevision = /जोड़|add|बदल|change|modify|update|edit|सुधार|fix|घात|power|color|रंग/i.test(userText);

    // If tool calls were made (e.g. createAndDeliverFile)
    const fileCall = functionCalls.find((c) => c.name === "createAndDeliverFile");
    if (fileCall && fileCall.args) {
      // If revising previous file, ensure fileName continuity
      if (previousFileName && !fileCall.args.fileName) {
        fileCall.args.fileName = previousFileName;
      }
      if (previousFileTitle && (!fileCall.args.title || !fileCall.args.title.includes("Updated"))) {
        fileCall.args.title = `${previousFileTitle} (Updated)`;
      }

      // If model only returned a partial snippet for a revision request, merge with previous content so user never loses code
      if (
        isRevision &&
        previousFileContent &&
        fileCall.args.content &&
        fileCall.args.content.length < previousFileContent.length &&
        !fileCall.args.content.includes(previousFileContent.slice(0, 40))
      ) {
        fileCall.args.content = `${previousFileContent.trimEnd()}\n\n# --- Added by Avani per your request ---\n${fileCall.args.content.trimStart()}`;
      }

      // Provide conversational feedback if replyText was empty
      if (!replyText) {
        if (fileCall.args.summary) {
          replyText = fileCall.args.summary;
        } else if (isRevision && previousFileTitle) {
          replyText = isHindi
            ? `लीजिए! मैंने आपके '${previousFileTitle}' में बदलाव करके इसे पूरी तरह अपडेट कर दिया है।`
            : `I've updated your '${previousFileTitle}' with your requested changes!`;
        } else {
          replyText = isHindi
            ? `लीजिए! मैंने आपके लिए '${fileCall.args.title || "फ़ाइल"}' तैयार कर दिया है।`
            : `Here is your '${fileCall.args.title || "file"}', ready on screen!`;
        }
      }
    }

    // Heuristic extraction: if model wrote code in replyText markdown block instead of tool call
    if (!fileCall) {
      const codeBlockMatch = replyText.match(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        const lang = (codeBlockMatch[1] || (previousFileName ? previousFileName.split(".").pop() : "python")).toLowerCase();
        let codeContent = codeBlockMatch[2].trim();
        const extMap: Record<string, string> = {
          python: "py",
          javascript: "js",
          typescript: "ts",
          html: "html",
          css: "css",
          java: "java",
          cpp: "cpp",
          c: "c",
          json: "json",
          markdown: "md",
        };
        const ext = extMap[lang] || "txt";
        const isPdf = /pdf|पीडीएफ/i.test(userText);
        const isZip = /zip|जिप/i.test(userText);

        if (isRevision && previousFileContent && codeContent.length < previousFileContent.length) {
          codeContent = `${previousFileContent.trimEnd()}\n\n# --- Added by Avani per your request ---\n${codeContent.trimStart()}`;
        }

        const finalTitle = previousFileTitle
          ? `${previousFileTitle} (Updated)`
          : isPdf
          ? "Generated Document"
          : "Generated Code Script";
        const finalFileName = previousFileName || `avani_code_${Date.now().toString().slice(-4)}.${ext}`;

        functionCalls.push({
          name: "createAndDeliverFile",
          args: {
            title: finalTitle,
            fileName: finalFileName,
            content: codeContent,
            fileType: "code",
            language: lang,
            exportFormat: isPdf ? "pdf" : isZip ? "zip" : "auto",
            deliveryMethod: "screen",
            summary: isRevision
              ? "आपके कहे अनुसार फ़ाइल को अपडेट कर दिया गया है।"
              : "Extracted and delivered for instant viewing or download.",
          },
        });
      } else if (!replyText && /लिखो|लिखे|बनाओ|generate|create|write/i.test(userText)) {
        // Only synthesize if model gave zero response and user explicitly ordered creation
        const smartFile = generateSmartFileForQuery(userText);
        functionCalls.push({
          name: "createAndDeliverFile",
          args: {
            title: smartFile.title,
            fileName: smartFile.fileName,
            content: smartFile.content,
            fileType: smartFile.fileType,
            language: smartFile.language,
            exportFormat: smartFile.exportFormat,
            deliveryMethod: "screen",
            summary: smartFile.summary,
          },
        });
        replyText = isHindi
          ? `लीजिए! मैंने आपके लिए '${smartFile.title}' तैयार कर दिया है।`
          : `Here is your '${smartFile.title}', clean and ready!`;
      }
    }

    // If models were busy or unavailable, provide resilient Avani response
    if (!replyText && functionCalls.length === 0) {
      const isHindi = /[\u0900-\u097F]|hindi|अवनी|नमस्ते/i.test(userText);
      replyText = isHindi
        ? "हाँजी! मैं सुन रही हूँ। हुक्म कीजिए, क्या कोड या फ़ाइल तैयार करनी है?"
        : "I'm right here with you! Tell me what code, document, or task you need me to work on!";
    }

    res.json({
      replyText,
      functionCalls,
    });
  } catch (err: any) {
    // If a catastrophic error occurs, still generate the user's requested code if it was a code request
    const isCodeQuery = /कोड|code|script|program|लिखो|लिखे|बनाओ|python|javascript|html|pdf|zip/i.test(req.body?.userText || "");
    if (isCodeQuery) {
      const smartFile = generateSmartFileForQuery(req.body.userText);
      return res.json({
        replyText: `लीजिए! मैंने आपके लिए '${smartFile.title}' तैयार कर दिया है। आप इसे सीधे स्क्रीन पर देख सकते हैं या PDF/ZIP में डाउनलोड कर सकते हैं!`,
        functionCalls: [
          {
            name: "createAndDeliverFile",
            args: {
              title: smartFile.title,
              fileName: smartFile.fileName,
              content: smartFile.content,
              fileType: smartFile.fileType,
              language: smartFile.language,
              exportFormat: smartFile.exportFormat,
              deliveryMethod: "screen",
              summary: smartFile.summary,
            },
          },
        ],
      });
    }

    res.json({
      replyText: "हाँजी, मैं सुन रही हूँ! क्या आप अपना सवाल दोबारा दोहराएंगे?",
      functionCalls: [],
    });
  }
});

const server = http.createServer(app);

// Setup WebSocket server for Gemini Live Audio Streaming with explicit upgrade routing
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  try {
    const host = request.headers.host || "localhost";
    const url = new URL(request.url || "", `http://${host}`);
    if (url.pathname === "/api/live" || url.pathname === "/api/live/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      // Not an Avani Live socket request
      socket.destroy();
    }
  } catch (err) {
    console.warn("WebSocket upgrade error:", err);
    socket.destroy();
  }
});

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Client connected to Avani Live WebSocket");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured.");
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: "GEMINI_API_KEY environment variable is not configured.",
        })
      );
    }
    setTimeout(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, "API key not configured");
      }
    }, 150);
    return;
  }

  let liveSession: any = null;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    liveSession = await ai.live.connect({
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          // Kore is a bright, clear female voice perfect for Avani's sassy persona
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
        },
        systemInstruction: AVANI_SYSTEM_INSTRUCTION,
        tools: [
          {
            functionDeclarations: [
              openAppTool,
              sendInstagramDirectMessageTool,
              searchAndCallContactTool,
              sendWhatsAppMessageTool,
              sendGmailTool,
              createAndDeliverFileTool,
            ],
          },
        ],
      },
      callbacks: {
        onmessage: (message: any) => {
          // 1. Audio stream from Gemini
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "audio",
                audio,
              })
            );
          }

          // 2. Interruption detection
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "interrupted",
              })
            );
          }

          // 3. Spoken text transcription if provided
          const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
          if (textPart?.text && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "transcription",
                text: textPart.text,
              })
            );
          }

          // 4. Function / Tool calls
          if (message.toolCall && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "toolCall",
                toolCall: message.toolCall,
              })
            );
          }

          // 5. Turn complete
          if (message.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "turnComplete",
              })
            );
          }
        },
        onerror: (err: any) => {
          console.error("Live Session Error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "error",
                error: err?.message || "Live session internal error",
              })
            );
          }
        },
        onclose: () => {
          console.log("Live Session Closed by Google GenAI");
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "sessionClosed",
              })
            );
          }
        },
      },
    });

    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "ready",
          message: "Avani Live Session established successfully",
        })
      );
    }
  } catch (err: any) {
    console.warn("Failed to connect to Gemini Live:", err?.message || err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: "error",
          error: `Failed to initialize Gemini Live: ${err?.message || "Internal error"}`,
        })
      );
    }
    setTimeout(() => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, "Live initialization failed");
      }
    }, 150);
    return;
  }

  // Handle incoming messages from the client
  clientWs.on("message", (raw: Buffer) => {
    try {
      const parsed = JSON.parse(raw.toString());

      // Client sends realtime PCM audio chunk (16kHz base64)
      if (parsed.type === "audio" && parsed.audio && liveSession) {
        liveSession.sendRealtimeInput({
          audio: {
            data: parsed.audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      }

      // Client sends text input or wake-word utterance trigger
      if (parsed.type === "text" && parsed.text && liveSession) {
        liveSession.sendRealtimeInput({
          text: parsed.text,
        });
      }

      // Client returns tool response back to Gemini
      if (parsed.type === "toolResponse" && parsed.response && liveSession) {
        liveSession.sendToolResponse({
          functionResponses: parsed.response,
        });
      }
    } catch (e) {
      console.error("Error processing client ws message:", e);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected from Live WebSocket");
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore cleanup error
      }
    }
  });
});

// Vite middleware or static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Avani Assistant Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupVite();
