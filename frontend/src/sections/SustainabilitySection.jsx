import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Fuel, Building2, CheckCircle2 } from 'lucide-react';

export default function SustainabilitySection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="fintech-card fintech-card--flat"
      style={{
        padding: '32px',
        margin: '0 auto',
        maxWidth: 1080,
        background: 'rgba(18, 18, 26, 0.75)',
      }}
    >
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} style={{ color: 'var(--tech-purple)' }} />
          <div>
            <div style={{ fontSize: 10, color: 'var(--tech-purple)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Protocol Economics & Sustainable Gas
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Path to Sustainability: The 20 bps Protection Fee Architecture
            </h3>
          </div>
        </div>
        <span className="badge badge--green" style={{ fontSize: 10 }}>
          <CheckCircle2 size={12} />
          <span>Self-Sustaining Protocol</span>
        </span>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, maxWidth: 920 }}>
        Autonomous risk keepers require long-term economic sustainability without relying on perpetual grant subsidies.
        Aegis-F implements a <strong>success-based fee architecture</strong> that completely aligns borrower incentives, protocol revenue, and keeper gas reimbursement.
      </p>

      {/* 3 Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {/* Pillar 1 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Target size={16} style={{ color: 'var(--money-green)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--money-green)' }}>1. Success-Only Fee (20 bps)</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            Zero upfront cost or subscription lock-in. A nominal <strong>0.20% (20 bps)</strong> fee is deducted only when an automated rescue successfully executes.
          </p>
          <div style={{ background: 'rgba(46, 212, 122, 0.06)', border: '1px solid rgba(46, 212, 122, 0.2)', padding: '8px 10px', borderRadius: '8px', fontSize: 11, color: 'var(--money-green)', fontFamily: 'var(--font-mono)' }}>
            User saves $8.00 in MEV → Pays only $0.04 fee (99.5% net savings).
          </div>
        </div>

        {/* Pillar 2 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Fuel size={16} style={{ color: 'var(--flare-blue)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--flare-blue)' }}>2. Keeper Gas Replenishment</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            50% of the protection fee automatically flows into the <code>AegisKeeperGasPool</code>, continuously refilling the TEE PMW signer with native FLR.
          </p>
          <div style={{ background: 'rgba(96, 165, 250, 0.06)', border: '1px solid rgba(96, 165, 250, 0.2)', padding: '8px 10px', borderRadius: '8px', fontSize: 11, color: 'var(--flare-blue)', fontFamily: 'var(--font-mono)' }}>
            Gas cost per tx is &lt;$0.0003 → 1 rescue funds 130+ keeper gas cycles.
          </div>
        </div>

        {/* Pillar 3 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Building2 size={16} style={{ color: 'var(--tech-purple)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tech-purple)' }}>3. Institutional Streaming SLA</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
            Enterprise lending desks and DAO treasuries managing large multi-million collateral positions subscribe to dedicated hardware TEE enclaves via micro-streamed SLA.
          </p>
          <div style={{ background: 'rgba(155, 127, 255, 0.06)', border: '1px solid rgba(155, 127, 255, 0.2)', padding: '8px 10px', borderRadius: '8px', fontSize: 11, color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)' }}>
            Dedicated confidential enclave compute SLA.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
