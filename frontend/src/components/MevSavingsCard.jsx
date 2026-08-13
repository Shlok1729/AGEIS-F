import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * MevSavingsCard — MEV savings calculator
 * Quiet, elegant presentation following Apple-level visual restraint.
 */

const CLOSE_FACTOR  = 0.50;
const LIQ_BONUS     = 0.08;
const RESCUE_GAS    = 145000;
const GAS_PRICE_GWEI= 25;
const FLR_PRICE_BENCHMARK = 0.035;
const GAS_COST_USD  = (RESCUE_GAS * GAS_PRICE_GWEI * 1e-9) * FLR_PRICE_BENCHMARK;
const SOURCE_NOTE   = 'Illustrative benchmark (Compound-fork parameters)';

export function computeMevSavings(debtUsd) {
  const eligibleRepay  = debtUsd * CLOSE_FACTOR;
  const collateralSeized = eligibleRepay * (1 + LIQ_BONUS);
  const mevSaving      = eligibleRepay * LIQ_BONUS;
  const netBenefit     = Math.max(0, mevSaving - GAS_COST_USD);
  const roiMultiplier  = GAS_COST_USD > 0 ? (mevSaving / GAS_COST_USD) : 0;
  return { eligibleRepay, collateralSeized, mevSaving, netBenefit, roiMultiplier, gasCostUsd: GAS_COST_USD };
}

export default function MevSavingsCard({ debtUsdAtTrigger, repaidUsd, visible }) {
  if (!visible || debtUsdAtTrigger == null) return null;

  const { eligibleRepay, collateralSeized, mevSaving, netBenefit, roiMultiplier, gasCostUsd } = computeMevSavings(debtUsdAtTrigger);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mev-card"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 20, stiffness: 180 }}
          style={{
            background: 'rgba(166, 227, 161, 0.06)',
            border: '1px solid rgba(166, 227, 161, 0.22)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginTop: 16,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--money-green)' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--money-green)' }}>
                Liquidation prevented
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                TEE protection triggered silently before public bots could act
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--money-green)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              +${mevSaving.toFixed(4)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>gross collateral saved</div>
          </div>
          </div>

          {/* Breakdown grid */}
          <div className="grid-responsive-4" style={{
            padding: '12px 0',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 16,
          }}>
            <SavingsRow
              label="Bot-eligible repay"
              formula={`$${debtUsdAtTrigger.toFixed(2)} × ${(CLOSE_FACTOR*100).toFixed(0)}%`}
              value={`$${eligibleRepay.toFixed(4)}`}
            />
            <SavingsRow
              label="Collateral bot seizes"
              formula={`$${eligibleRepay.toFixed(4)} × ${(1+LIQ_BONUS).toFixed(2)}×`}
              value={`$${collateralSeized.toFixed(4)}`}
            />
            <SavingsRow
              label="Flare gas cost"
              formula={`145k gas @ 25 Gwei`}
              value={`$${gasCostUsd.toFixed(5)}`}
            />
            <SavingsRow
              label="Net saved (ROI)"
              formula={`Savings - Gas`}
              value={`+$${netBenefit.toFixed(4)}`}
              highlight
            />
          </div>

          {/* Aegis-F repay vs what bot would have taken */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--overlay1)', lineHeight: 1.4 }}>
              Aegis-F repaid <span style={{ color: 'var(--text)', fontWeight: 600 }}>${repaidUsd.toFixed(2)}</span> dynamically.
              Public searcher would have repaid <span style={{ color: 'var(--text)', fontWeight: 600 }}>${eligibleRepay.toFixed(4)}</span> and seized <span style={{ color: 'var(--text)', fontWeight: 600 }}>${mevSaving.toFixed(4)}</span> bonus.
            </div>
            <div style={{ fontSize: 10, color: 'var(--overlay0)', fontStyle: 'italic', marginLeft: 16 }}>
              {SOURCE_NOTE}
            </div>
          </div>

          {/* Micro-position economic viability note */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: 11,
            color: 'var(--subtext0)',
            lineHeight: 1.45,
          }}>
            <strong>Economic viability:</strong> Because Flare L1 transaction costs are sub-cent (&lt;$0.0003), automated protection delivers positive net yield even for positions as small as $5.00 ({Math.round(roiMultiplier).toLocaleString()}x return on gas).
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SavingsRow({ label, formula, value, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(166,227,161,0.04)' : 'transparent',
      padding: '8px 10px',
      borderRadius: '6px',
      border: highlight ? '1px solid rgba(166,227,161,0.18)' : 'none',
    }}>
      <div style={{ fontSize: 11, color: 'var(--overlay1)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--overlay0)', marginBottom: 4, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formula}</div>
      <div style={{
        fontSize: '13px',
        fontWeight: 700,
        color: highlight ? 'var(--green)' : 'var(--text)',
        fontFamily: 'var(--font-mono)',
      }}>
        {value}
      </div>
    </div>
  );
}
