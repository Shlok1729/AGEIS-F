import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AuroraBackground — "Quiet Signal" Signature Ambient Element
 * 
 * Soft, slow-moving aurora glow sitting behind glass panels.
 * In calm state: slow continuous flow in blue (#89b4fa) and mauve (#cba6f7).
 * When rescue fires (isRescuing=true): smoothly shifts toward vibrant signal green (#a6e3a1),
 * brightens decisively, then settles back to calm.
 * 
 * Complies with prefers-reduced-motion.
 */
export default function AuroraBackground({ children, isRescuing = false, intensity = 'normal' }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Opacity modifiers
  const baseGlowOpacity = intensity === 'dim' ? 0.08 : intensity === 'subtle' ? 0.12 : 0.16;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--base)',
        color: 'var(--text)',
        overflowX: 'hidden',
      }}
    >
      {/* ── Ambient Aurora Layer ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Blob 1: Blue / Mauve Orb Top-Left */}
        <motion.div
          animate={
            reducedMotion
              ? {}
              : isRescuing
              ? {
                  x: [0, 60, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.25, 1],
                  background: 'radial-gradient(circle, rgba(166, 227, 161, 0.45) 0%, rgba(166, 227, 161, 0) 70%)',
                }
              : {
                  x: [0, 80, -40, 0],
                  y: [0, -50, 30, 0],
                  scale: [1, 1.15, 0.95, 1],
                }
          }
          transition={
            isRescuing
              ? { duration: 1.8, ease: 'easeOut' }
              : { duration: 24, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{
            position: 'absolute',
            top: '-12%',
            left: '8%',
            width: '680px',
            height: '680px',
            borderRadius: '50%',
            background: isRescuing
              ? 'radial-gradient(circle, rgba(166, 227, 161, 0.45) 0%, rgba(166, 227, 161, 0) 70%)'
              : `radial-gradient(circle, rgba(137, 180, 250, ${baseGlowOpacity + 0.05}) 0%, rgba(137, 180, 250, 0) 65%)`,
            filter: 'blur(90px)',
            transition: 'background 0.8s ease',
          }}
        />

        {/* Blob 2: Mauve Orb Top-Right / Center */}
        <motion.div
          animate={
            reducedMotion
              ? {}
              : isRescuing
              ? {
                  x: [0, -50, 0],
                  y: [0, 60, 0],
                  scale: [1, 1.3, 1],
                }
              : {
                  x: [0, -60, 50, 0],
                  y: [0, 40, -30, 0],
                  scale: [1, 1.1, 0.9, 1],
                }
          }
          transition={
            isRescuing
              ? { duration: 2.0, ease: 'easeOut' }
              : { duration: 28, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: '740px',
            height: '740px',
            borderRadius: '50%',
            background: isRescuing
              ? 'radial-gradient(circle, rgba(166, 227, 161, 0.4) 0%, rgba(166, 227, 161, 0) 70%)'
              : `radial-gradient(circle, rgba(203, 166, 247, ${baseGlowOpacity}) 0%, rgba(203, 166, 247, 0) 65%)`,
            filter: 'blur(100px)',
            transition: 'background 0.8s ease',
          }}
        />

        {/* Blob 3: Deep Atmospheric Flow Bottom */}
        <motion.div
          animate={
            reducedMotion
              ? {}
              : {
                  x: [0, 50, -60, 0],
                  y: [0, -30, 40, 0],
                }
          }
          transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '25%',
            width: '800px',
            height: '600px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(137, 220, 235, ${baseGlowOpacity * 0.7}) 0%, rgba(137, 220, 235, 0) 70%)`,
            filter: 'blur(110px)',
          }}
        />

        {/* Subtle Organic Grain Texture Layer (Grainient) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E")`,
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Content Layer ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
