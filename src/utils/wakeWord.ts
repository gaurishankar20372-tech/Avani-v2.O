/**
 * Lightweight local wake-word detector for "Avani".
 * Uses continuous SpeechRecognition / keyword spotter with automatic re-arm.
 */

export class WakeWordDetector {
  private recognition: any = null;
  private isListening = false;
  private onWakeCallback: ((phrase: string) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private isSupported = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          if (
            transcript.includes("avani") ||
            transcript.includes("hey avani") ||
            transcript.includes("hi avani") ||
            transcript.includes("ok avani") ||
            transcript.includes("wani") ||
            transcript.includes("abani") ||
            transcript.includes("अवनी") ||
            transcript.includes("अवनि") ||
            transcript.includes("हे अवनी") ||
            transcript.includes("नमस्ते अवनी") ||
            transcript.includes("सुनो अवनी") ||
            transcript.includes("अरे अवनी")
          ) {
            console.log("Wake word detected:", transcript);
            if (this.onWakeCallback) {
              this.onWakeCallback(transcript);
            }
          }
        }
      };

      this.recognition.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          console.warn("WakeWord recognition permission not granted:", e.error);
          this.isListening = false;
          if (this.onErrorCallback) {
            this.onErrorCallback(e.error);
          }
          return;
        }

        // Silently handle common errors (e.g. no-speech or aborted)
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("WakeWord recognition note:", e.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (err) {
            // ignore rapid restart error
          }
        }
      };
    }
  }

  public start(onWake: (phrase: string) => void, onError?: (err: string) => void) {
    this.onWakeCallback = onWake;
    this.onErrorCallback = onError || null;
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e: any) {
        if (e.name === "NotAllowedError" || e.message?.includes("denied")) {
          this.isListening = false;
          if (this.onErrorCallback) {
            this.onErrorCallback("not-allowed");
          }
        }
      }
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // already stopped
      }
    }
  }

  public checkSupport(): boolean {
    return this.isSupported;
  }
}

export const wakeWordDetector = new WakeWordDetector();
