import React from 'react';

/**
 * HomeCosmicBackdrop — Deep Celestial Nebula Atmosphere for the Portal.
 * Provides deep cosmic space gradients, subtle solar warmth, and perimeter darkening.
 */
export default function HomeCosmicBackdrop() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0
      }}
    >
      {/* 1. Deep Celestial Cosmic Space Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 35%, rgba(24, 18, 12, 0.85) 0%, rgba(10, 13, 20, 0.95) 55%, #05070c 100%)'
        }}
      />

      {/* 2. Soft Ambient Solar Nebula Glow */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(700px, 90vw)',
          height: 'min(700px, 90vw)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.06) 45%, transparent 75%)',
          filter: 'blur(80px)',
          animation: 'chakraAuraPulse 8s ease-in-out infinite'
        }}
      />

      {/* 3. Smooth Dark Edge Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 90% 85% at 50% 40%, transparent 45%, rgba(5, 7, 12, 0.65) 80%, #05070c 100%)'
        }}
      />
    </div>
  );
}
