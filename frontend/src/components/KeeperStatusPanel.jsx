import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchKeeperInfo, fetchKeeperLogs } from '../services/keeperApi';

/**
 * KeeperStatusPanel — Live backend integration panel.
 *
 * Polls the Go tee-proxy at /api/info and /api/logs every 3 seconds.
 * When the keeper is online, shows real enclave data (PMW address, price,
 * active triggers, recent log lines from the Go process).
 * When offline, shows a graceful "simulation mode" fallback.
 */
export default function KeeperStatusPanel({ onLivePriceUpdate }) {
  const [keeperInfo, setKeeperInfo]   = useState(null);
  const [keeperLogs, setKeeperLogs]   = useState([]);
  const [online,     setOnline]       = useState(false);
  const [lastPoll,   setLastPoll]     = useState(null);
  const [expanded,   setExpanded]     = useState(false);

  const poll = useCallback(async () => {
    const [info, logs] = await Promise.all([fetchKeeperInfo(), fetchKeeperLogs()]);

    if (info.online) {
      setKeeperInfo(info);
      setOnline(true);
      setLastPoll(Date.now());

      // Surface live FLR price to parent if available
      const price = parseFloat(info.LatestPriceUSD);
      if (!isNaN(price) && price > 0 && onLivePriceUpdate) {
        onLivePriceUpdate(price);
      }
    } else {
      setOnline(false);
    }

    if (logs.online && logs.logs?.length > 0) {
      setKeeperLogs(logs.logs.slice(-20)); // keep last 20 lines
    }
  }, [onLivePriceUpdate]);

  // Poll every 3 seconds
  useEffect(() => {
    poll(); // immediate first poll
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [poll]);

  const secondsAgo = lastPoll ? Math.round((Date.now() - lastPoll) / 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        border: `1px solid ${online ? 'rgba(166,227,161,0.3)' : 'var(--border-dim)'}`,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
        background: online ? 'rgba(166,227,161,0.03)' : 'transparent',
        transition: 'border-color 0.3s, background 0.3s',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px',
          background: 'var(--mantle)',
          borderBottom: '1px solid var(--border-dim)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Status dot */}
        <span
          className={online ? 'pulse' : ''}
          style={{
            display: 'inline-block',
            width: 8, height: 8,
            borderRadius: '50%',
            background: online ? 'var(--green)' : 'var(--surface2)',
            color: online ? 'var(--green)' : 'var(--surface2)',
            flexShrink: 0,
          }}
        />

        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: online ? 'var(--green)' : 'var(--overlay0)' }}>
          Go Keeper {online ? '— Online' : '— Offline (simulation mode)'}
        </span>

        <span style={{ flex: 1 }} />

        {online && keeperInfo && (
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>
            FLR/USD ${parseFloat(keeperInfo.LatestPriceUSD || 0).toFixed(5)}
          </span>
        )}

        {secondsAgo !== null && online && (
          <span style={{ fontSize: 10, color: 'var(--overlay0)', marginLeft: 8 }}>
            polled {secondsAgo}s ago
          </span>
        )}

        <span style={{ fontSize: 10, color: 'var(--overlay0)', marginLeft: 10 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 18px' }}>
              {online && keeperInfo ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Left: Enclave facts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <FactRow label="Enclave ID"       value={keeperInfo.EnclaveID || '—'} />
                    <FactRow label="Mode"             value={keeperInfo.Mode || '—'}      />
                    <FactRow label="Status"           value={keeperInfo.Status || '—'}     accent="var(--green)" />
                    <FactRow label="PMW Address"      value={keeperInfo.KeeperAddress ? `${keeperInfo.KeeperAddress.slice(0, 10)}…${keeperInfo.KeeperAddress.slice(-6)}` : '—'} accent="var(--mauve)" />
                    <FactRow label="FTSOv2 Feed ID"   value={keeperInfo.FtsoFeedID ? `${keeperInfo.FtsoFeedID.slice(0, 14)}…` : '—'} />
                    <FactRow label="Live FLR/USD"     value={`$${parseFloat(keeperInfo.LatestPriceUSD || 0).toFixed(5)}`} accent="var(--blue)" />
                    <FactRow label="Active Triggers"  value={String(keeperInfo.ActiveTriggers ?? 0)} accent={keeperInfo.ActiveTriggers > 0 ? 'var(--mauve)' : 'var(--overlay1)'} />
                  </div>

                  {/* Right: Keeper log tail */}
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--overlay0)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Keeper log tail (Go process)
                    </div>
                    <div style={{
                      background: 'var(--crust)',
                      padding: '10px 12px',
                      borderRadius: 2,
                      maxHeight: 160,
                      overflowY: 'auto',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--subtext0)',
                    }}>
                      {keeperLogs.length > 0
                        ? keeperLogs.map((line, i) => (
                          <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: 3, marginBottom: 3, lineHeight: 1.5 }}>
                            {line}
                          </div>
                        ))
                        : <span style={{ color: 'var(--surface2)' }}>No logs yet…</span>
                      }
                    </div>
                  </div>
                </div>
              ) : (
                /* Offline state */
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--overlay0)', fontSize: 12 }}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>⏸</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Go keeper not running</div>
                  <div style={{ fontSize: 11, color: 'var(--surface2)' }}>
                    Start it with: <code style={{ color: 'var(--mauve)', background: 'var(--mantle)', padding: '1px 6px', borderRadius: 2 }}>cd fce-keeper && ./aegis-keeper</code>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--surface2)', marginTop: 6 }}>
                    Frontend simulation mode is active — all data above is simulated.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FactRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, borderBottom: '1px solid var(--border-dim)', paddingBottom: 6 }}>
      <span style={{ color: 'var(--overlay1)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: accent || 'var(--text)' }}>{value}</span>
    </div>
  );
}
