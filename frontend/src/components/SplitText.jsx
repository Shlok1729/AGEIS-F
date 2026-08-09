import React from 'react';
import { motion } from 'framer-motion';

/**
 * SplitText — React Bits Text Animation
 * Clean, subtle stagger entrance animation for headings.
 */
export default function SplitText({ text, className = '', style = {}, delay = 0.05 }) {
  const words = text.split(' ');

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: delay, delayChildren: 0.05 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: 0,
      y: 14,
      filter: 'blur(4px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.h1
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.28em',
        ...style,
      }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => {
        // Special color highlight matching the public / private / verifiable grammar
        let color = 'inherit';
        if (word.toLowerCase().includes('private')) color = 'var(--mauve)';
        else if (word.toLowerCase().includes('verifiable')) color = 'var(--green)';
        else if (word.toLowerCase().includes('on-chain')) color = 'var(--blue)';

        return (
          <motion.span
            variants={child}
            key={index}
            style={{ color, display: 'inline-block' }}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.h1>
  );
}
