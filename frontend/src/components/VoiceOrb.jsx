'use client';

import { useEffect, useRef, useCallback } from 'react';

const PERSONA_THEMES = {
  krishna: {
    primary: [59, 130, 246],    // Celestial Blue
    secondary: [147, 51, 234],  // Cosmic Violet
    accent: [245, 158, 11],     // Sacred Gold
    core: [255, 255, 255],      // Solar White
    glowRgba: 'rgba(59, 130, 246, 0.45)',
    name: 'Lord Krishna'
  },
  chanakya: {
    primary: [239, 68, 68],     // Strategic Crimson
    secondary: [220, 38, 38],   // Deep Blood Red
    accent: [249, 115, 22],     // Royal Amber
    core: [255, 240, 220],
    glowRgba: 'rgba(239, 68, 68, 0.45)',
    name: 'Acharya Chanakya'
  },
  laxmibai: {
    primary: [245, 158, 11],    // Saffron Valor
    secondary: [220, 38, 38],   // Courage Flame
    accent: [250, 204, 21],     // Shield Gold
    core: [255, 250, 230],
    glowRgba: 'rgba(245, 158, 11, 0.45)',
    name: 'Rani Laxmibai'
  }
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export default function VoiceOrb({
  state = 'idle',
  freqData,
  persona = 'krishna',
  size = 380,
  onClick,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeRef = useRef(performance.now());

  // Orbiting embers
  const embersRef = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      radiusRatio: 0.95 + Math.random() * 0.35,
      speed: (Math.random() * 0.015 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
      size: Math.random() * 2.5 + 1.2,
      alpha: Math.random() * 0.7 + 0.3,
      verticalDrift: Math.random() * Math.PI * 2
    }))
  );

  // Soundwave ripple rings
  const ripplesRef = useRef([
    { r: 0.7, alpha: 0.6, speed: 0.003 },
    { r: 0.9, alpha: 0.4, speed: 0.0035 },
    { r: 1.15, alpha: 0.25, speed: 0.004 }
  ]);

  const theme = PERSONA_THEMES[persona] || PERSONA_THEMES.krishna;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const baseR = (W / 2) * 0.38;
    const t = (performance.now() - startTimeRef.current) / 1000;

    ctx.clearRect(0, 0, W, H);

    // Audio Analysis
    let avgAmp = 0;
    if (freqData && freqData.length > 0) {
      avgAmp = freqData.reduce((acc, val) => acc + val, 0) / freqData.length / 255;
    }

    // Dynamic state modifiers
    let expansion = 1.0;
    let activity = 0.04;
    let pulseSpeed = 1.2;
    let coreIntensity = 0.85;

    if (state === 'idle') {
      expansion = 1.0 + Math.sin(t * 1.5) * 0.05; // Gentle sacred breathing
      activity = 0.035 + Math.sin(t * 0.8) * 0.01;
      coreIntensity = 0.75 + Math.sin(t * 1.5) * 0.15;
    } else if (state === 'connecting') {
      expansion = 1.02 + Math.sin(t * 3.5) * 0.08;
      activity = 0.06;
      pulseSpeed = 2.5;
    } else if (state === 'listening' || state === 'recording') {
      expansion = 1.08 + avgAmp * 0.55; // Reactive to user voice
      activity = 0.08 + avgAmp * 0.45;
      pulseSpeed = 2.8;
      coreIntensity = 0.95 + avgAmp * 0.3;
    } else if (state === 'processing' || state === 'thinking') {
      expansion = 1.05 + Math.sin(t * 7) * 0.08; // Concentrated contemplation pulse
      activity = 0.15;
      pulseSpeed = 4.0;
      coreIntensity = 1.1;
    } else if (state === 'speaking') {
      // Dynamic simulated speech if real hardware amplitude not available
      const simulatedAmp = ((Math.sin(t * 5.2) * Math.cos(t * 3.7) + 1) / 2);
      const amp = avgAmp > 0 ? avgAmp : simulatedAmp * 0.6;
      expansion = 1.12 + amp * 0.65; // Majestic volumetric expansion
      activity = 0.18 + amp * 0.4;
      pulseSpeed = 3.5;
      coreIntensity = 1.2 + amp * 0.4;
    }

    const [r1, g1, b1] = theme.primary;
    const [r2, g2, b2] = theme.secondary;
    const [ra, ga, ba] = theme.accent;

    // ─── 1. Harmonic Soundwave Shockwave Ripples ────────────────────────────
    ctx.save();
    ripplesRef.current.forEach((ripple) => {
      ripple.r += ripple.speed * (state === 'speaking' || state === 'recording' ? 2.5 : 1.0);
      if (ripple.r > 1.6) {
        ripple.r = 0.65;
        ripple.alpha = 0.6;
      }
      const ringRadius = baseR * ripple.r * expansion;
      const ringAlpha = Math.max(0, ripple.alpha * (1 - (ripple.r - 0.65) / 0.95));

      ctx.beginPath();
      ctx.arc(CX, CY, ringRadius, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, ${ringAlpha * (state === 'speaking' ? 0.7 : 0.35)})`;
      ctx.stroke();
    });
    ctx.restore();

    // ─── 2. Concentric Rotating Sacred Mandala Rings ────────────────────────
    ctx.save();
    ctx.translate(CX, CY);

    // Outer slow-spinning glyph ring
    const outerRadius = baseR * expansion * 1.32;
    ctx.rotate(t * 0.08);
    ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, 0.18)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred Spokes on Outer Ring
    const numSpokes = 16;
    for (let i = 0; i < numSpokes; i++) {
      const a = (i * Math.PI * 2) / numSpokes;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (outerRadius - 6), Math.sin(a) * (outerRadius - 6));
      ctx.lineTo(Math.cos(a) * (outerRadius + 6), Math.sin(a) * (outerRadius + 6));
      ctx.stroke();
    }

    // Inner Counter-spinning Dharma Ring
    ctx.rotate(-t * 0.16);
    const innerRingRadius = baseR * expansion * 1.15;
    ctx.strokeStyle = `rgba(${ra}, ${ga}, ${ba}, 0.22)`;
    ctx.beginPath();
    ctx.arc(0, 0, innerRingRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Golden Meridian Marks
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.fillStyle = `rgba(${ra}, ${ga}, ${ba}, 0.45)`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * innerRingRadius, Math.sin(a) * innerRingRadius, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ─── 3. Multi-Layer Volumetric Fluid Plasma Core ─────────────────────────
    ctx.globalCompositeOperation = 'screen';
    const layerCount = state === 'speaking' ? 5 : state === 'processing' ? 5 : 4;
    const resolution = 160;

    for (let layer = 0; layer < layerCount; layer++) {
      ctx.beginPath();
      const layerOffsetRadius = baseR * expansion * (0.75 + layer * 0.12);

      for (let i = 0; i <= resolution; i++) {
        const angle = (i / resolution) * Math.PI * 2;

        // Wave superposition simulating fluid organic plasma
        const w1 = Math.sin(angle * 3 + t * (1.8 + layer * 0.4)) * 0.16;
        const w2 = Math.cos(angle * 5 - t * (2.2 - layer * 0.3)) * 0.11;
        const w3 = Math.sin(angle * 7 + t * (pulseSpeed + layer * 0.5)) * 0.06;

        const distortion = (w1 + w2 + w3) * layerOffsetRadius * activity;
        const radius = layerOffsetRadius + distortion;

        const spin = angle + t * (layer % 2 === 0 ? 0.35 : -0.35);
        const px = CX + Math.cos(spin) * radius;
        const py = CY + Math.sin(spin) * radius;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Centered volumetric gradient with chromatic prismatic bloom
      const grad = ctx.createRadialGradient(
        CX, CY, baseR * 0.05,
        CX, CY, layerOffsetRadius * 1.35
      );

      if (layer === 0) {
        // High-Intensity Solar/Divine Core
        grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, coreIntensity)})`);
        grad.addColorStop(0.18, `rgba(${ra}, ${ga}, ${ba}, 0.85)`);
        grad.addColorStop(0.5, `rgba(${r1}, ${g1}, ${b1}, 0.6)`);
        grad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0)`);
      } else if (layer === 1) {
        // Radiant Energy Cloak
        grad.addColorStop(0, `rgba(${ra}, ${ga}, ${ba}, 0.45)`);
        grad.addColorStop(0.4, `rgba(${r1}, ${g1}, ${b1}, 0.35)`);
        grad.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, 0)`);
      } else {
        // Translucent Celestial Mantle
        const layerAlpha = 0.35 - (layer / layerCount) * 0.2;
        grad.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${layerAlpha})`);
        grad.addColorStop(0.7, `rgba(${ra}, ${ga}, ${ba}, ${layerAlpha * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = grad;
      ctx.fill();

      // Crystalline Luminous Rim on outermost layer
      if (layer === layerCount - 1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + activity * 0.3})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }

    // ─── 4. Orbiting Sacred Firefly Embers ───────────────────────────────────
    ctx.save();
    embersRef.current.forEach((ember) => {
      ember.angle += ember.speed * (state === 'speaking' || state === 'recording' ? 2.2 : 1.0);
      const emberR = baseR * expansion * ember.radiusRatio;
      const ex = CX + Math.cos(ember.angle) * emberR;
      const ey = CY + Math.sin(ember.angle) * emberR + Math.sin(t * 2 + ember.verticalDrift) * 6;

      const emberAlpha = ember.alpha * (0.6 + 0.4 * Math.sin(t * 3 + ember.verticalDrift));

      ctx.beginPath();
      ctx.arc(ex, ey, ember.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ra}, ${ga}, ${ba}, ${emberAlpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `rgba(${ra}, ${ga}, ${ba}, 0.9)`;
      ctx.fill();
    });
    ctx.restore();

    ctx.globalCompositeOperation = 'source-over';
    rafRef.current = requestAnimationFrame(draw);
  }, [state, freqData, theme]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const canvasSize = size * dpr;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Dynamic Deep Ambient Nebula Bloom */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          filter: 'blur(70px)',
          background: `radial-gradient(circle, ${theme.glowRgba} 0%, rgba(0,0,0,0) 70%)`,
          transform: state === 'speaking' || state === 'recording' ? 'scale(1.5)' : 'scale(1.15)',
          opacity: state === 'speaking' ? 0.9 : state === 'recording' ? 0.8 : 0.55,
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={onClick}
        style={{
          width: size,
          height: size,
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
          zIndex: 1
        }}
        aria-label={`DharmaGPT Voice Sanctuary — ${state}`}
      />
    </div>
  );
}
