import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ShieldCheck, DollarSign, ArrowRight, Percent, Zap } from 'lucide-react';
import CountUp from './CountUp';

export default function DynamicRepayCalculator({ liveFlrPrice = 0.035, onEnterDemo }) {
  const [collateralFlr, setCollateralFlr] = useState(1000);
  const [debtUsd, setDebtUsd]             = useState(20);
  const [simPrice, setSimPrice]           = useState(0.025);
  const [targetBuffer, setTargetBuffer]   = useState(1.30);
  const [thresholdHf, setThresholdHf]     = useState(1.15);

  // Financial Math Breakdown
  const collateralValueUsd = collateralFlr * simPrice;
  const liqThresholdValue  = collateralValueUsd * 0.85;
  const calculatedHf       = debtUsd > 0 ? liqThresholdValue / debtUsd : Infinity;

  // Dynamic Debt Relief Formula: ΔD = D - (C * P * 0.85 / HF_target)
  const isBreached         = calculatedHf <= thresholdHf;
  const rawRequiredRepay   = isBreached ? Math.max(0, debtUsd - (liqThresholdValue / targetBuffer)) : 0;
  const actualRepayUsd     = Math.min(debtUsd, rawRequiredRepay);
  const postRepayDebt      = Math.max(0, debtUsd - actualRepayUsd);
  const postRepayHf        = postRepayDebt > 0 ? liqThresholdValue / postRepayDebt : Infinity;

  // MEV Savings avoided (8% liquidation penalty on 50% debt close factor)
  const liquidationPenaltyAvoided = debtUsd * 0.50 * 0.08;

  return (
    <div
      className="fintech-card fintech-card--flat"
      style={{
        padding: 'var(--space-5)',
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(18, 18, 26, 0.75)',
        border: '1px solid var(--border-card)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calculator size={20} style={{ color: 'var(--tech-purple)' }} />
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Dynamic Debt Repayment Engine
            </h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Evaluate mathematical debt relief required to restore a safe 1.30 HF buffer
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge badge--neutral" style={{ fontSize: 10 }}>
            Compound V2 + FTSOv2 Math
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid-responsive-2" style={{ marginBottom: 32 }}>
        {/* Slider 1: Collateral */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Collateral Deposited</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {collateralFlr.toLocaleString()} FLR (${(collateralFlr * simPrice).toFixed(2)})
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={5000}
            step={50}
            value={collateralFlr}
            onChange={e => setCollateralFlr(Number(e.target.value))}
          />
        </div>

        {/* Slider 2: Debt */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Current Borrowed Debt</span>
            <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ${debtUsd.toFixed(2)} USD
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={1}
            value={debtUsd}
            onChange={e => setDebtUsd(Number(e.target.value))}
          />
        </div>

        {/* Slider 3: Simulated FLR Price */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Simulated Oracle Price</span>
            <span style={{ color: 'var(--flare-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              ${simPrice.toFixed(5)} FLR/USD
            </span>
          </div>
          <input
            type="range"
            min={0.010}
            max={0.050}
            step={0.001}
            value={simPrice}
            onChange={e => setSimPrice(Number(e.target.value))}
          />
        </div>

        {/* Slider 4: Private TEE Threshold */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Confidential Trigger Limit</span>
            <span style={{ color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {thresholdHf.toFixed(2)} HF
            </span>
          </div>
          <input
            type="range"
            min={1.02}
            max={1.40}
            step={0.01}
            value={thresholdHf}
            onChange={e => setThresholdHf(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Real-time Math Output Hero Grid */}
      <div className="grid-responsive-3" style={{ marginBottom: 24 }}>
        {/* Output 1: Current Health Factor */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isBreached ? 'var(--risk-red-border)' : 'rgba(255, 255, 255, 0.06)'}`,
          borderRadius: '14px',
          padding: '18px',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Position Health Factor
          </span>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: calculatedHf >= 1.30 ? 'var(--money-green)' : calculatedHf >= 1.00 ? 'var(--risk-red)' : 'var(--risk-red)',
          }}>
            <CountUp to={calculatedHf} decimals={4} />
          </div>
          <span style={{ fontSize: 11, color: isBreached ? 'var(--risk-red)' : 'var(--text-muted)' }}>
            {isBreached ? 'Trigger breached (repay required)' : 'Safe (above threshold)'}
          </span>
        </div>

        {/* Output 2: Required Auto-Repay */}
        <div style={{
          background: 'rgba(155, 127, 255, 0.04)',
          border: '1px solid rgba(155, 127, 255, 0.2)',
          borderRadius: '14px',
          padding: '18px',
        }}>
          <span style={{ fontSize: 11, color: 'var(--tech-purple)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            Dynamic Auto-Repay Needed
          </span>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--tech-purple)',
          }}>
            $<CountUp to={actualRepayUsd} decimals={2} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Target Buffer: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--money-green)' }}>{targetBuffer.toFixed(2)} HF</span>
          </span>
        </div>

        {/* Output 3: Liquidation Penalty Avoided */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            marginTop: 'var(--space-3)'
          }}><span style={{ fontSize: 11, color: 'var(--money-green)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            MEV Liquidation Fee Saved
          </span>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--money-green)',
          }}>
            $<CountUp to={liquidationPenaltyAvoided} decimals={2} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            8% bonus penalty avoided
          </span>
        </div>
      </div>

      {/* Plain-English Interpretation Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        padding: '14px 18px',
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          At <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--flare-blue)', fontWeight: 600 }}>${simPrice.toFixed(5)} FLR</span>,
          a health factor drop to <span style={{ fontFamily: 'var(--font-mono)', color: isBreached ? 'var(--risk-red)' : 'var(--text-primary)', fontWeight: 600 }}>{calculatedHf.toFixed(4)} HF</span>
          {isBreached ? (
            <> triggers an automated repayment of <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tech-purple)', fontWeight: 600 }}>${actualRepayUsd.toFixed(2)} USD</span>, safely restoring health factor to <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--money-green)', fontWeight: 600 }}>{postRepayHf.toFixed(4)} HF</span>.</>
          ) : (
            <> remains above your confidential <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--tech-purple)', fontWeight: 600 }}>{thresholdHf.toFixed(2)} HF</span> limit with no repayment necessary.</>
          )}
        </div>

        {onEnterDemo && (
          <button
            type="button"
            onClick={onEnterDemo}
            className="btn btn--surface"
            style={{ fontSize: 11, padding: '5px 12px', borderRadius: '7px' }}
          >
            <span>Test In Live Demo</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
