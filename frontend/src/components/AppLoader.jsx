import React from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export default function AppLoader({ message = 'Attesting Enclave Hardware...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-base)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'var(--tech-purple-glow)',
            filter: 'blur(20px)',
          }}
        />
        <Cpu size={48} color="var(--tech-purple)" strokeWidth={1.5} />
      </div>
      <div style={{
        marginTop: 24,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        {message}
      </div>
    </motion.div>
  );
}
