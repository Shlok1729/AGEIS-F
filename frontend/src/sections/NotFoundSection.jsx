import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundSection({ onGoHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px',
        textAlign: 'center',
        minHeight: '60vh',
      }}
    >
      <div style={{ marginBottom: 24, color: 'var(--risk-red)' }}>
        <ShieldAlert size={64} strokeWidth={1.5} />
      </div>
      
      <h2 style={{ 
        fontSize: 'clamp(2rem, 5vw, 4rem)', 
        fontWeight: 800, 
        color: 'var(--text-primary)', 
        letterSpacing: '-0.02em', 
        marginBottom: 'var(--space-3)' 
      }}>
        404 — Access Denied
      </h2>
      
      <p style={{ 
        fontSize: '1.125rem', 
        color: 'var(--text-secondary)', 
        maxWidth: 500, 
        margin: '0 auto var(--space-6)', 
        lineHeight: 1.6 
      }}>
        The requested module or hardware enclave route does not exist. Ensure your telemetry endpoints are correctly configured.
      </p>

      <button
        onClick={onGoHome}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 24px',
          background: 'var(--tech-purple)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 8px 24px var(--tech-purple-glow)',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 32px var(--tech-purple-glow)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px var(--tech-purple-glow)';
        }}
      >
        <ArrowLeft size={16} />
        Return to Overview
      </button>
    </motion.div>
  );
}
