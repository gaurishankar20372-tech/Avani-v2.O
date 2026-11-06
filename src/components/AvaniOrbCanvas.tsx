import React, { useEffect, useRef } from "react";
import { AssistantState } from "../types";
import { liveAudio } from "../utils/audio";

interface AvaniOrbCanvasProps {
  state: AssistantState;
  onClick: () => void;
  size?: number;
}

export const AvaniOrbCanvas: React.FC<AvaniOrbCanvasProps> = ({
  state,
  onClick,
  size = 320,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedVolRef = useRef<number>(0);
  const smoothedFreqRef = useRef<number[]>(new Array(32).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      phaseRef.current += 0.035;
      const t = phaseRef.current;

      const { input, output, inputVol, outputVol } = liveAudio.getFrequencyData();

      // Smooth volume
      const targetVol =
        state === "LISTENING"
          ? Math.max(inputVol * 2.5, 0.08)
          : state === "SPEAKING"
          ? Math.max(outputVol * 2.2, 0.12)
          : state === "THINKING"
          ? 0.4
          : 0.05;

      smoothedVolRef.current += (targetVol - smoothedVolRef.current) * 0.15;
      const vol = smoothedVolRef.current;

      // Smooth frequencies
      const activeFreq = state === "SPEAKING" ? output : input;
      for (let i = 0; i < 32; i++) {
        const targetVal = activeFreq[i] || 0;
        smoothedFreqRef.current[i] += (targetVal - smoothedFreqRef.current[i]) * 0.2;
      }

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const baseRadius = size * 0.26;

      // Outer ambient aura
      const auraGradient = ctx.createRadialGradient(
        cx,
        cy,
        baseRadius * 0.2,
        cx,
        cy,
        baseRadius * (1.8 + vol * 0.8)
      );

      if (state === "SPEAKING") {
        auraGradient.addColorStop(0, "rgba(236, 72, 153, 0.45)"); // Hot pink
        auraGradient.addColorStop(0.5, "rgba(147, 51, 234, 0.25)"); // Purple
        auraGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else if (state === "LISTENING") {
        auraGradient.addColorStop(0, "rgba(6, 182, 212, 0.5)"); // Cyan
        auraGradient.addColorStop(0.5, "rgba(59, 130, 246, 0.25)"); // Electric Blue
        auraGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else if (state === "THINKING" || state === "EXECUTING_TOOL") {
        auraGradient.addColorStop(0, "rgba(245, 158, 11, 0.45)"); // Amber
        auraGradient.addColorStop(0.5, "rgba(236, 72, 153, 0.3)"); // Magenta
        auraGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      } else {
        // Idle
        const breathe = (Math.sin(t * 0.8) + 1) * 0.5;
        auraGradient.addColorStop(0, `rgba(168, 85, 247, ${0.25 + breathe * 0.15})`);
        auraGradient.addColorStop(0.6, `rgba(59, 130, 246, ${0.1 + breathe * 0.08})`);
        auraGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      }

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
      ctx.fill();

      // State specific dynamic waveform & geometry
      if (state === "SPEAKING") {
        // Multi-frequency undulating audio wave ribbons
        ctx.save();
        ctx.lineWidth = 2.5;

        // Wave ribbon 1 (Pink)
        ctx.strokeStyle = "rgba(244, 114, 182, 0.85)";
        ctx.beginPath();
        const points = 64;
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freqIndex = Math.floor(Math.abs(Math.sin(angle * 2)) * 16);
          const f = smoothedFreqRef.current[freqIndex] || 0;
          const wave = Math.sin(angle * 6 + t * 4) * (18 * vol) + f * 35;
          const r = baseRadius + wave;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Wave ribbon 2 (Cyan/Violet)
        ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
        ctx.beginPath();
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2;
          const freqIndex = Math.floor(Math.abs(Math.cos(angle * 2)) * 16);
          const f = smoothedFreqRef.current[freqIndex] || 0;
          const wave = Math.cos(angle * 8 - t * 3.5) * (15 * vol) + f * 28;
          const r = baseRadius * 1.15 + wave;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else if (state === "LISTENING") {
        // Active listening ripple lines responding to mic
        ctx.save();
        const numBars = 36;
        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * Math.PI * 2;
          const f = smoothedFreqRef.current[i % 16] || 0;
          const barLen = 10 + f * 45 + vol * 30;
          const r1 = baseRadius * 0.95;
          const r2 = r1 + barLen;

          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;

          ctx.strokeStyle = `rgba(34, 211, 238, ${0.4 + f * 0.6})`;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (state === "THINKING" || state === "EXECUTING_TOOL") {
        // Orbiting neon rings and particles
        ctx.save();
        const ringRadius = baseRadius * 1.25;

        // Rotating arc 1
        ctx.strokeStyle = "rgba(244, 63, 94, 0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, t * 3, t * 3 + Math.PI * 1.2);
        ctx.stroke();

        // Rotating arc 2 (Opposite)
        ctx.strokeStyle = "rgba(234, 179, 8, 0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius * 1.1, -t * 2.5, -t * 2.5 + Math.PI * 0.9);
        ctx.stroke();

        // Orbiting spark particles
        for (let k = 0; k < 3; k++) {
          const sparkAngle = t * 4 + (k * Math.PI * 2) / 3;
          const sx = cx + Math.cos(sparkAngle) * (ringRadius * 1.05);
          const sy = cy + Math.sin(sparkAngle) * (ringRadius * 1.05);
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        // Idle Breathing concentric subtle rings
        ctx.save();
        const breathe = (Math.sin(t * 1.2) + 1) * 0.5;
        ctx.strokeStyle = `rgba(147, 51, 234, ${0.3 + breathe * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * (1.1 + breathe * 0.08), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 + breathe * 0.15})`;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius * (1.25 + breathe * 0.12), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Central core sphere
      const corePulse =
        state === "SPEAKING"
          ? 1 + vol * 0.3
          : state === "LISTENING"
          ? 1 + vol * 0.25
          : state === "THINKING"
          ? 1 + Math.sin(t * 4) * 0.08
          : 1 + Math.sin(t * 1.2) * 0.04;

      const coreRadius = baseRadius * corePulse;
      const coreGrad = ctx.createRadialGradient(
        cx - coreRadius * 0.3,
        cy - coreRadius * 0.3,
        coreRadius * 0.1,
        cx,
        cy,
        coreRadius
      );

      if (state === "SPEAKING") {
        coreGrad.addColorStop(0, "#fbcfe8");
        coreGrad.addColorStop(0.4, "#ec4899");
        coreGrad.addColorStop(0.8, "#8b5cf6");
        coreGrad.addColorStop(1, "#312e81");
      } else if (state === "LISTENING") {
        coreGrad.addColorStop(0, "#cffafe");
        coreGrad.addColorStop(0.4, "#06b6d4");
        coreGrad.addColorStop(0.8, "#2563eb");
        coreGrad.addColorStop(1, "#1e1b4b");
      } else if (state === "THINKING" || state === "EXECUTING_TOOL") {
        coreGrad.addColorStop(0, "#fef3c7");
        coreGrad.addColorStop(0.4, "#f59e0b");
        coreGrad.addColorStop(0.8, "#e11d48");
        coreGrad.addColorStop(1, "#4c0519");
      } else {
        // Idle
        coreGrad.addColorStop(0, "#e0e7ff");
        coreGrad.addColorStop(0.35, "#818cf8");
        coreGrad.addColorStop(0.75, "#6366f1");
        coreGrad.addColorStop(1, "#1e1b4b");
      }

      ctx.save();
      ctx.shadowColor =
        state === "SPEAKING"
          ? "#ec4899"
          : state === "LISTENING"
          ? "#06b6d4"
          : state === "THINKING"
          ? "#f59e0b"
          : "#6366f1";
      ctx.shadowBlur = 24 * corePulse;

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner glass highlight
      const highlightGrad = ctx.createLinearGradient(
        cx - coreRadius * 0.6,
        cy - coreRadius * 0.6,
        cx + coreRadius * 0.4,
        cy + coreRadius * 0.4
      );
      highlightGrad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
      highlightGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
      highlightGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.arc(
        cx - coreRadius * 0.25,
        cy - coreRadius * 0.25,
        coreRadius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [state, size]);

  return (
    <div
      id="avani-orb-container"
      className="relative flex items-center justify-center cursor-pointer select-none group"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <canvas
        id="avani-orb-canvas"
        ref={canvasRef}
        className="w-full h-full transform transition-transform duration-300 group-hover:scale-105"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
