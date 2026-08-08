import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    id: 'user',
    label: 'User',
    sub: 'Sets private\nHF threshold',
    accent: 'var(--mauve)',
    icon: '👤',
    private: true,
  },
  {
    id: 'vault',
    label: 'AegisVault',
    sub: 'Coston2 smart\ncontract',
    accent: 'var(--blue)',
    icon: '🏦',
    private: false,
  },
  {
    id: 'tee',
    label: 'TEE Enclave',
    sub: 'FCC extension\nMODE=0',
    accent: 'var(--mauve)',
    icon: '🔐',
    private: true,
  },
  {
    id: 'ftso',
    label: 'FTSOv2',
    sub: 'Block-latency\nprice feed',
    accent: 'var(--blue)',
    icon: '📡',
    private: false,
  },
  {
    id: 'repay',
    label: 'Repayment TX',
    sub: 'Verifiable\non-chain',
    accent: 'var(--green)',
    icon: '✅',
    private: false,
  },
];

const ARROWS = [
  { label: 'FCC Instruction', private: true },
  { label: 'Trigger config', private: true },
  { label: 'Reads price', private: false },
  { label: 'executeProtection()', private: false },
];

export default function ArchitectureStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="panel"
      style={{ marginBottom: 24 }}
    >
      <div className="panel-titlebar">
        <span className="dot" style={{ background: 'var(--blue)' }} />
        <span>Architecture</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--overlay0)' }}>
          <span style={{ color: 'var(--mauve)', marginRight: 12 }}>█ private / TEE</span>
          <span style={{ color: 'var(--blue)' }}>█ public / on-chain</span>
        </span>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* Flow row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              {/* Node */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto', minWidth: 90 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${step.accent}`,
                  borderRadius: 4,
                  background: step.private
                    ? 'rgba(203,166,247,0.08)'
                    : 'rgba(137,180,250,0.06)',
                  fontSize: 22,
                  boxShadow: `0 0 16px ${step.accent}33`,
                  position: 'relative',
                }}>
                  {step.icon}
                  {step.private && (
                    <div style={{
                      position: 'absolute',
                      top: -6, right: -6,
                      fontSize: 10,
                      background: 'var(--mantle)',
                      borderRadius: 2,
                      padding: '0 3px',
                      color: 'var(--mauve)',
                      fontWeight: 700,
                      border: '1px solid rgba(203,166,247,0.3)',
                    }}>
                      TEE
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: step.accent }}>{step.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--overlay1)', marginTop: 2, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                    {step.sub}
                  </div>
                </div>
              </div>

              {/* Arrow between nodes */}
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '0 4px',
                  paddingBottom: 28, // offset for label below
                }}>
                  <div style={{
                    width: '100%',
                    height: 1,
                    background: ARROWS[i].private
                      ? `repeating-linear-gradient(90deg, var(--mauve) 0, var(--mauve) 6px, transparent 6px, transparent 10px)`
                      : 'var(--surface1)',
                  }} />
                  <div style={{
                    fontSize: 9,
                    color: ARROWS[i].private ? 'var(--mauve)' : 'var(--overlay0)',
                    letterSpacing: '0.06em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                  }}>
                    {ARROWS[i].label}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Legend bar */}
        <div style={{
          marginTop: 20,
          padding: '10px 14px',
          background: 'var(--mantle)',
          border: '1px solid var(--border-dim)',
          borderRadius: 2,
          display: 'flex',
          gap: 32,
          fontSize: 11,
          color: 'var(--overlay1)',
          flexWrap: 'wrap',
        }}>
          <span>
            <span style={{ color: 'var(--mauve)', fontWeight: 700 }}>── ── TEE-encrypted</span>
            {' '}— Threshold and HF never leave enclave memory
          </span>
          <span>
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>────── On-chain</span>
            {' '}— FTSOv2 price feed verifiable by anyone
          </span>
          <span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>✅ Repayment</span>
            {' '}— Verifiable on Coston2 block explorer
          </span>
        </div>
      </div>
    </motion.div>
  );
}
