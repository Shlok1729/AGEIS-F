import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';

export default function TerminalProofBlock() {
  const [activeTab, setActiveTab] = useState('confidential');
  const [copied, setCopied] = useState(false);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const publicTrace = `// 1. MEV Searcher Mempool Sniffer (Block 42890)
> MEMPOOL_MONITOR: Pending health factor query detected
> Target: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (Kinetic Market)
> Collateral: 1,000 FLR @ $0.02450 | Debt: $20.00 USD
> Health Factor: 0.9840 (BREACHED LIQUIDATION FLOOR 1.0000)

// 2. Predatory Front-Run Execution
> DISPATCH: Liquidator.liquidateBorrow(borrower, repayAmount: 10.00 USD)
> Priority Fee: +120 Gwei (Mempool sandwich priority)
> TX HASH: 0x8a9f2c10b771e4293f0a7d558b991c490214a1e94471...
> STATUS: CONFIRMED (Block 42891)

// 3. Loss Outcome
! LIQUIDATION_PENALTY: -80 FLR ($8.00 USD / 8.0% Liquidation Bonus seized)
! BORROWER_STATUS: Collateral liquidated at extreme distress.`;

  const confidentialTrace = `// 1. Flare Confidential Compute Enclave (Hardware AMD SEV-SNP)
> [FCC-TEE] FTSOv2 Price Ingestion: FLR/USD = $0.02480 (Latency: 320ms)
> [FCC-TEE] Evaluating Private Health Factor Engine in Enclave Memory...
> [FCC-TEE] Health Factor: 1.0540 <= Threshold: 1.1500 [TRIGGER BREACHED]
> [FCC-TEE] Dynamic Repayment Formula: ΔD = (D*HF_target - C*P*CF)/(HF_target - 1)
> [FCC-TEE] Required Debt Relief: $5.40 USD -> Restores Position to 1.3000 HF

// 2. Autonomous PMW Execution (Zero Public Mempool Warning)
> [TEE-SIGNER] PMW ECDSA Signature created inside Enclave RAM
> [CALL] AegisVault.executeProtection(borrower, positionContract, repayAmount: $5.40)
> TX HASH: 0x416dbc9abc289b58701e8543e6c54a3a7634bb3c4481...
> STATUS: CONFIRMED ON COSTON2 (Block 42891)

// 3. Protection Result
* HEALTH_FACTOR_RESTORED: 1.3000 HF (Safe Buffer)
* MEV_PREDATORS_DETECTED: 0 pending transactions seen in mempool
* CAPITAL_SAVED: +$8.00 USD (Avoided 8% liquidation penalty)
* GAS_COST: $0.00028 USD (145k gas @ 25 Gwei on Flare)`;

  const currentCode = activeTab === 'confidential' ? confidentialTrace : publicTrace;

  return (
    <div className="terminal-window" style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Header Chrome */}
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="terminal-dots">
            <span className="terminal-dot terminal-dot--red" />
            <span className="terminal-dot terminal-dot--yellow" />
            <span className="terminal-dot terminal-dot--green" />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            execution-proof-trace.log
          </span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => setActiveTab('confidential')}
            style={{
              background: activeTab === 'confidential' ? 'var(--tech-purple-glow)' : 'transparent',
              border: `1px solid ${activeTab === 'confidential' ? 'var(--tech-purple-border)' : 'transparent'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: 11,
              color: activeTab === 'confidential' ? 'var(--tech-purple)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ShieldCheck size={12} />
            <span>Aegis-F (Confidential TEE)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('public')}
            style={{
              background: activeTab === 'public' ? 'var(--risk-red-glow)' : 'transparent',
              border: `1px solid ${activeTab === 'public' ? 'var(--risk-red-border)' : 'transparent'}`,
              borderRadius: '6px',
              padding: '3px 10px',
              fontSize: 11,
              color: activeTab === 'public' ? 'var(--risk-red)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <ShieldAlert size={12} />
            <span>Public Mempool (Vulnerable)</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopy(currentCode)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: 11,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
            title="Copy trace log"
          >
            {copied ? <Check size={12} style={{ color: 'var(--money-green)' }} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="terminal-body"
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {currentCode.split('\n').map((line, idx) => {
              let color = 'var(--text-secondary)';
              if (line.startsWith('!')) color = 'var(--risk-red)';
              else if (line.startsWith('*')) color = 'var(--money-green)';
              else if (line.startsWith('> [FCC-TEE]')) color = 'var(--tech-purple)';
              else if (line.startsWith('> [TEE-SIGNER]')) color = 'var(--flare-blue)';
              else if (line.startsWith('//')) color = 'var(--text-muted)';

              return (
                <div key={idx} style={{ color, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {line}
                </div>
              );
            })}
          </pre>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
