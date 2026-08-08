import React from 'react';
import { motion } from 'framer-motion';

/**
 * LandingHero – Section 1
 * Sells the private/public distinction with a two-column visual split.
 */
export default function LandingHero({ onEnterDemo }) {
  return (
    <section style={{ padding: '64px 0 56px' }}>
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-label" style={{ marginBottom: 20 }}>
          Flare Summer Signal — Bounty 2: Confidential Compute
        </div>

        <h1 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(22px, 3.5vw, 36px)',
          fontWeight: 800,
          color: 'var(--text)',
          lineHeight: 1.25,
          letterSpacing: '-0.02em',
          marginBottom: 14,
          maxWidth: 680,
        }}>
          <span style={{ color: 'var(--mauve)' }}>Private</span> thresholds.{' '}
          <span style={{ color: 'var(--green)' }}>Verifiable</span> repayments.{' '}
          <span style={{ color: 'var(--blue)' }}>On-chain</span> price.
        </h1>

        <p style={{
          color: 'var(--subtext0)',
          fontSize: 14,
          maxWidth: 580,
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          Aegis-F is a TEE-based keeper that privately monitors your Flare lending position
          and auto-repays debt before public liquidators can front-run your stop-loss. 
          Your health factor and trigger threshold never leave the enclave.
        </p>
      </motion.div>

      {/* Private vs Public Two-Column Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 0,
          marginBottom: 36,
          border: '1px solid var(--border-dim)',
          borderRadius: 4,
          overflow: 'hidden',
          maxWidth: 820,
        }}
      >
        {/* PUBLIC column */}
        <div style={{
          background: 'rgba(137, 180, 250, 0.04)',
          borderRight: '1px solid var(--border-dim)',
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--blue)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
            PUBLIC / ON-CHAIN
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '📡', label: 'FTSOv2 price feed (FLR/USD)', sub: '~1.8s block-latency updates' },
              { icon: '⛓️', label: 'Repayment transaction', sub: 'Verifiable on Coston2 explorer' },
              { icon: '📋', label: 'Vault reserve balance', sub: 'AegisVault contract on-chain' },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--overlay1)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Divider */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 12px',
          background: 'var(--mantle)',
          minWidth: 52,
          gap: 8,
        }}>
          <div style={{ fontSize: 11, color: 'var(--overlay0)', writingMode: 'vertical-rl', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AEGIS-F
          </div>
          <div style={{ width: 1, flex: 1, background: 'var(--border-dim)' }} />
          <div style={{ fontSize: 14 }}>🔒</div>
          <div style={{ width: 1, flex: 1, background: 'var(--border-dim)' }} />
        </div>

        {/* PRIVATE column */}
        <div style={{
          background: 'rgba(203, 166, 247, 0.05)',
          padding: '20px 24px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--mauve)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--mauve)', display: 'inline-block' }} />
            PRIVATE / TEE-ENCRYPTED
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🔐', label: 'Your HF trigger threshold', sub: 'Never written to a public TX' },
              { icon: '🧮', label: 'Health factor computation', sub: 'Computed inside enclave memory' },
              { icon: '🔑', label: 'Protocol Managed Wallet key', sub: 'Enclave-custody only' },
            ].map(({ icon, label, sub }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--overlay1)' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{ display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <button className="btn btn--mauve" onClick={onEnterDemo} style={{ fontSize: 13, padding: '10px 24px' }}>
          ▶ Enter Live Demo
        </button>
        <span style={{ fontSize: 12, color: 'var(--overlay0)' }}>
          Coston2 testnet · FCC MODE=0 simulation
        </span>
      </motion.div>
    </section>
  );
}
