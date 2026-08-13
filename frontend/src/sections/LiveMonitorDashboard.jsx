import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { Activity, ShieldAlert, ShieldCheck, Lock, ArrowDownRight, RefreshCw, Zap, TrendingDown, Eye, EyeOff } from 'lucide-react';
import CountUp from '../components/CountUp';
import FeedStrip from '../components/FeedStrip';

export default function LiveMonitorDashboard({
  flrPrice = 0.035,
  config = {},
  teeArmed = true,
  vaultReserveUsd = 10,
  mevSavings = null,
  onSimulateDrop,
  onReset,
  lastTick,
}) {
  const { collateralFlr = 1000, debtUsd = 20, thresholdHf = 1.15, repayUsd = 8 } = config;
  const [teeView, setTeeView] = useState(true);

  const priceRef = useRef(null);
  const hfRef    = useRef(null);

  const collateralUsd  = collateralFlr * flrPrice;
  const liqThreshold   = collateralUsd * 0.85;
  const healthFactor   = debtUsd > 0 ? liqThreshold / debtUsd : Infinity;
  const isLiquidatable = healthFactor < 1.0 && debtUsd > 0;
  const isTeeZone      = healthFactor <= thresholdHf && debtUsd > 0;

  // Pulse price display on tick
  useEffect(() => {
    if (!priceRef.current) return;
    gsap.fromTo(priceRef.current,
      { color: 'var(--tech-purple)', scale: 1.03 },
      { color: 'var(--text-primary)', scale: 1, duration: 0.4, ease: 'power2.out' }
    );
  }, [flrPrice]);

  // Pulse HF on change
  useEffect(() => {
    if (!hfRef.current) return;
    gsap.fromTo(hfRef.current,
      { scale: 1.03 },
      { scale: 1, duration: 0.35, ease: 'power2.out' }
    );
  }, [healthFactor]);

  // Status badge derivation
  let statusText = 'Healthy & Protected';
  let statusColor = 'var(--money-green)';
  if (isLiquidatable) {
    statusText = 'Liquidatable (MEV Hunt Active)';
    statusColor = 'var(--risk-red)';
  } else if (isTeeZone) {
    statusText = 'TEE Trigger Firing';
    statusColor = 'var(--risk-red)';
  } else if (healthFactor < 1.30) {
    statusText = 'Approaching Trigger Threshold';
    statusColor = 'var(--flare-blue)';
  }

  const hfBarWidth    = Math.min(100, Math.max(0, (healthFactor / 2.5) * 100));
  const threshBarLeft = Math.min(100, (thresholdHf / 2.5) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ marginBottom: 24 }}
    >
      {/* Oracle Feed Strip */}
      <FeedStrip flrPriceOverride={flrPrice} lastTick={lastTick} />

      {/* 3-Column Monitor Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.15fr 1fr',
        gap: 20,
        marginTop: 20,
      }}>

        {/* Column 1: Public Oracle & Market Simulator */}
        <div className="fintech-card fintech-card--flat" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Public Oracle Feed
            </span>
            <span className="badge badge--neutral" style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
              FLR/USD (~1.8s)
            </span>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            FTSOv2 Coston2 Feed
          </span>
          <div
            ref={priceRef}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 4,
              display: 'flex',
              alignItems: 'baseline',
              gap: 2,
            }}
          >
            <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>$</span>
            <CountUp to={flrPrice} decimals={5} />
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 24 }}>
            Sub-second tick ingestion into hardware enclave
          </span>

          {/* Price Simulator Controls */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              <span>Simulate Market Move</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--flare-blue)' }}>${flrPrice.toFixed(5)}</span>
            </div>
            <input
              type="range"
              min="0.010"
              max="0.050"
              step="0.001"
              value={flrPrice}
              onChange={e => onSimulateDrop(Number(e.target.value))}
              style={{ width: '100%', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 16 }}>
              <span>$0.010 Crash</span>
              <span>$0.050 Safe</span>
            </div>

            <button
              type="button"
              className="btn btn--danger"
              style={{ width: '100%', padding: '10px', fontSize: 12 }}
              onClick={() => onSimulateDrop(0.026)}
            >
              <TrendingDown size={14} />
              <span>Simulate Flash Crash ($0.0260)</span>
            </button>
          </div>
        </div>

        {/* Column 2: Health Factor Engine (Confidential TEE View) */}
        <div className={`fintech-card ${teeArmed ? 'fintech-card--tee-active' : 'fintech-card--flat'}`} style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--tech-purple)', fontWeight: 600, textTransform: 'uppercase' }}>
              Confidential TEE Engine
            </span>
            <button
              type="button"
              onClick={() => setTeeView(v => !v)}
              className="btn btn--surface"
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: '6px', gap: 4 }}
            >
              {teeView ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{teeView ? 'Hide Enclave' : 'Reveal Enclave'}</span>
            </button>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Evaluated Position Health
          </span>

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
                  color: isLiquidatable ? 'var(--risk-red)' : isTeeZone ? 'var(--risk-red)' : 'var(--money-green)',
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
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                }}
              >
                ••••••••
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ marginBottom: 20 }}>
            <span className={`badge ${isLiquidatable ? 'badge--red' : isTeeZone ? 'badge--red' : 'badge--green'}`} style={{ fontSize: 10 }}>
              {statusText}
            </span>
          </div>

          {/* Progress Margin Visual */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>Liquidation: 1.00 HF</span>
              <span style={{ color: 'var(--tech-purple)', fontWeight: 600 }}>Private Trigger: {thresholdHf.toFixed(2)} HF</span>
            </div>

            <div style={{
              position: 'relative',
              height: 8,
              background: '#0D0D14',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              <div style={{
                width: `${hfBarWidth}%`,
                height: '100%',
                background: healthFactor < 1.0 ? 'var(--risk-red)' : healthFactor <= thresholdHf ? 'var(--risk-red)' : 'linear-gradient(90deg, #9B7FFF, #2ED47A)',
                borderRadius: '999px',
                transition: 'width 0.3s ease',
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)' }}>
              <span>Target Safe Buffer: 1.30 HF</span>
              <span style={{ color: 'var(--money-green)' }}>Zero MEV Leakage</span>
            </div>
          </div>
        </div>

        {/* Column 3: Vault Reserve & MEV Preemption */}
        <div className="fintech-card fintech-card--flat" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Vault Reserve
            </span>
            <span className="badge badge--green" style={{ fontSize: 10 }}>
              AegisVault Active
            </span>
          </div>

          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Available Repayment Collateral
          </span>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 34,
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            $<CountUp to={vaultReserveUsd} decimals={2} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 24 }}>
            Max Auto-Repay Cap: ${repayUsd.toFixed(2)} USD
          </span>

          {/* MEV Savings Indicator */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              MEV Preemption Status
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Public Mempool Visibility:</span>
                <span style={{ color: 'var(--money-green)', fontWeight: 600 }}>0 Bytes (Private)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>Liquidation Penalty Avoided:</span>
                <span style={{ color: 'var(--money-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  ~${(debtUsd * 0.50 * 0.08).toFixed(2)} USD
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="btn btn--surface"
              style={{ width: '100%', padding: '9px', fontSize: 11 }}
            >
              <RefreshCw size={13} />
              <span>Reset Parameters</span>
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
