import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from './CountUp';

/**
 * WhatIfSimulator — No-Wallet Dynamic Repayment Calculator
 * Quiet, minimalist design adopting Apple-level restraint.
 */
export default function WhatIfSimulator({ liveFlrPrice = 0.035, onEnterDemo }) {
  const [collateralFlr, setCollateralFlr] = useState(2500);
  const [debtUsd, setDebtUsd]             = useState(50);
  const [priceDropPct, setPriceDropPct]   = useState(25);
  const [targetHf, setTargetHf]           = useState(1.30);
  const [thresholdHf, setThresholdHf]     = useState(1.15);
  const [activePreset, setActivePreset]   = useState('balanced');

  const LIQ_THRESHOLD_BPS = 0.85;
  const CLOSE_FACTOR      = 0.50;
  const LIQ_BONUS         = 0.08;
  const GAS_COST_USD      = 0.00028;

  const calculations = useMemo(() => {
    const basePrice      = liveFlrPrice > 0 ? liveFlrPrice : 0.035;
    const droppedPrice   = Math.max(0.001, basePrice * (1 - priceDropPct / 100));

    const baseCollateralUsd = collateralFlr * basePrice;
    const baseLiqValueUsd   = baseCollateralUsd * LIQ_THRESHOLD_BPS;
    const baseHf            = debtUsd > 0 ? baseLiqValueUsd / debtUsd : Infinity;

    const stressedCollateralUsd = collateralFlr * droppedPrice;
    const stressedLiqValueUsd   = stressedCollateralUsd * LIQ_THRESHOLD_BPS;
    const stressedHf            = debtUsd > 0 ? stressedLiqValueUsd / debtUsd : Infinity;

    const maxDebtForTarget = targetHf > 0 ? stressedLiqValueUsd / targetHf : 0;
    const rawRequiredRepay = debtUsd - maxDebtForTarget;
    const requiredRepay    = Math.max(0, Math.min(debtUsd, rawRequiredRepay));

    const postRescueDebt = Math.max(0, debtUsd - requiredRepay);
    const postRescueHf   = postRescueDebt > 0 ? stressedLiqValueUsd / postRescueDebt : (postRescueDebt === 0 ? 99 : 0);

    const eligibleDebtRepayBot = debtUsd * CLOSE_FACTOR;
    const collateralBotSeizes  = eligibleDebtRepayBot * (1 + LIQ_BONUS);
    const mevPenaltyLoss       = eligibleDebtRepayBot * LIQ_BONUS;
    const netMevBenefit        = Math.max(0, mevPenaltyLoss - GAS_COST_USD);
    const roiMultiplier        = GAS_COST_USD > 0 ? (mevPenaltyLoss / GAS_COST_USD) : 0;

    const isLiquidatable = stressedHf < 1.00 && debtUsd > 0;
    const isTriggered    = stressedHf <= thresholdHf && debtUsd > 0;

    return {
      basePrice,
      droppedPrice,
      baseCollateralUsd,
      baseHf,
      stressedCollateralUsd,
      stressedHf,
      requiredRepay,
      postRescueDebt,
      postRescueHf,
      eligibleDebtRepayBot,
      collateralBotSeizes,
      mevPenaltyLoss,
      netMevBenefit,
      roiMultiplier,
      isLiquidatable,
      isTriggered,
    };
  }, [collateralFlr, debtUsd, priceDropPct, targetHf, thresholdHf, liveFlrPrice]);

  const applyRiskPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'conservative') {
      setThresholdHf(1.25);
      setTargetHf(1.45);
    } else if (preset === 'balanced') {
      setThresholdHf(1.15);
      setTargetHf(1.30);
    } else if (preset === 'aggressive') {
      setThresholdHf(1.05);
      setTargetHf(1.20);
    }
  };

  const statusText = calculations.isLiquidatable
    ? 'Liquidatable'
    : calculations.isTriggered
    ? 'TEE rescue active'
    : 'Healthy';

  const statusColor = calculations.isLiquidatable
    ? 'var(--red)'
    : calculations.isTriggered
    ? 'var(--peach)'
    : 'var(--text)';

  return (
    <div
      className="panel"
      style={{
        padding: '32px',
        marginBottom: 24,
        background: 'rgba(30, 30, 46, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Title Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Dynamic repayment calculator
            </h3>
            <span className="badge badge--dim">Client-side evaluation</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--overlay1)', maxWidth: 680, lineHeight: 1.5 }}>
            Simulate positions and price drops to see how the TEE keeper dynamically restores safety
            margins and saves collateral from public liquidation penalties.
          </p>
        </div>
        <div>
          <span className="badge badge--mauve" style={{ background: 'rgba(203,166,247,0.06)' }}>
            Live FTSOv2: ${calculations.basePrice.toFixed(5)}
          </span>
        </div>
      </div>

      {/* Preset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--overlay1)', fontWeight: 600 }}>Risk preset:</span>
        <button
          type="button"
          onClick={() => applyRiskPreset('conservative')}
          className={`btn ${activePreset === 'conservative' ? 'btn--mauve' : 'btn--surface'}`}
          style={{ fontSize: 11, padding: '6px 14px', borderRadius: '8px' }}
        >
          Conservative
        </button>
        <button
          type="button"
          onClick={() => applyRiskPreset('balanced')}
          className={`btn ${activePreset === 'balanced' ? 'btn--mauve' : 'btn--surface'}`}
          style={{ fontSize: 11, padding: '6px 14px', borderRadius: '8px' }}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => applyRiskPreset('aggressive')}
          className={`btn ${activePreset === 'aggressive' ? 'btn--mauve' : 'btn--surface'}`}
          style={{ fontSize: 11, padding: '6px 14px', borderRadius: '8px' }}
        >
          Aggressive
        </button>
      </div>

      {/* Grid: Sliders vs Math Outputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 32, marginBottom: onEnterDemo ? 24 : 0 }}>
        
        {/* Left Side: Tactile Sliders (No borders at rest) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--overlay1)' }}>Collateral</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                {collateralFlr.toLocaleString()} FLR <span style={{ color: 'var(--overlay1)', fontWeight: 500, fontSize: 11 }}>(${(collateralFlr * calculations.basePrice).toFixed(2)})</span>
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="20000"
              step="100"
              value={collateralFlr}
              onChange={e => setCollateralFlr(Number(e.target.value))}
            />
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--overlay1)' }}>Borrowed debt</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                ${debtUsd.toFixed(2)} USD
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              step="5"
              value={debtUsd}
              onChange={e => setDebtUsd(Number(e.target.value))}
            />
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px 18px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--overlay1)' }}>Simulated market crash</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>
                -{priceDropPct}% (${calculations.droppedPrice.toFixed(5)})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={priceDropPct}
              onChange={e => setPriceDropPct(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--overlay0)', marginTop: 4 }}>
              <span>No drop</span>
              <span>Trigger zone</span>
              <span>Severe drop</span>
            </div>
          </div>

          {/* Core Configuration parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--overlay1)', fontWeight: 600, marginBottom: 6 }}>Trigger threshold</div>
              <input
                type="number"
                step="0.01"
                min="1.01"
                max="2.00"
                value={thresholdHf}
                onChange={e => {
                  setActivePreset('custom');
                  setThresholdHf(Number(e.target.value));
                }}
              />
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--overlay1)', fontWeight: 600, marginBottom: 6 }}>Target safe buffer</div>
              <input
                type="number"
                step="0.01"
                min="1.10"
                max="2.50"
                value={targetHf}
                onChange={e => {
                  setActivePreset('custom');
                  setTargetHf(Number(e.target.value));
                }}
              />
            </div>
          </div>

        </div>

        {/* Right Side: Visual Output (Apple-style spacing & large typography) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.015)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: 'var(--overlay1)', fontWeight: 600 }}>
                Health factor transition
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
                {statusText}
              </span>
            </div>

            {/* Huge Number Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--overlay1)', marginBottom: 4 }}>Stressed HF</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: calculations.stressedHf < 1.0 ? 'var(--red)' : calculations.stressedHf <= thresholdHf ? 'var(--peach)' : 'var(--text)'
                }}>
                  {isFinite(calculations.stressedHf) ? calculations.stressedHf.toFixed(4) : '∞'}
                </div>
              </div>

              <div style={{ fontSize: 14, color: 'var(--overlay0)', fontWeight: 800 }}>➔</div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 4 }}>Restored HF</div>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--green)'
                }}>
                  {isFinite(calculations.postRescueHf) ? calculations.postRescueHf.toFixed(4) : '∞'}
                </div>
              </div>

            </div>

            {/* Dynamic Formula Calculation */}
            <div style={{
              background: 'rgba(203, 166, 247, 0.04)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              border: '1px solid rgba(203, 166, 247, 0.15)',
            }}>
              <div style={{ color: 'var(--mauve)', fontWeight: 700, marginBottom: 4, fontSize: 10, fontFamily: 'var(--font-sans)' }}>
                Dynamic repayment formula
              </div>
              <div style={{ color: 'var(--overlay1)', marginBottom: 4 }}>
                D_repay = ${debtUsd.toFixed(2)} - [ (${collateralFlr} × ${calculations.droppedPrice.toFixed(4)} × 0.85) / {targetHf.toFixed(2)} ]
              </div>
              <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 13 }}>
                = ${calculations.requiredRepay.toFixed(4)} USD repaid
              </div>
            </div>

          </div>

          {/* MEV Savings Outcomes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12,
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.015)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--overlay1)' }}>MEV saved</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                +${calculations.mevPenaltyLoss.toFixed(4)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--overlay0)', marginTop: 2 }}>8% penalty avoided</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.015)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--overlay1)' }}>Flare gas cost</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                ${GAS_COST_USD.toFixed(5)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--overlay0)', marginTop: 2 }}>145k gas @ 25 Gwei</div>
            </div>

            <div style={{ background: 'rgba(166, 227, 161, 0.05)', padding: '14px', borderRadius: '12px' }}>
              <div style={{ fontSize: 10, color: 'var(--green)', fontWeight: 700 }}>Economic ROI</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                {calculations.roiMultiplier > 1000 ? `${Math.round(calculations.roiMultiplier).toLocaleString()}x` : `${calculations.roiMultiplier.toFixed(0)}x`}
              </div>
              <div style={{ fontSize: 9, color: 'var(--overlay1)', marginTop: 2 }}>Net: +${calculations.netMevBenefit.toFixed(4)}</div>
            </div>
          </div>

        </div>

      </div>

      {onEnterDemo && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--overlay1)' }}>
            Ready to test with live smart contracts and the Go keeper?
          </span>
          <button
            type="button"
            className="btn btn--mauve"
            onClick={onEnterDemo}
            style={{ fontSize: 12, padding: '10px 20px', fontWeight: 600 }}
          >
            Launch live demo
          </button>
        </div>
      )}

    </div>
  );
}
