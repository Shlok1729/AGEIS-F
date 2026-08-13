import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ExternalLink, ShieldCheck, Activity } from 'lucide-react';
import MevSavingsCard from '../components/MevSavingsCard';

export default function EventLog({ logs = [], mevSavings, onReset, onBackToMonitor }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ marginBottom: 24 }}
    >
      {/* Payoff Card if triggered */}
      {mevSavings && (
        <div style={{ marginBottom: 20 }}>
          <MevSavingsCard
            debtUsdAtTrigger={mevSavings.debtUsdAtTrigger}
            repaidUsd={mevSavings.repaidUsd}
            visible={true}
          />
        </div>
      )}

      {/* Terminal Log Panel with 3-dot window chrome */}
      <div className="terminal-window">
        <div className="terminal-header" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="terminal-dots">
              <span className="terminal-dot terminal-dot--red" />
              <span className="terminal-dot terminal-dot--yellow" />
              <span className="terminal-dot terminal-dot--green" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={13} style={{ color: 'var(--tech-purple)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                Enclave Execution & Settlement Audit Trail
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge--neutral" style={{ fontSize: 9 }}>
              FCC MODE=0 (Simulated Enclave)
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {logs.length} events
            </span>
          </div>
        </div>

        <div
          ref={containerRef}
          style={{
            padding: '18px 20px',
            background: '#09090E',
            minHeight: 220,
            maxHeight: 340,
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          <AnimatePresence initial={false}>
            {logs.map((log) => {
              let textColor = 'var(--text-secondary)';
              if (log.type === 'trigger' || log.type === 'warn') textColor = 'var(--risk-red)';
              else if (log.type === 'success' || log.type === 'check') textColor = 'var(--money-green)';
              else if (log.type === 'tee') textColor = 'var(--tech-purple)';
              else if (log.type === 'price') textColor = 'var(--flare-blue)';

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}
                >
                  <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>
                    [{log.time}]
                  </span>
                  <span style={{ color: 'var(--tech-purple)', userSelect: 'none', fontWeight: 600 }}>
                    {log.prefix || '>'}
                  </span>
                  <span style={{ color: textColor }}>{log.text}</span>
                  {log.txHash && (
                    <a
                      href={`https://coston2-explorer.flare.network/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn--surface"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '1px 7px',
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--flare-blue)',
                        textDecoration: 'none',
                        marginLeft: 6,
                      }}
                      title="View transaction on Flare Coston2 explorer"
                    >
                      <span>tx: {log.txHash.slice(0, 14)}…</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
        {onBackToMonitor && (
          <button
            type="button"
            className="btn btn--surface"
            onClick={onBackToMonitor}
            style={{ fontSize: 12 }}
          >
            <span>Return to monitor</span>
          </button>
        )}
        {onReset && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onReset}
            style={{ fontSize: 12, marginLeft: 'auto' }}
          >
            <span>Run another simulation</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
