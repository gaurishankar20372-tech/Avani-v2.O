/**
 * Audio processing utilities for PCM16 conversion, AudioContext management,
 * Adaptive Noise Floor Tracking, Voice Bandpass Filtering, Gapless chunk scheduling,
 * and Noise-Resistant Speech Interruption & Resumption.
 */

import { NoiseSuppressionMode } from "../types";

export interface AudioCaptureResult {
  success: boolean;
  reason?: "permission_denied" | "not_supported" | "not_found" | "unknown";
  error?: any;
}

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new DataView(new ArrayBuffer(input.length * 2));
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return output.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function pcm16ToBase64(input: Float32Array): string {
  const buffer = floatTo16BitPCM(input);
  return arrayBufferToBase64(buffer);
}

export function base64ToFloat32(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  const numSamples = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    float32[i] = int16 / 32768.0;
  }

  return float32;
}

export class LiveAudioManager {
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private voiceFilterNode: BiquadFilterNode | null = null;

  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private onAudioChunkCallback: ((base64Chunk: string) => void) | null = null;
  private onInterruptCallback: (() => void) | null = null;

  // Noise Floor & Voice Activity Detection (VAD)
  public noiseMode: NoiseSuppressionMode = "high_rejection";
  private noiseFloor = 0.015;
  private consecutiveVoiceFrames = 0;
  private isSpeechActive = false;
  private currentSpeechConfidence = 0;

  // Playback buffer cache for resumption if noise was a false positive
  private speechAudioChunks: string[] = [];
  private currentPlayingIndex = 0;
  private isPaused = false;
  private lastSpokenText = "";

  public isCapturing = false;

  constructor() {}

  public setNoiseMode(mode: NoiseSuppressionMode) {
    this.noiseMode = mode;
  }

  public getNoiseFloor(): number {
    return this.noiseFloor;
  }

  // Initialize Input Capture with Voice-Band Filtering & Adaptive Noise Cancellation
  public async startInputCapture(
    onChunk: (base64Chunk: string) => void,
    onUserSpeechDetected?: () => void
  ): Promise<AudioCaptureResult> {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        return {
          success: false,
          reason: "not_supported",
        };
      }

