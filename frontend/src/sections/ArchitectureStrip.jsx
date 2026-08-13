import React from 'react';
import { motion } from 'framer-motion';
import { User, Layers, Lock, Radio, CheckCircle2, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    id: 'user',
    label: 'Borrower',
    sub: 'EIP-191 private trigger authorization',
    accent: 'var(--tech-purple)',
    icon: User,
    private: true,
  },
  {
    id: 'vault',
    label: 'AegisVault',
    sub: 'Coston2 non-custodial reserve',
    accent: 'var(--flare-blue)',
    icon: Layers,
    private: false,
  },
  {
    id: 'tee',
    label: 'FCC TEE Enclave',
    sub: 'Encrypted RAM health engine',
    accent: 'var(--tech-purple)',
    icon: Lock,
    private: true,
  },
  {
    id: 'ftso',
    label: 'FTSOv2 Streamer',
    sub: 'Sub-second decentralized oracle',
    accent: 'var(--flare-blue)',
    icon: Radio,
    private: false,
  },
  {
    id: 'repay',
    label: 'Dynamic Repayment',
    sub: 'Preempts MEV liquidators',
    accent: 'var(--money-green)',
    icon: CheckCircle2,
    private: false,
  },
];

export default function ArchitectureStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fintech-card fintech-card--flat"
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'var(--space-6)',
      }}
    >
      {/* Titlebar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge--neutral" style={{ fontSize: 10 }}>
            Confidential Architecture
          </span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            End-to-End TEE Data Pipeline
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--tech-purple)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tech-purple)', display: 'inline-block' }} />
            Private TEE Enclave Domain
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--flare-blue)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--flare-blue)', display: 'inline-block' }} />
            Public Flare On-Chain Domain
          </span>
        </div>
      </div>

      {/* Pipeline Steps Grid */}
      <div className="grid-responsive-5" style={{ position: 'relative' }}>
        {STEPS.map((step, i) => {
          const IconComp = step.icon;
          return (
            <div
              key={step.id}
              style={{
                background: step.private ? 'rgba(155, 127, 255, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${step.private ? 'rgba(155, 127, 255, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '14px',
                padding: '18px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Step Icon Badge */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: step.private ? 'rgba(155, 127, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${step.accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                color: step.accent,
                boxShadow: `0 0 16px ${step.accent}22`,
              }}>
                <IconComp size={20} />
              </div>

              {/* Step Content */}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {step.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {step.sub}
              </span>

              {/* Flow arrow between steps */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  right: -12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  color: 'var(--text-muted)',
                  display: 'none', // Shown on large desktop or subtle
                }}>
                  <ArrowRight size={14} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
