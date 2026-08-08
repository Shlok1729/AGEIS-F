import React from 'react';

export default function BorderBeam({
  size = 220,
  duration = 9,
  anchor = 90,
  borderWidth = 2,
  colorFrom = '#4f46e5',
  colorTo = '#e84142',
  delay = 0,
}) {
  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        border: `${borderWidth}px solid transparent`,
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
        padding: `${borderWidth}px`,
        overflow: 'hidden',
        zIndex: 5,
      }}
    >
      <div
        style={{
          position: 'absolute',
          aspectRatio: '1',
          width: `${size}px`,
          backgroundImage: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          offsetAnchor: `${anchor}% 50%`,
          offsetPath: `rect(0 auto auto 0 round inherit)`,
          animation: `border-beam-anim ${duration}s infinite linear`,
          animationDelay: `${delay}s`,
        }}
      />
    </div>
  );
}
