import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

import LandingHero          from './sections/LandingHero';
import PositionSetupPanel   from './sections/PositionSetupPanel';
import LiveMonitorDashboard from './sections/LiveMonitorDashboard';
import EventLog             from './sections/EventLog';
import ArchitectureStrip    from './sections/ArchitectureStrip';
import CountUp              from './components/CountUp';
import KeeperStatusPanel    from './components/KeeperStatusPanel';
import { simulatePriceOnKeeper, registerTriggerOnKeeper } from './services/keeperApi';

// ─── Utilities ─────────────────────────────────────────────────────────────

const now = () => new Date().toTimeString().slice(0, 8) + '.' + String(Date.now() % 1000).padStart(3, '0');

let logId = 1;
const mkLog = (text, type = 'info', extra = {}) => ({
  id: logId++,
  time: now(),
  text,
  type,
  prefix: '>',
  ...extra,
});

// ─── App ───────────────────────────────────────────────────────────────────

export default function App() {
  // ── View state ──
  const [view, setView] = useState('landing'); // 'landing' | 'demo'
  const demoRef = useRef(null);

  // ── Market state ──
  const [flrPrice,       setFlrPrice]       = useState(0.035);
  const [lastTick,       setLastTick]       = useState(Date.now());
  const [isSimAttacking, setIsSimAttacking] = useState(false);

  // ── Position / TEE config ──
  const [config, setConfig] = useState({
    collateralFlr: 1000,
    debtUsd:       20,
    thresholdHf:   1.15,
    repayUsd:      8,
  });
  const [teeArmed,        setTeeArmed]       = useState(false);
  const [vaultReserveUsd, setVaultReserveUsd] = useState(10);
  // Priority 2: MEV savings — captured at trigger moment
  const [mevSavings,      setMevSavings]      = useState(null);

  // ── Event log ──
  const [logs, setLogs] = useState([
    mkLog('Aegis-F frontend initialized. Connect to tee-proxy on :6662.', 'info'),
    mkLog('FTSOv2 price poller active — feed 0x01464c522f555344 (FLR/USD)', 'price'),
  ]);

  // Tick counter — only log every 5th price tick to avoid log spam
  const tickCountRef = useRef(0);

  const addLog = useCallback((text, type, extra) => {
    setLogs(prev => [...prev, mkLog(text, type, extra)]);
  }, []);

  // ── Derived math ──
  const collateralUsd   = config.collateralFlr * flrPrice;
  const liqThreshold    = collateralUsd * 0.85;
  const healthFactor    = config.debtUsd > 0 ? liqThreshold / config.debtUsd : Infinity;

  // ── FTSOv2 tick simulation (~1.8s organic jitter) ──
  // Only logs every 5th tick to prevent flooding the event log
  useEffect(() => {
    const iv = setInterval(() => {
      if (isSimAttacking) return;
      const jitter = (Math.random() - 0.5) * 0.0006;
      setFlrPrice(p => {
        const next = Math.max(0.010, +(p + jitter).toFixed(5));
        tickCountRef.current += 1;
        if (tickCountRef.current % 5 === 0) {
          // Deferred to avoid setState-inside-setState
          setTimeout(() => {
            setLogs(prev => [
              ...prev,
              mkLog(
                `FTSOv2 tick: FLR/USD = $${next.toFixed(5)}`,
                'price'
              ),
            ]);
          }, 0);
        }
        return next;
      });
      setLastTick(Date.now());
    }, 1800);
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSimAttacking]);

  // ── TEE trigger execution loop ──
  useEffect(() => {
    if (!teeArmed) return;
    if (!isFinite(healthFactor)) return;
    if (healthFactor > config.thresholdHf) return;
    if (config.debtUsd <= 0) return;

    // Threshold breached — fire in ~400ms
    const t = setTimeout(() => {
      const actualRepay = Math.min(config.debtUsd, config.repayUsd);
      const newDebt     = config.debtUsd - actualRepay;
      const newReserve  = Math.max(0, vaultReserveUsd - actualRepay);
      const txHash      = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setConfig(c => ({ ...c, debtUsd: newDebt }));
      setVaultReserveUsd(newReserve);
      setTeeArmed(false); // disarm after execution

      // Priority 2: Capture MEV savings at trigger moment
      setMevSavings({ debtUsdAtTrigger: config.debtUsd, repaidUsd: actualRepay });

      addLog(`[TEE] HF threshold breached: ${healthFactor.toFixed(4)} ≤ ${config.thresholdHf.toFixed(2)}`, 'trigger');
      addLog(`[TEE] Signing executeProtection() via enclave-isolated PMW signer — repay $${actualRepay} USD`, 'tee');
      addLog(
        `[TEE] ✅ Repayment confirmed. New debt: $${newDebt.toFixed(2)}. New HF: ${newDebt > 0 ? (liqThreshold / newDebt).toFixed(4) : '∞'}`,
        'success',
        { txHash }
      );
      addLog(`[TEE] Public liquidators saw 0 pending transactions. MEV preempted.`, 'success');
      addLog(`[TEE] 🛡️ MEV savings: ~$${(config.debtUsd * 0.50 * 0.08).toFixed(4)} USD bonus avoided (est. 50% close factor × 8% liq incentive benchmark)`, 'success');

      // Confetti!
      try {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 }, colors: ['#a6e3a1', '#cba6f7', '#89b4fa', '#fab387'] });
      } catch (_) {}
    }, 380);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthFactor, teeArmed]);

  // ── Handlers ──
  const handleConfigChange = useCallback((field, value) => {
    setConfig(c => ({ ...c, [field]: value }));
  }, []);

  const handleRegister = useCallback(async () => {
    setTeeArmed(true);
    addLog(`[TEE] Trigger registered. Threshold = HF ≤ ${config.thresholdHf.toFixed(2)} (ENCRYPTED)`, 'tee');
    addLog(`[TEE] AegisVault reserve: $${vaultReserveUsd.toFixed(2)} USD. Auto-repay: $${config.repayUsd.toFixed(2)} USD`, 'tee');
    addLog(`[TEE] PMW wallet armed. Scanning FTSOv2 ticks…`, 'tee');

    // Also register on the real Go keeper if it's running
    const result = await registerTriggerOnKeeper({
      thresholdHf: config.thresholdHf,
      repayUsd:    config.repayUsd,
    });
    if (result.online !== false && result.triggerId) {
      addLog(`[TEE] 🔐 Real keeper confirmed trigger: ${result.triggerId}`, 'tee');
    }
  }, [config, vaultReserveUsd, addLog]);

  const handleSimulateDrop = useCallback(async (price) => {
    setIsSimAttacking(true);
    setFlrPrice(price);
    setLastTick(Date.now());
    addLog(`[SIM] Price override: FLR/USD = $${price.toFixed(5)}`, 'warn');
    setTimeout(() => setIsSimAttacking(false), 2000);

    // Also push price to real Go keeper if it's running — triggers its loop
    const result = await simulatePriceOnKeeper(price);
    if (result.online !== false) {
      addLog(`[SIM] 📡 Live keeper notified: newPrice=$${price.toFixed(5)}`, 'check');
    }
  }, [addLog]);

  // Callback: live price sync from Go keeper polling
  const handleLivePriceUpdate = useCallback((price) => {
    if (!isSimAttacking) {
      setFlrPrice(price);
      setLastTick(Date.now());
    }
  }, [isSimAttacking]);

  const handleReset = useCallback(() => {
    setFlrPrice(0.035);
    setIsSimAttacking(false);
    setConfig({ collateralFlr: 1000, debtUsd: 20, thresholdHf: 1.15, repayUsd: 8 });
    setVaultReserveUsd(10);
    setTeeArmed(false);
    setMevSavings(null);
    setLastTick(Date.now());
    addLog('[SYS] State reset to baseline. HF = 1.4875', 'info');
  }, [addLog]);

  const handleEnterDemo = () => {
    setView('demo');
    setTimeout(() => demoRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  // ── Top nav ──
  const NavBar = () => (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(17, 17, 27, 0.88)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-dim)',
      padding: '0 32px',
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: 'var(--mauve)', letterSpacing: '-0.01em' }}>
          AEGIS-F
        </span>
        <span className="badge badge--dim" style={{ fontSize: 9 }}>v0.1.0-hackathon</span>
      </div>

      {/* Center — live FLR/USD ticker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
        <span
          className="pulse"
          style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: 'var(--blue)', color: 'var(--blue)',
          }}
        />
        <span style={{ color: 'var(--overlay1)' }}>FLR/USD</span>
        <span style={{ color: 'var(--blue)', fontWeight: 700 }}>
          $<CountUp to={flrPrice} decimals={5} />
        </span>
        <span style={{ color: 'var(--surface2)' }}>·</span>
        <span style={{ color: 'var(--overlay0)', fontSize: 11 }}>Coston2 · FCC MODE=0</span>
      </div>

      {/* Right — status badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className={`badge ${teeArmed ? 'badge--mauve' : 'badge--dim'}`}>
          {teeArmed ? '🔐 TEE ARMED' : '⏸ TEE STANDBY'}
        </span>
        {view === 'landing' && (
          <button className="btn btn--mauve" onClick={handleEnterDemo} style={{ fontSize: 11, padding: '5px 14px' }}>
            ▶ Open Demo
          </button>
        )}
        {view === 'demo' && (
          <button className="btn btn--surface" onClick={() => setView('landing')} style={{ fontSize: 11, padding: '5px 14px' }}>
            ← Back
          </button>
        )}
      </div>
    </header>
  );

  // ── Render ──
  return (
    <>
      <NavBar />

      <main style={{ maxWidth: 1260, margin: '0 auto', padding: '0 32px 64px' }}>

        {/* ── LANDING ── */}
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LandingHero onEnterDemo={handleEnterDemo} />

              {/* Teaser strip on landing */}
              <ArchitectureStrip />

              <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 32, marginTop: 16 }}>
                <div className="section-label" style={{ marginBottom: 16 }}>
                  Live Demo Preview
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, opacity: 0.7, pointerEvents: 'none', filter: 'blur(1px)' }}>
                  <div className="panel" style={{ padding: 20, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--overlay0)' }}>
                    Live Position Monitor →
                  </div>
                  <div className="panel" style={{ padding: 20, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--overlay0)' }}>
                    TEE Execution Log →
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button className="btn btn--mauve" onClick={handleEnterDemo} style={{ fontSize: 13, padding: '10px 28px' }}>
                    ▶ Enter Live Demo
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DEMO ── */}
          {view === 'demo' && (
            <motion.div
              key="demo"
              ref={demoRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ paddingTop: 32 }}
            >
              {/* Demo header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Live Demo — Coston2 Testnet</div>
                  <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    Position Monitor <span style={{ color: 'var(--mauve)' }}>+</span> TEE Keeper
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    className="btn btn--red"
                    onClick={() => handleSimulateDrop(0.027)}
                    style={{ fontSize: 11 }}
                  >
                    🔻 Drop → $0.027 (TEE fires)
                  </button>
                  <button className="btn btn--surface" onClick={handleReset} style={{ fontSize: 11 }}>
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* 0. Keeper live status — polls /api/info every 3s */}
              <KeeperStatusPanel onLivePriceUpdate={handleLivePriceUpdate} />

              {/* 1. Position Setup */}
              <div className="section-label" style={{ marginBottom: 12 }}>
                01 / Position Setup
              </div>
              <PositionSetupPanel
                config={config}
                onChange={handleConfigChange}
                onRegister={handleRegister}
              />

              {/* 2. Live Monitor */}
              <div className="section-label" style={{ marginBottom: 12 }}>
                02 / Live Monitor
              </div>
              <LiveMonitorDashboard
                flrPrice={flrPrice}
                healthFactor={isFinite(healthFactor) ? healthFactor : 99}
                thresholdHf={config.thresholdHf}
                collateralFlr={config.collateralFlr}
                debtUsd={config.debtUsd}
                vaultReserveUsd={vaultReserveUsd}
                teeArmed={teeArmed}
                lastTick={lastTick}
                onSimulateDrop={handleSimulateDrop}
                onReset={handleReset}
              />

              {/* 3. Event Log */}
              <div className="section-label" style={{ marginBottom: 12 }}>
                03 / Execution Log
              </div>
              <EventLog logs={logs} mevSavings={mevSavings} />

              {/* 4. Architecture */}
              <div className="section-label" style={{ marginBottom: 12 }}>
                04 / Architecture
              </div>
              <ArchitectureStrip />

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
