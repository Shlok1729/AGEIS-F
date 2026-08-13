import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    // Only disable on mobile devices with touch only and no hover
    if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;

    // Use GSAP quickTo for ultra-smooth 120fps performance
    const xDotTo = gsap.quickTo(dot, 'x', { duration: 0.05, ease: 'power3.out' });
    const yDotTo = gsap.quickTo(dot, 'y', { duration: 0.05, ease: 'power3.out' });

    const xRingTo = gsap.quickTo(ring, 'x', { duration: 0.18, ease: 'power3.out' });
    const yRingTo = gsap.quickTo(ring, 'y', { duration: 0.18, ease: 'power3.out' });

    const onMouseMove = (e) => {
      setHasMoved(true);
      xDotTo(e.clientX);
      yDotTo(e.clientY);
      xRingTo(e.clientX);
      yRingTo(e.clientY);

      const target = e.target;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button, a, input, select, textarea, [role="button"], .btn, .fintech-card--actionable, .clickable')
        );
        setIsHovered(isInteractive);
      }
    };

    const onMouseDown = () => {
      if (dot && ring) gsap.to([dot, ring], { scale: 0.8, duration: 0.1 });
    };

    const onMouseUp = () => {
      if (dot && ring) gsap.to([dot, ring], { scale: 1, duration: 0.12 });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <>
      {/* Hide native cursor ONLY when custom cursor has started tracking movements */}
      {hasMoved && (
        <style>{`
          * {
            cursor: none !important;
          }
        `}</style>
      )}

      {/* Main Reticle Ring */}
      <div
        ref={ringRef}
        style={{
          position: 'fixed',
          top: -16,
          left: -16,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: isHovered ? '1.5px solid var(--flare-blue)' : '1.5px solid rgba(255, 255, 255, 0.4)',
          background: isHovered ? 'var(--flare-blue-glow)' : 'transparent',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: hasMoved ? 1 : 0,
          transform: `scale(${isHovered ? 1.4 : 1})`,
          transition: 'transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease',
          boxShadow: isHovered ? '0 0 16px var(--flare-blue-glow)' : '0 0 8px rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isHovered && (
          <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 1, height: 4, background: 'var(--flare-blue)' }} />
            <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 1, height: 4, background: 'var(--flare-blue)' }} />
            <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 4, height: 1, background: 'var(--flare-blue)' }} />
            <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 4, height: 1, background: 'var(--flare-blue)' }} />
          </div>
        )}
      </div>

      {/* Precision Center Dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: isHovered ? 'var(--flare-blue)' : '#FFFFFF',
          pointerEvents: 'none',
          zIndex: 999999,
          opacity: hasMoved ? 1 : 0,
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.9)',
          transition: 'background 0.15s ease, opacity 0.15s ease',
        }}
      />
    </>
  );
}
