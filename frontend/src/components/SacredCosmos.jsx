import React, { useEffect, useRef } from 'react';

const MODE_PALETTES = {
  krishna: {
    primary: [59, 130, 246],    // Celestial Blue
    secondary: [245, 158, 11],  // Pitambari Gold
    tertiary: [147, 197, 253],  // Feather Cyan
    ambientGlow: 'rgba(59, 130, 246, 0.12)'
  },
  chanakya: {
    primary: [239, 68, 68],     // Strategic Crimson
    secondary: [249, 115, 22],  // Chanakya Amber
    tertiary: [252, 165, 165],  // Parchment Rose
    ambientGlow: 'rgba(239, 68, 68, 0.12)'
  },
  laxmibai: {
    primary: [245, 158, 11],    // Saffron Valor
    secondary: [220, 38, 38],   // Crimson Flame
    tertiary: [253, 224, 71],   // Shield Gold
    ambientGlow: 'rgba(245, 158, 11, 0.12)'
  }
};

export default function SacredCosmos({ activeMode = 'krishna', intensity = 'normal' }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000 });
  const animFrameRef = useRef(null);
  const palette = MODE_PALETTES[activeMode] || MODE_PALETTES.krishna;

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

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate Sacred Embers
    const particleCount = intensity === 'high' ? 80 : 55;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.8 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.15),
      speedX: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      pulseOffset: Math.random() * Math.PI * 2,
      colorType: Math.random() > 0.4 ? 'gold' : 'mode'
    }));

    let rotationAngle = 0;

    const render = () => {
      // Smooth mouse follow
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // ─── 1. Ambient Cosmic Aura ──────────────────────────────────────────
      const cx = width / 2;
      const cy = height * 0.45;
      const auraGradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(width, height) * 0.65);
      const [r1, g1, b1] = palette.primary;
      const [r2, g2, b2] = palette.secondary;
      auraGradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, 0.14)`);
      auraGradient.addColorStop(0.35, `rgba(${r2}, ${g2}, ${b2}, 0.06)`);
      auraGradient.addColorStop(0.8, 'rgba(10, 15, 24, 0.9)');
      auraGradient.addColorStop(1, 'rgba(5, 7, 12, 0.98)');

      ctx.fillStyle = auraGradient;
      ctx.fillRect(0, 0, width, height);

      // ─── 2. Sacred Mandala Geometry (Subtle Celestial Rings) ──────────────
      rotationAngle += 0.0006;
      ctx.save();
      ctx.translate(cx, cy);

      const maxR = Math.min(width, height) * 0.38;
      ctx.lineWidth = 1;

      // Outer Ring
      ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, 0.08)`;
      ctx.beginPath();
      ctx.arc(0, 0, maxR, 0, Math.PI * 2);
      ctx.stroke();

      // Middle Dharma Chakra Ring with Petals / Spokes
      ctx.rotate(rotationAngle);
      ctx.strokeStyle = `rgba(${r1}, ${g1}, ${b1}, 0.06)`;
      const spokes = 12;
      for (let i = 0; i < spokes; i++) {
        const rad = (i * Math.PI * 2) / spokes;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rad) * (maxR * 0.5), Math.sin(rad) * (maxR * 0.5));
        ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
        ctx.stroke();
      }

      // Inner Concentric Ring (Counter-rotating)
      ctx.rotate(-rotationAngle * 1.8);
      ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, 0.09)`;
      ctx.beginPath();
      ctx.arc(0, 0, maxR * 0.45, 0, Math.PI * 2);
      ctx.stroke();

      // 8-Point Sacred Star in Center
      const innerR = maxR * 0.22;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? innerR : innerR * 0.45;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      // ─── 3. Floating Sacred Embers & Mouse Reaction ──────────────────────
      const now = performance.now() * 0.001;
      const mouse = mouseRef.current;

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(now + p.pulseOffset) * 0.25;

        // Wrap around screen
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Mouse gentle repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140 && dist > 0) {
          const force = (1 - dist / 140) * 2.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(now * 3 + p.pulseOffset));
        const color = p.colorType === 'gold' ? [251, 191, 36] : palette.primary;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${currentAlpha})`;
        ctx.shadowBlur = p.size * 5;
        ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeMode, intensity]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'opacity 1s ease',
      }}
    />
  );
}

