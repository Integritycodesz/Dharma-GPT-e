import React, { useEffect, useRef } from 'react';

const SAGE_CONFIGS = {
  krishna: {
    src: '/personas/krishna.jpg',
    color: [240, 248, 255],     // Luminous Celestial White
    glowRgba: 'rgba(59, 130, 246, 0.6)',
    secondaryGlow: 'rgba(245, 158, 11, 0.35)',
    bgThreshold: 145,            // Clean cutoff for background
    verticalOffset: 0.02,        // Center offset
    targetScale: 0.82            // 82% of viewport height
  },
  chanakya: {
    src: '/personas/chanakya.jpg',
    color: [255, 245, 235],     // Luminous Ivory Amber
    glowRgba: 'rgba(239, 68, 68, 0.6)',
    secondaryGlow: 'rgba(249, 115, 22, 0.35)',
    bgThreshold: 135,            // Beige/tan background cutoff
    verticalOffset: 0.02,
    targetScale: 0.80
  },
  laxmibai: {
    src: '/personas/laxmibai.png',
    color: [255, 250, 230],     // Radiant Solar Saffron White
    glowRgba: 'rgba(245, 158, 11, 0.65)',
    secondaryGlow: 'rgba(220, 38, 38, 0.35)',
    bgThreshold: 150,            // White background cutoff
    verticalOffset: 0.03,
    targetScale: 0.82
  }
};

export default function PersonaArtBackdrop({
  persona = 'krishna',
  variant = 'chat', // 'chat' | 'voice'
  isSpeaking = false
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const processedBitmapsRef = useRef({});

  const config = SAGE_CONFIGS[persona] || SAGE_CONFIGS.krishna;

  // Process image on offscreen canvas to completely remove background box
  useEffect(() => {
    let isCancelled = false;

    const processImage = async () => {
      if (processedBitmapsRef.current[persona]) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = config.src;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      if (isCancelled) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth || img.width;
      offCanvas.height = img.naturalHeight || img.height;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0);
      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      const data = imgData.data;
      const threshold = config.bgThreshold;
      const [tr, tg, tb] = config.color;
      const totalPixels = data.length / 4;
      const imgW = offCanvas.width;
      const imgH = offCanvas.height;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Perceived luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum >= threshold) {
          // 100% Transparent Background — Eliminates the square box completely!
          data[i + 3] = 0;
        } else {
          // Smooth edge anti-aliasing curve
          const normalized = Math.max(0, 1 - lum / threshold);
          let alpha = Math.min(255, Math.pow(normalized, 0.9) * 255);

          // Smoothly dissolve top and bottom edges to eliminate any artifact lines
          const pixelIndex = i / 4;
          const py = Math.floor(pixelIndex / imgW);
          const yRatio = py / imgH;

          if (yRatio > 0.82) {
            // Soft fade-out at bottom
            alpha *= Math.max(0, 1 - (yRatio - 0.82) / 0.18);
          } else if (yRatio < 0.06) {
            // Soft fade-in at top
            alpha *= Math.max(0, yRatio / 0.06);
          }

          // Tint the silhouette into radiant celestial light
          data[i] = tr;
          data[i + 1] = tg;
          data[i + 2] = tb;
          data[i + 3] = alpha;
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      try {
        const bitmap = await createImageBitmap(offCanvas);
        if (!isCancelled) {
          processedBitmapsRef.current[persona] = bitmap;
        }
      } catch (e) {
        if (!isCancelled) {
          processedBitmapsRef.current[persona] = offCanvas;
        }
      }
    };

    processImage().catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [persona, config]);

  // Main Render Loop: Responsive, Centered, Breathes naturally, Softly faded for pristine text readability
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const processed = processedBitmapsRef.current[persona];
      const now = (performance.now() - startTime) / 1000;

      if (processed) {
        const imgW = processed.width;
        const imgH = processed.height;
        const aspect = imgW / imgH;

        // Scale: Grand presence, but comfortably constrained to viewport
        const baseTargetH = variant === 'voice' 
          ? Math.min(height * config.targetScale, 800) 
          : Math.min(height * (config.targetScale - 0.04), 740);

        // Gentle breathing animation (centered)
        const breathe = 1 + Math.sin(now * 1.4) * (isSpeaking ? 0.03 : 0.015);
        const targetH = baseTargetH * breathe;
        const targetW = targetH * aspect;

        // Perfectly centered horizontally & vertically in the screen
        const cx = (width - targetW) / 2;
        const cy = (height - targetH) / 2 + (height * config.verticalOffset);

        ctx.save();

        // ── Soft Faded Opacity so all text is 100% easily readable! ───────
        const baseOpacity = variant === 'voice' 
          ? (isSpeaking ? 0.28 : 0.18) 
          : (isSpeaking ? 0.14 : 0.09);

        ctx.globalAlpha = baseOpacity;

        // Soft Celestial Aura Shadow
        ctx.shadowColor = config.glowRgba;
        ctx.shadowBlur = isSpeaking ? 50 : 30;

        // Draw the clean, transparent, softly-faded silhouette
        ctx.drawImage(processed, cx, cy, targetW, targetH);

        // Secondary subtle golden rim glow
        ctx.shadowColor = config.secondaryGlow;
        ctx.shadowBlur = isSpeaking ? 20 : 10;
        ctx.drawImage(processed, cx, cy, targetW, targetH);

        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [persona, variant, isSpeaking, config]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1, // Directly behind UI elements and orb, above canvas background
        transition: 'opacity 0.6s ease'
      }}
    />
  );
}
