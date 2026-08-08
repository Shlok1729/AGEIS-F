import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * PositionSetupPanel – Section 2
 * "Entering the private zone" — configuring collateral, debt, HF threshold.
 * Marked as TEE-encrypted with mauve border/glow.
 */
export default function PositionSetupPanel({ config, onChange, onRegister }) {
  const { collateralFlr, debtUsd, thresholdHf, repayUsd } = config;

  // Live derived health factor preview
  const flrPriceEst = 0.035;
  const collateralUsd = collateralFlr * flrPriceEst;
  const liqThreshUsd  = collateralUsd * 0.85;
  const hfLive        = debtUsd > 0 ? liqThreshUsd / debtUsd : Infinity;
  const hfColor       = hfLive >= 1.5 ? 'var(--green)' : hfLive >= 1.1 ? 'var(--peach)' : 'var(--red)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="panel panel--mauve glow-mauve"
      style={{ marginBottom: 24 }}
    >
      {/* Title bar */}
      <div className="panel-titlebar">
        <span style={{ color: 'var(--mauve)', fontSize: 13 }}>🔐</span>
        <span style={{ color: 'var(--mauve)', fontWeight: 700 }}>Position Setup</span>
        <span style={{ flex: 1 }} />
        <span className="badge badge--mauve">ENCRYPTED — TEE-ONLY</span>
        <span style={{ fontSize: 10, color: 'var(--overlay0)', marginLeft: 8 }}>
          / Parameters never leave the enclave
        </span>
      </div>

      <div style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 24 }}>

          {/* Collateral */}
          <FieldGroup
            label="Collateral Deposited"
            unit="FLR"
            hint="Kinetic market collateral"
            accent="var(--blue)"
          >
            <input
              type="number"
              value={collateralFlr}
              min={0}
              step={100}
              onChange={e => onChange('collateralFlr', Number(e.target.value))}
            />
            <div style={{ fontSize: 11, color: 'var(--overlay1)', marginTop: 5 }}>
              ≈ ${(collateralFlr * flrPriceEst).toFixed(2)} USD at ~${flrPriceEst}
            </div>
          </FieldGroup>

          {/* Debt */}
          <FieldGroup
            label="Borrowed Debt"
            unit="USD"
            hint="Active debt to protect"
            accent="var(--peach)"
          >
            <input
              type="number"
              value={debtUsd}
              min={0}
              step={1}
              onChange={e => onChange('debtUsd', Number(e.target.value))}
            />
            <div style={{ fontSize: 11, color: 'var(--overlay1)', marginTop: 5 }}>
              Max borrow: ${(collateralUsd * 0.80).toFixed(2)}
            </div>
          </FieldGroup>

          {/* HF Threshold */}
          <FieldGroup
            label="TEE Trigger Threshold"
            unit="HF"
            hint="Private — fires before liquidation"
            accent="var(--mauve)"
          >
            <input
              type="number"
              value={thresholdHf}
              min={1.01}
              max={3.0}
              step={0.01}
              onChange={e => onChange('thresholdHf', Number(e.target.value))}
              style={{ borderColor: 'rgba(203,166,247,0.4)' }}
            />
            <div style={{ fontSize: 11, color: 'var(--mauve)', marginTop: 5 }}>
              Public liquidation = 1.00 HF
            </div>
          </FieldGroup>

          {/* Repay Amount */}
          <FieldGroup
            label="Auto-Repay Amount"
            unit="USD"
            hint="Per trigger execution"
            accent="var(--green)"
          >
            <input
              type="number"
              value={repayUsd}
              min={1}
              step={1}
              onChange={e => onChange('repayUsd', Number(e.target.value))}
            />
            <div style={{ fontSize: 11, color: 'var(--overlay1)', marginTop: 5 }}>
              From AegisVault reserve
            </div>
          </FieldGroup>
        </div>

        {/* Live HF preview + Register button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '14px 16px',
          background: 'var(--mantle)',
          border: '1px solid var(--border-dim)',
          borderRadius: 2,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--overlay1)', marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Live Health Factor Preview <span style={{ color: 'var(--mauve)' }}>(TEE internal)</span>
            </div>
            {/* HF Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="hf-bar-track" style={{ flex: 1 }}>
                <div
                  className="hf-bar-fill"
                  style={{
                    width: `${Math.min(100, (hfLive / 2.5) * 100)}%`,
                    background: hfColor,
                  }}
                />
                {/* Threshold marker */}
                <div style={{
                  position: 'absolute',
                  left: `${Math.min(100, (thresholdHf / 2.5) * 100)}%`,
                  top: -4,
                  bottom: -4,
                  width: 1,
                  background: 'var(--mauve)',
                  opacity: 0.8,
                }} />
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: hfColor, minWidth: 60, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {isFinite(hfLive) ? hfLive.toFixed(4) : '∞'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--overlay1)' }}>HF</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--overlay0)', marginTop: 4 }}>
              <span>0.00 (liquidated)</span>
              <span style={{ color: 'var(--mauve)' }}>▲ TEE threshold: {thresholdHf.toFixed(2)}</span>
              <span>2.50 (safe)</span>
            </div>
          </div>

          <button className="btn btn--mauve" onClick={onRegister} style={{ whiteSpace: 'nowrap' }}>
            🔐 Register in TEE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FieldGroup({ label, unit, hint, accent, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      <div style={{ fontSize: 11, color: 'var(--overlay0)', marginTop: 4 }}>
        <span className="prompt" />{hint}
      </div>
    </div>
  );
}
