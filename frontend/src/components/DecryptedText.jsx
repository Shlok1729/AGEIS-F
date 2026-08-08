import React, { useState, useEffect } from 'react';

const CHARS = 'ABCDEF0123456789!@#$%^&*<>[]{}~+=?';

export default function DecryptedText({ 
  text, 
  speed = 40, 
  maxIterations = 10, 
  className = '', 
  encrypted = false,
  style = {} 
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / (maxIterations / text.length);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, maxIterations, isHovered]);

  return (
    <span 
      className={className} 
      onMouseEnter={() => setIsHovered(prev => !prev)}
      style={{
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        cursor: 'default',
        ...style
      }}
    >
      {encrypted ? (
        <span style={{ color: '#818cf8', opacity: 0.85 }}>
          {displayText.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).slice(0, 16).join('')}
        </span>
      ) : (
        displayText
      )}
    </span>
  );
}