      this.onAudioChunkCallback = onChunk;
      this.inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });

      if (this.inputCtx.state === "suspended") {
        await this.inputCtx.resume();
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.inputCtx.createMediaStreamSource(this.mediaStream);

      // Voice Bandpass Filter (300Hz to 3400Hz) to reject low-end rumbles (fans, traffic)
      // and high-frequency hissing
      this.voiceFilterNode = this.inputCtx.createBiquadFilter();
      this.voiceFilterNode.type = "bandpass";
      this.voiceFilterNode.frequency.setValueAtTime(1850, this.inputCtx.currentTime);
      this.voiceFilterNode.Q.setValueAtTime(0.7, this.inputCtx.currentTime);

      this.inputAnalyser = this.inputCtx.createAnalyser();
      this.inputAnalyser.fftSize = 256;
      this.inputAnalyser.smoothingTimeConstant = 0.8;

      // 4096 buffer size gives ~256ms chunk @ 16kHz
      this.processorNode = this.inputCtx.createScriptProcessor(4096, 1, 1);

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isCapturing) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // 1. Calculate RMS energy
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);

        // 2. Adaptive Noise Floor Tracking (Moving average of quiet intervals)
        if (rms < this.noiseFloor * 1.5 || this.noiseFloor === 0) {
          // Slowly track upward or downward to adapt to room conditions
          this.noiseFloor = this.noiseFloor * 0.95 + rms * 0.05;
        } else {
          // Ambient noise floor decays very slowly upward
          this.noiseFloor = this.noiseFloor * 0.998 + 0.002 * Math.min(rms, 0.04);
        }

        // Clamp noise floor to sensible room range
        this.noiseFloor = Math.max(0.008, Math.min(0.08, this.noiseFloor));

        // 3. Dynamic Threshold based on selected Noise Suppression Mode
        let multiplier = 2.8;
        let minThreshold = 0.09;
        let requiredConsecutiveFrames = 3; // ~750ms of sustained voice energy

        if (this.noiseMode === "high_rejection") {
          multiplier = 3.4;
          minThreshold = 0.11;
          requiredConsecutiveFrames = 3;
        } else if (this.noiseMode === "balanced") {
          multiplier = 2.5;
          minThreshold = 0.07;
          requiredConsecutiveFrames = 2;
        } else if (this.noiseMode === "sensitive") {
          multiplier = 1.8;
          minThreshold = 0.04;
          requiredConsecutiveFrames = 1;
        }

        const dynamicThreshold = Math.max(minThreshold, this.noiseFloor * multiplier);
        const snr = rms / Math.max(0.001, this.noiseFloor);
        this.currentSpeechConfidence = Math.min(1.0, snr / (multiplier * 2));

        // 4. Voice Activity Persistence (Filter transient clicks, claps, mic bumps, coughs)
        if (rms > dynamicThreshold) {
          this.consecutiveVoiceFrames++;
          if (this.consecutiveVoiceFrames >= requiredConsecutiveFrames) {
            this.isSpeechActive = true;
            if (onUserSpeechDetected) {
              onUserSpeechDetected();
            }
          }
        } else {
          this.consecutiveVoiceFrames = Math.max(0, this.consecutiveVoiceFrames - 1);
          if (this.consecutiveVoiceFrames === 0) {
            this.isSpeechActive = false;
          }
        }

        // 5. Send PCM data chunk to server
        const base64 = pcm16ToBase64(channelData);
        if (this.onAudioChunkCallback) {
          this.onAudioChunkCallback(base64);
        }
      };

      source.connect(this.voiceFilterNode);
      this.voiceFilterNode.connect(this.inputAnalyser);
      this.inputAnalyser.connect(this.processorNode);
      this.processorNode.connect(this.inputCtx.destination);

      this.isCapturing = true;
      return { success: true };
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        String(err?.message || "").toLowerCase().includes("permission denied") ||
        String(err || "").toLowerCase().includes("permission denied");

      if (isPermissionDenied) {
        console.warn("Audio capture: microphone permission denied by user/browser.");
        return { success: false, reason: "permission_denied", error: err };
      }

      const isNotFound =
        err?.name === "NotFoundError" ||
        err?.name === "DevicesNotFoundError";

      if (isNotFound) {
        console.warn("Audio capture: microphone device not found.");
        return { success: false, reason: "not_found", error: err };
      }

      console.warn("Audio capture initialization error:", err?.message || err);
      return { success: false, reason: "unknown", error: err };
    }
  }

  // Stop Input Capture
  public stopInputCapture() {
    this.isCapturing = false;
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }
    if (this.voiceFilterNode) {
      this.voiceFilterNode.disconnect();
      this.voiceFilterNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.inputCtx) {
      this.inputCtx.close();
      this.inputCtx = null;
    }
  }

  // Initialize Output Playback (24kHz for Gemini Live output)
  public initOutput(): AudioContext {
    if (!this.outputCtx || this.outputCtx.state === "closed") {
      this.outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      this.outputAnalyser = this.outputCtx.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;
      this.outputAnalyser.connect(this.outputCtx.destination);
    }
    if (this.outputCtx.state === "suspended") {
      this.outputCtx.resume();
    }
    return this.outputCtx;
  }

  // Queue and play audio chunk scheduled gaplessly
  public playChunk(base64Audio: string) {
    try {
      this.speechAudioChunks.push(base64Audio);
      if (this.isPaused) return;

      const ctx = this.initOutput();
      const float32Data = base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02; // small buffer to avoid glitch
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeSources.push(source);
      const chunkIndex = this.speechAudioChunks.length - 1;

      source.onended = () => {
        this.currentPlayingIndex = Math.max(this.currentPlayingIndex, chunkIndex + 1);
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (e) {
      console.error("Error playing audio chunk:", e);
    }
  }

  // Pause playback temporarily without discarding speech buffer
  // (Used when checking if an audio disturbance is a real user query or just ambient noise)
  public pausePlayback() {
    this.isPaused = true;
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  // Resume playback from where Avani left off
  public resumePlayback() {
    if (!this.isPaused) return;
    this.isPaused = false;
    const remainingChunks = this.speechAudioChunks.slice(this.currentPlayingIndex);
    this.nextStartTime = this.outputCtx ? this.outputCtx.currentTime + 0.05 : 0;
    for (const chunk of remainingChunks) {
      this.playChunkDirect(chunk);
    }
  }

  private playChunkDirect(base64Audio: string) {
    try {
      const ctx = this.initOutput();
      const float32Data = base64ToFloat32(base64Audio);
      if (float32Data.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.outputAnalyser) {
        source.connect(this.outputAnalyser);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.02;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.activeSources.push(source);

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) {
          this.activeSources.splice(idx, 1);
        }
      };
    } catch (e) {
      console.error("Error resuming direct chunk:", e);
    }
  }

  // Completely interrupt and clear playback (e.g. when user says "रुक जाओ" / "stop")
  public interrupt() {
    this.isPaused = false;
    this.speechAudioChunks = [];
    this.currentPlayingIndex = 0;
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.outputCtx) {
      this.nextStartTime = this.outputCtx.currentTime;
    } else {
      this.nextStartTime = 0;
    }
    if (this.onInterruptCallback) {
      this.onInterruptCallback();
    }
  }

  // Has remaining chunks to finish speaking
  public hasPendingChunks(): boolean {
    return this.currentPlayingIndex < this.speechAudioChunks.length;
  }

  public setLastSpokenText(text: string) {
    this.lastSpokenText = text;
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public resetTurnBuffer() {
    this.speechAudioChunks = [];
    this.currentPlayingIndex = 0;
    this.isPaused = false;
  }

  public setOnInterrupt(cb: () => void) {
    this.onInterruptCallback = cb;
  }

  // Get live frequency spectrum & noise metrics for UI
  public getFrequencyData(): {
    input: number[];
    output: number[];
    inputVol: number;
    outputVol: number;
    noiseFloor: number;
    speechConfidence: number;
    isSpeechDetected: boolean;
  } {
    let inputArr: number[] = new Array(32).fill(0);
    let outputArr: number[] = new Array(32).fill(0);
    let inVol = 0;
    let outVol = 0;

    if (this.inputAnalyser) {
      const buffer = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.inputAnalyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        const val = buffer[i] / 255;
        inputArr[i] = val;
        sum += val;
      }
      inVol = sum / 32;
    }

    if (this.outputAnalyser && this.activeSources.length > 0) {
      const buffer = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(buffer);
      let sum = 0;
      for (let i = 0; i < 32; i++) {
        const val = buffer[i] / 255;
        outputArr[i] = val;
        sum += val;
      }
      outVol = sum / 32;
    }

    return {
      input: inputArr,
      output: outputArr,
      inputVol: inVol,
      outputVol: outVol,
      noiseFloor: this.noiseFloor,
      speechConfidence: this.currentSpeechConfidence,
      isSpeechDetected: this.isSpeechActive,
    };
  }

  public isSpeaking(): boolean {
    return this.activeSources.length > 0 || (this.isPaused && this.hasPendingChunks());
  }
}

export const liveAudio = new LiveAudioManager();
