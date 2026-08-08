import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MevSavingsCard from '../components/MevSavingsCard';

/**
 * EventLog – Section 4
 * Terminal-style scrolling log of all events. The "payoff" panel.
 * Auto-scroll is scoped to the container div only — does NOT scroll the page.
 *
 * Priority 2 integration: MevSavingsCard appears below the log the moment
 * the TEE trigger fires — it's the visual payoff of the demo.
 *
 * Priority 3 (TEE attestation): Documented gap below — not faked.
 */
export default function EventLog({ logs, mevSavings }) {
  const containerRef = useRef(null);

  // Scroll only the log container, not the whole page
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs.length]);

  const hasTriggered = mevSavings != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="panel"
      style={{ marginBottom: 24, border: '1px solid var(--border-surface)' }}
    >
      <div className="panel-titlebar">
        <span className="dot" style={{ background: 'var(--green)' }} />
        <span>Execution Log</span>
        <span style={{ flex: 1 }} />

        {/* Priority 3: TEE Attestation — documented gap, not faked */}
        <span
          title="Attestation: In FCC production deployments, AMD SEV-SNP attestation records are published on-chain via GCP Confidential Space. In this demo (MODE=0), full hardware attestation is not active — labeled accurately as simulated."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 10,
            color: 'var(--overlay0)',
            cursor: 'help',
            borderBottom: '1px dashed var(--surface2)',
            paddingBottom: 1,
            marginRight: 12,
          }}
        >
          🔍 TEE Attestation: MODE=0 (simulated — hover for production note)
        </span>

        <span style={{ color: 'var(--overlay0)', fontSize: 10 }}>
          {logs.length} events ·{' '}
          <span
            className="cursor"
            style={{
              display: 'inline-block', width: 6, height: 10,
              background: 'var(--green)',
              animation: 'blink 1.1s step-end infinite',
              verticalAlign: 'middle', marginLeft: 2,
            }}
          />
        </span>
      </div>

      <div
        style={{
          padding: '14px 18px',
          background: 'var(--crust)',
          minHeight: 200,
          maxHeight: 280,
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
        ref={containerRef}
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`terminal-line terminal-line--${log.type}`}
            >
              <span style={{ color: 'var(--surface2)', marginRight: 10, userSelect: 'none' }}>
                [{log.time}]
              </span>
              <span style={{ color: 'var(--overlay1)', marginRight: 8, userSelect: 'none' }}>
                {log.prefix || '>'}
              </span>
              <span>{log.text}</span>
              {log.txHash && (
                <a
                  href={`https://coston2-explorer.flare.network/tx/${log.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 10, color: 'var(--blue)', fontWeight: 600, textDecoration: 'none' }}
                  title="View on Coston2 explorer (simulated tx in demo)"
                >
                  tx: {log.txHash.slice(0, 18)}… ↗
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div style={{ color: 'var(--surface2)', padding: '20px 0', textAlign: 'center' }}>
            Waiting for events…
            <span
              className="cursor"
              style={{
                display: 'inline-block', width: 7, height: 13,
                background: 'var(--surface2)',
                animation: 'blink 1.1s step-end infinite',
                verticalAlign: 'middle', marginLeft: 3,
              }}
            />
          </div>
        )}
      </div>

      {/* ── Priority 2: MEV Savings Card — appears the moment trigger fires ── */}
      {mevSavings && (
        <div style={{ padding: '0 16px 16px' }}>
          <MevSavingsCard
            debtUsdAtTrigger={mevSavings.debtUsdAtTrigger}
            repaidUsd={mevSavings.repaidUsd}
            visible={hasTriggered}
          />
        </div>
      )}
    </motion.div>
  );
}
