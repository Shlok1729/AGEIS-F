import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import CountUp from '../components/CountUp';
import FeedStrip from '../components/FeedStrip';

/**
 * LiveMonitorDashboard – Section 3
 * The centrepiece: live FTSOv2 price, TEE-view of HF, status + threshold bar.
 */
export default function LiveMonitorDashboard({
  flrPrice,
  healthFactor,
  thresholdHf,
  collateralFlr,
  debtUsd,
  vaultReserveUsd,
  teeArmed,
  lastTick,
  onSimulateDrop,
  onReset,
}) {
  const [teeView, setTeeView] = useState(true); // toggle TEE view

  const priceRef = useRef(null);
  const hfRef    = useRef(null);

  // Pulse price display on tick
  useEffect(() => {
    if (!priceRef.current) return;
    gsap.fromTo(priceRef.current,
      { color: '#89b4fa', scale: 1.06 },
      { color: '#cdd6f4', scale: 1, duration: 0.45, ease: 'power2.out' }
    );
  }, [flrPrice]);

  // Pulse HF on change
  useEffect(() => {
    if (!hfRef.current) return;
    gsap.fromTo(hfRef.current,
      { scale: 1.04 },
      { scale: 1, duration: 0.35, ease: 'power2.out' }
    );
  }, [healthFactor]);

  const collateralUsd    = collateralFlr * flrPrice;
  const liqThresholdUsd  = collateralUsd * 0.85;
  const isLiquidatable   = healthFactor < 1.0 && debtUsd > 0;
  const isTeeZone        = healthFactor <= thresholdHf && debtUsd > 0;

  // Derive status
  let status, statusClass, statusIcon;
  if (isLiquidatable)    { status = 'LIQUIDATABLE';  statusClass = 'badge--red';   statusIcon = '🔴'; }
  else if (isTeeZone)    { status = 'TEE TRIGGERED'; statusClass = 'badge--peach'; statusIcon = '🟠'; }
  else if (healthFactor < 1.5) { status = 'AT RISK'; statusClass = 'badge--peach'; statusIcon = '🟡'; }
  else                   { status = 'HEALTHY';       statusClass = 'badge--green'; statusIcon = '🟢'; }

  const hfBarWidth    = Math.min(100, Math.max(0, (healthFactor / 2.5) * 100));
  const threshBarLeft = Math.min(100, (thresholdHf / 2.5) * 100);
  const hfColor       = isLiquidatable ? 'var(--red)' : isTeeZone ? 'var(--peach)' : healthFactor < 1.5 ? 'var(--yellow)' : 'var(--green)';

  const secondsAgo = lastTick ? Math.round((Date.now() - lastTick) / 1000) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ marginBottom: 24 }}
    >
      {/* ── Priority 1: Multi-feed FTSOv2 strip ── */}
      <FeedStrip flrPriceOverride={flrPrice} lastTick={lastTick} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* ── Price Feed Panel (PUBLIC) ── */}
        <div className="panel" style={{ background: 'rgba(137, 180, 250, 0.04)', border: '1px solid rgba(137,180,250,0.2)' }}>
          <div className="panel-titlebar">
            <span className="dot" style={{ background: 'var(--blue)' }} />
            <span style={{ color: 'var(--blue)' }}>FTSOv2 Price Feed</span>
            <span style={{ flex: 1 }} />
            <span className="badge badge--blue">PUBLIC / ON-CHAIN</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--overlay1)', marginBottom: 6, letterSpacing: '0.08em' }}>
              FEED: FLR/USD · COSTON2
            </div>
            <div ref={priceRef} style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              marginBottom: 6,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}>
              <span style={{ fontSize: 18, color: 'var(--overlay1)' }}>$</span>
              <CountUp to={flrPrice} decimals={5} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--overlay1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                className="pulse"
                style={{
                  display: 'inline-block', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--blue)',
                  color: 'var(--blue)',
                }}
              />
              <span>Last tick: {secondsAgo !== null ? `${secondsAgo}s ago` : '—'} · ~1.8s cadence</span>
            </div>

            {/* Price Slider for simulation */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--overlay0)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Simulate Price
              </div>
              <input
                type="range"
                min="0.010"
                max="0.050"
                step="0.001"
                value={flrPrice}
                onChange={e => onSimulateDrop(Number(e.target.value))}
                style={{ marginBottom: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--overlay0)' }}>
                <span style={{ color: 'var(--red)' }}>$0.010 crash</span>
                <span style={{ color: 'var(--green)' }}>$0.050 safe</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn--red" style={{ flex: 1, fontSize: 11 }} onClick={() => onSimulateDrop(0.027)}>
                Drop → $0.027 (TEE fires)
              </button>
              <button className="btn btn--surface" style={{ fontSize: 11 }} onClick={onReset} title="Reset">
                ↺
              </button>
            </div>
          </div>
        </div>

        {/* ── Health Factor Panel (TEE VIEW) ── */}
        <div
          className={`panel ${isLiquidatable ? 'panel--red' : isTeeZone ? 'panel--peach' : 'panel--mauve'}`}
          style={{ background: 'rgba(203,166,247,0.04)' }}
        >
          <div className="panel-titlebar">
            <span className="dot" style={{ background: 'var(--mauve)' }} />
            <span style={{ color: 'var(--mauve)' }}>Health Factor</span>
            <span style={{ flex: 1 }} />
            <button
              onClick={() => setTeeView(v => !v)}
              className="badge badge--mauve"
              style={{ cursor: 'pointer', border: 'none', padding: '2px 8px' }}
              title="Toggle TEE view"
            >
              {teeView ? '👁 TEE VIEW' : '🚫 REDACTED'}
            </button>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--overlay1)', marginBottom: 6, letterSpacing: '0.08em' }}>
              KINETIC PROTOCOL · LIQ THRESHOLD = 85%
            </div>

            {/* Big HF number */}
            <AnimatePresence mode="wait">
              {teeView ? (
                <motion.div
                  key="tee-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={hfRef}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 34,
                    fontWeight: 800,
                    color: hfColor,
                    letterSpacing: '-0.02em',
                    marginBottom: 6,
                  }}
                >
                  {debtUsd === 0 ? '∞' : <CountUp to={healthFactor} decimals={4} />}
                </motion.div>
              ) : (
                <motion.div
                  key="redacted"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 34,
                    fontWeight: 800,
                    color: 'var(--surface2)',
                    letterSpacing: '0.1em',
                    marginBottom: 6,
                  }}
                >
                  ██████
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom: 8 }}>
              <span className={`badge ${statusClass}`}>
                {statusIcon} {status}
              </span>
            </div>

            {/* Threshold visualization */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--overlay0)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Position vs. Threshold
              </div>
              <div className="hf-bar-track" style={{ position: 'relative' }}>
                <div className="hf-bar-fill" style={{ width: `${hfBarWidth}%`, background: hfColor }} />
                {/* Threshold line */}
                <div style={{
                  position: 'absolute',
                  left: `${threshBarLeft}%`,
                  top: -5, bottom: -5,
                  width: 2,
                  background: 'var(--mauve)',
                  borderRadius: 1,
                  zIndex: 2,
                }} />
                {/* Liquidation line at 1.0 */}
                <div style={{
                  position: 'absolute',
                  left: `${(1.0 / 2.5) * 100}%`,
                  top: -3, bottom: -3,
                  width: 1,
                  background: 'var(--red)',
                  opacity: 0.6,
                  zIndex: 2,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--overlay0)', marginTop: 5 }}>
                <span style={{ color: 'var(--red)' }}>0.0</span>
                <span style={{ color: 'var(--red)' }}>1.0 liq.</span>
                <span style={{ color: 'var(--mauve)' }}>▲ {thresholdHf.toFixed(2)} TEE</span>
                <span style={{ color: 'var(--green)' }}>2.5 safe</span>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--overlay1)' }}>
              <div>Collateral: <span style={{ color: 'var(--text)' }}>${collateralUsd.toFixed(2)}</span></div>
              <div>Liq. Threshold: <span style={{ color: 'var(--text)' }}>${liqThresholdUsd.toFixed(2)}</span></div>
              <div>Debt: <span style={{ color: debtUsd > 0 ? 'var(--peach)' : 'var(--green)' }}>${debtUsd.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* ── Keeper Status Panel ── */}
        <div className="panel" style={{ border: '1px solid var(--border-surface)' }}>
          <div className="panel-titlebar">
            <span className="dot" style={{ background: teeArmed ? 'var(--green)' : 'var(--overlay1)' }} />
            <span>Keeper Status</span>
            <span style={{ flex: 1 }} />
            <span className={`badge ${teeArmed ? 'badge--green' : 'badge--dim'}`}>
              {teeArmed ? 'ARMED' : 'STANDBY'}
            </span>
          </div>
          <div style={{ padding: '18px 20px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <StatusRow label="FCC Mode" value="MODE=0 (Simulation)" accent="var(--mauve)" />
              <StatusRow label="Enclave" value="tee-proxy :6662" accent="var(--mauve)" />
              <StatusRow label="PMW Wallet" value="0x7099…79C8" accent="var(--mauve)" />
              <StatusRow label="Reaction Time" value="~400ms" accent="var(--green)" />
              <StatusRow label="FTSOv2 Feed" value="FLR/USD · 0x01464c…" accent="var(--blue)" />
              <StatusRow
                label="Vault Reserve"
                value={`$${vaultReserveUsd.toFixed(2)} USD`}
                accent={vaultReserveUsd > 0 ? 'var(--green)' : 'var(--red)'}
              />
              <StatusRow
                label="TEE Threshold"
                value={`HF ≤ ${thresholdHf.toFixed(2)}`}
                accent="var(--mauve)"
                private
              />
            </div>

            <div style={{
              marginTop: 16,
              padding: '10px 12px',
              background: 'var(--mantle)',
              border: '1px solid var(--border-dim)',
              borderRadius: 2,
              fontSize: 11,
              color: 'var(--overlay1)',
            }}>
              <div style={{ marginBottom: 3, color: 'var(--overlay2)', fontWeight: 600 }}>TEE Privacy Guarantee</div>
              Trigger params encrypted in enclave memory.
              Public mempool sees <span style={{ color: 'var(--green)' }}>0 pending defense txs</span>.
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function StatusRow({ label, value, accent, private: isPrivate }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: 8 }}>
      <span style={{ fontSize: 11, color: 'var(--overlay1)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {isPrivate && <span style={{ fontSize: 10 }}>🔐</span>}
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: accent, fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
