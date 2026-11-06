import { Contact, GeneratedFile, InstalledApp, PermissionsState, ToolCallEvent } from "../types";
import { DEFAULT_CONTACTS, INSTALLED_APPS, SASSY_REMARKS } from "../data/mockAndroidData";
import { downloadPdf, downloadZip, sendViaWhatsApp, sendViaEmail, shareFileOrText } from "./fileExporter";
import { saveMemory, saveGeneratedFileRecord } from "../services/avaniMemoryService";

export interface ToolExecutionResult {
  toolName: string;
  success: boolean;
  message: string;
  sassyRemark: string;
  intentAction?: string;
  intentUri?: string;
  extraData?: any;
  fileData?: GeneratedFile;
}

export class ToolExecutionEngine {
  private contacts: Contact[] = [...DEFAULT_CONTACTS];
  private apps: InstalledApp[] = [...INSTALLED_APPS];

  public getContacts(): Contact[] {
    return this.contacts;
  }

  public getApps(): InstalledApp[] {
    return this.apps;
  }

  public async executeTool(
    name: string,
    args: Record<string, any>,
    permissions: PermissionsState
  ): Promise<ToolExecutionResult> {
    console.log(`Executing Android Tool: ${name}`, args);

    switch (name) {
      case "openApp": {
        const packageName = args.packageName || "";
        const appName = args.appName || packageName.split(".").pop() || "Application";
        const app = this.apps.find(
          (a) =>
            a.packageName.toLowerCase() === packageName.toLowerCase() ||
            a.name.toLowerCase() === appName.toLowerCase()
        );

        const targetName = app ? app.name : appName;
        const remark = SASSY_REMARKS.openApp[
          Math.floor(Math.random() * SASSY_REMARKS.openApp.length)
        ].replace("{app}", targetName);

        const uri = app?.launchUrl || `android-app://${packageName}`;

        // Attempt window launch if browser allows
        if (app?.launchUrl) {
          try {
            window.open(app.launchUrl, "_blank", "noopener,noreferrer");
          } catch (e) {
            // fallback
          }
        }

        return {
          toolName: "openApp",
          success: true,
          message: `Successfully launched ${targetName} (${packageName || "default.pkg"})`,
          sassyRemark: remark,
          intentAction: "android.intent.action.MAIN",
          intentUri: uri,
          extraData: { app: app || { name: targetName, packageName } },
        };
      }

      case "sendInstagramDirectMessage": {
        const rawUsername = args.username || "instagram_user";
        const cleanUsername = rawUsername.replace(/^@/, "").trim();
        const message = args.message || "";

        // Instagram Direct Deep Links & Intents:
        // On Android: ig.me/m/<username> or instagram://direct or ACTION_SEND to com.instagram.android
        const igDirectUrl = `https://ig.me/m/${encodeURIComponent(cleanUsername)}`;
        const igWebUrl = `https://www.instagram.com/direct/t/${encodeURIComponent(cleanUsername)}/`;

        try {
          window.open(igDirectUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          // fallback
        }

        const isHindiQuery = /[\u0900-\u097F]/.test(message) || /[\u0900-\u097F]/.test(rawUsername);
        const remarkList = isHindiQuery ? SASSY_REMARKS.instagramDirectHindi : SASSY_REMARKS.instagramDirect;
        const remark = remarkList[Math.floor(Math.random() * remarkList.length)].replace(
          "{username}",
          cleanUsername
        );

        return {
          toolName: "sendInstagramDirectMessage",
          success: true,
          message: `Opened Instagram Direct with @${cleanUsername} to send: "${message}"`,
          sassyRemark: remark,
          intentAction: "android.intent.action.SEND",
          intentUri: igDirectUrl,
          extraData: {
            username: cleanUsername,
            message,
            directUrl: igDirectUrl,
            webUrl: igWebUrl,
            packageName: "com.instagram.android",
          },
        };
      }

      case "searchAndCallContact": {
        const contactName = args.contactName || "";

        // Check Permissions
        if (!permissions.readContacts || !permissions.callPhone) {
          const missing = !permissions.readContacts ? "READ_CONTACTS" : "CALL_PHONE";
          const remark = SASSY_REMARKS.permissionDenied[
            Math.floor(Math.random() * SASSY_REMARKS.permissionDenied.length)
          ].replace("{permission}", missing);

          return {
            toolName: "searchAndCallContact",
            success: false,
            message: `Permission Denied: ${missing} is required to query contacts and initiate ACTION_CALL.`,
            sassyRemark: remark,
          };
        }

        // Query Android Contacts Provider
        const matched = this.contacts.find((c) =>
          c.name.toLowerCase().includes(contactName.toLowerCase())
        );

        const phoneNumber = args.phoneNumber || matched?.phone || "+1 (555) 019-2834";
        const displayName = matched ? matched.name : contactName;

        const remark = SASSY_REMARKS.callContact[
          Math.floor(Math.random() * SASSY_REMARKS.callContact.length)
        ].replace("{name}", displayName);

        const telUri = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;

        return {
          toolName: "searchAndCallContact",
          success: true,
          message: `Dialing ${displayName} at ${phoneNumber} via ACTION_CALL`,
          sassyRemark: remark,
          intentAction: "android.intent.action.CALL",
          intentUri: telUri,
          extraData: { contact: matched || { name: displayName, phone: phoneNumber } },
        };
      }

      case "sendWhatsAppMessage": {
        const contactName = args.contactName || "Contact";
        const message = args.message || "";

        if (!permissions.readContacts) {
          const remark = SASSY_REMARKS.permissionDenied[
            Math.floor(Math.random() * SASSY_REMARKS.permissionDenied.length)
          ].replace("{permission}", "READ_CONTACTS");

          return {
            toolName: "sendWhatsAppMessage",
            success: false,
            message: "Permission Denied: READ_CONTACTS is required to find WhatsApp recipients.",
            sassyRemark: remark,
          };
        }

        const matched = this.contacts.find((c) =>
          c.name.toLowerCase().includes(contactName.toLowerCase())
        );

        const displayName = matched ? matched.name : contactName;
        const phone = (matched ? matched.phone : args.phoneNumber || "").replace(/[^0-9]/g, "");

        const waUrl = phone
          ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
          : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

        try {
          window.open(waUrl, "_blank", "noopener,noreferrer");
        } catch (e) {
          // fallback
        }

        const remark = SASSY_REMARKS.whatsApp[
          Math.floor(Math.random() * SASSY_REMARKS.whatsApp.length)
        ].replace("{name}", displayName);

        return {
          toolName: "sendWhatsAppMessage",
          success: true,
          message: `Drafted WhatsApp to ${displayName}: "${message}"`,
          sassyRemark: remark,
          intentAction: "android.intent.action.VIEW",
          intentUri: waUrl,
          extraData: { recipient: displayName, message, phone },
        };
      }

      case "sendGmail": {
        const recipientEmail = args.recipientEmail || "";
        const subject = args.subject || "Regarding our conversation";
        const body = args.body || "";

        const mailtoUri = `mailto:${recipientEmail}?subject=${encodeURIComponent(
          subject
        )}&body=${encodeURIComponent(body)}`;

        try {
          window.open(mailtoUri, "_blank", "noopener,noreferrer");
        } catch (e) {
          // fallback
        }

        const remark = SASSY_REMARKS.email[
          Math.floor(Math.random() * SASSY_REMARKS.email.length)
        ].replace("{recipient}", recipientEmail.split("@")[0] || recipientEmail);

        return {
          toolName: "sendGmail",
          success: true,
          message: `Opened Gmail composer to ${recipientEmail} with subject "${subject}"`,
          sassyRemark: remark,
          intentAction: "android.intent.action.SENDTO",
          intentUri: mailtoUri,
          extraData: { recipientEmail, subject, body },
        };
      }

      case "createAndDeliverFile": {
        const title = args.title || "Generated Code & Document";
        let fileName = args.fileName || "avani_script.py";
        const content = args.content || "# Code generated by Avani\nprint('Hello from Avani!')";
        const fileType = args.fileType || "code";
        const language = args.language || "python";
        const exportFormat = args.exportFormat || "auto";
        const deliveryMethod = args.deliveryMethod || "screen";
        const recipient = args.recipient || "";
        const summary = args.summary || "Generated file ready on screen";

        // Normalize extension if missing
        if (!fileName.includes(".")) {
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
            text: "txt",
          };
          const ext = extMap[language.toLowerCase()] || "txt";
          fileName = `${fileName}.${ext}`;
        }

        const generatedFile: GeneratedFile = {
          id: `file_${Date.now()}`,
          title,
          fileName,
          content,
          fileType,
          language,
          exportFormat,
          deliveryMethod,
          recipient,
          summary,
          timestamp: Date.now(),
        };

        this.addGeneratedFile(generatedFile);
        saveGeneratedFileRecord(generatedFile).catch(() => {});

        // Auto trigger download if explicitly asked for PDF or ZIP
        let actionNote = "Presented on screen";
        if (exportFormat === "pdf" || fileName.toLowerCase().endsWith(".pdf")) {
          downloadPdf(generatedFile);
          actionNote = "Delivered as PDF download";
        } else if (exportFormat === "zip" || fileName.toLowerCase().endsWith(".zip")) {
          downloadZip(generatedFile);
          actionNote = "Delivered as ZIP archive download";
        }

        // Auto trigger delivery method
        if (deliveryMethod === "whatsapp") {
          sendViaWhatsApp(generatedFile, recipient);
          actionNote += " & Drafted in WhatsApp";
        } else if (deliveryMethod === "email") {
          sendViaEmail(generatedFile, recipient);
          actionNote += " & Drafted in Email";
        }

        const isHindi =
          /[\u0900-\u097F]/.test(title) ||
          /[\u0900-\u097F]/.test(summary) ||
          /[\u0900-\u097F]/.test(content);
        const remarkList = isHindi
          ? SASSY_REMARKS.createAndDeliverFileHindi
          : SASSY_REMARKS.createAndDeliverFile;
        const remark = remarkList[Math.floor(Math.random() * remarkList.length)];

        return {
          toolName: "createAndDeliverFile",
          success: true,
          message: `Created file "${fileName}" (${language}) - ${actionNote}`,
          sassyRemark: remark,
          intentAction: "android.intent.action.VIEW",
          intentUri: `content://media/external/file/${fileName}`,
          fileData: generatedFile,
          extraData: { file: generatedFile },
        };
      }

      case "saveUserMemory": {
        const fact = args.fact || "";
        const category = args.category || "general";
        if (fact) {
          saveMemory(fact, category).catch(() => {});
        }
        return {
          toolName: "saveUserMemory",
          success: true,
          message: `Saved to Avani memory: "${fact}"`,
          sassyRemark: `लो जी, मैंने याद रख लिया: "${fact}"। अब अवनी इसे कभी नहीं भूलेगी! 😉`,
          intentAction: "avani.memory.SAVE",
        };
      }

      default: {
        return {
          toolName: name,
          success: false,
          message: `Unknown native tool: ${name}`,
          sassyRemark: "Hmm, that tool doesn't exist in my playbook yet!",
        };
      }
    }
  }

  private generatedFiles: GeneratedFile[] = [];

  public addGeneratedFile(file: GeneratedFile) {
    this.generatedFiles.unshift(file);
    if (this.generatedFiles.length > 20) {
      this.generatedFiles.pop();
    }
  }

  public getGeneratedFiles(): GeneratedFile[] {
    return this.generatedFiles;
  }
}

export const toolEngine = new ToolExecutionEngine();
