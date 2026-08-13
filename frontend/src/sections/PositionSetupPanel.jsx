import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../services/WalletContext';
import { formatAddress } from '../services/walletService';
import { ShieldCheck, Lock, Wallet, ArrowUpRight } from 'lucide-react';

/**
 * PositionSetupPanel – Step 1 of Live Demo
 * Quiet, refined UI following Apple-level restraint design rules.
 */
export default function PositionSetupPanel({ config, onChange, onRegister, isArming }) {
  const { collateralFlr, debtUsd, thresholdHf, repayUsd } = config;
  const [selectedPreset, setSelectedPreset] = useState('balanced');
  const { account, isCoston2, vaultReserve, openModal } = useWallet();

  const flrPriceEst = 0.035;
  const collateralUsd = collateralFlr * flrPriceEst;
  const liqThreshUsd  = collateralUsd * 0.85;
  const hfLive        = debtUsd > 0 ? liqThreshUsd / debtUsd : Infinity;
  const hfColor       = hfLive >= 1.5 ? 'var(--text-primary)' : hfLive >= 1.15 ? '#F59E0B' : 'var(--risk-red)';

  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'conservative') {
      onChange('thresholdHf', 1.25);
      onChange('repayUsd', Math.max(5, Math.round(debtUsd * 0.50)));
    } else if (presetKey === 'balanced') {
      onChange('thresholdHf', 1.15);
      onChange('repayUsd', Math.max(4, Math.round(debtUsd * 0.40)));
    } else if (presetKey === 'aggressive') {
      onChange('thresholdHf', 1.05);
      onChange('repayUsd', Math.max(3, Math.round(debtUsd * 0.25)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fintech-card fintech-card--actionable"
      style={{
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {/* Borrower Identity Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        marginBottom: 24,
        fontSize: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Borrower Account:</span>
          {account ? (
            <span style={{ color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {formatAddress(account)}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              0x7099…79C8 (Demo Simulation)
            </span>
          )}
          <span className="badge badge--dim" style={{ fontSize: 9 }}>
            {account && isCoston2 ? 'Coston2 Live' : 'Demo Sandbox'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {account && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Vault Reserve:</span>
              <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {vaultReserve} C2FLR
              </span>
              <button
                type="button"
                onClick={openModal}
                className="btn btn--surface"
                style={{ fontSize: 10, padding: '2px 8px', borderRadius: '5px' }}
              >
                Top up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Health Factor Hero Number */}
      <div style={{ textAlign: 'center', marginBottom: 36, marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
          Simulated position health factor
        </span>
        <div style={{
          fontSize: '72px',
          fontWeight: 800,
          color: hfColor,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginTop: 6,
          marginBottom: 6,
        }}>
          {isFinite(hfLive) ? hfLive.toFixed(4) : '∞'}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
          Your stop-loss threshold is set to <span style={{ color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{thresholdHf.toFixed(2)} HF</span>.
          Public liquidators can act once your position crosses 1.00 HF.
        </p>
      </div>

      {/* Preset Profiles */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>
          Select safety preset
        </div>
        <div className="grid-responsive-3">
          <PresetButton
            active={selectedPreset === 'conservative'}
            onClick={() => applyPreset('conservative')}
            title="Conservative"
            badge="Early Safety"
            threshold="1.25 HF trigger"
            target="1.45 HF buffer"
            description="Widest margin against volatile wick crashes. Restores health factor early."
          />
          <PresetButton
            active={selectedPreset === 'balanced'}
            onClick={() => applyPreset('balanced')}
            title="Balanced"
            badge="Recommended"
            threshold="1.15 HF trigger"
            target="1.30 HF buffer"
            description="Optimal capital efficiency. Dynamic auto-repayment with moderate buffer."
          />
          <PresetButton
            active={selectedPreset === 'aggressive'}
            onClick={() => applyPreset('aggressive')}
            title="Aggressive"
            badge="High Leverage"
            threshold="1.05 HF trigger"
            target="1.20 HF buffer"
            description="Tight stop-loss right above liquidation line. Minimal idle reserve."
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid-responsive-4" style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        paddingTop: 28,
        marginBottom: 32,
      }}>
        <FieldGroup label="Collateral deposited" hint="Kinetic collateral (FLR)">
          <input
            type="number"
            value={collateralFlr}
            min={0}
            step={100}
            onChange={e => {
              setSelectedPreset('custom');
              onChange('collateralFlr', Number(e.target.value));
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            ≈ ${(collateralFlr * flrPriceEst).toFixed(2)} USD
          </div>
        </FieldGroup>

        <FieldGroup label="Borrowed debt" hint="Current debt obligation (USD)">
          <input
            type="number"
            value={debtUsd}
            min={0}
            step={1}
            onChange={e => {
              setSelectedPreset('custom');
              onChange('debtUsd', Number(e.target.value));
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
            Limit: ${(collateralUsd * 0.80).toFixed(2)}
          </div>
        </FieldGroup>

        <FieldGroup label="Trigger threshold" hint="TEE stop-loss limit (HF)">
          <input
            type="number"
            value={thresholdHf}
            min={1.01}
            max={3.0}
            step={0.01}
            onChange={e => {
              setSelectedPreset('custom');
              onChange('thresholdHf', Number(e.target.value));
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Private trigger TEE
          </div>
        </FieldGroup>

        <FieldGroup label="Auto-repay cap" hint="Max auto-repay reserve (USD)">
          <input
            type="number"
            value={repayUsd}
            min={1}
            step={1}
            onChange={e => {
              setSelectedPreset('custom');
              onChange('repayUsd', Number(e.target.value));
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
            Dynamic recovery
          </div>
        </FieldGroup>
      </div>

      {/* Arm Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255, 255, 255, 0.02)',
        padding: '16px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={14} style={{ color: 'var(--tech-purple)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {account
              ? 'Clicking below generates an off-chain EIP-191 signature to securely arm your confidential TEE enclave.'
              : 'Your stop-loss threshold stays private in enclave memory until it fires.'}
          </span>
        </div>
        <button
          type="button"
          disabled={isArming}
          className="btn btn--mauve"
          onClick={onRegister}
          style={{
            padding: '12px 28px',
            fontSize: 13,
            fontWeight: 600,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: isArming ? 'wait' : 'pointer',
          }}
        >
          <ShieldCheck size={16} />
          <span>{isArming ? 'Signing in Wallet…' : account ? 'Sign & Arm TEE' : 'Arm TEE protection'}</span>
        </button>
      </div>
    </motion.div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
        {hint}
      </span>
    </div>
  );
}

function PresetButton({ active, onClick, title, badge, threshold, target, description }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'rgba(155, 127, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
        border: `1px solid ${active ? 'var(--tech-purple)' : 'transparent'}`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--tech-purple)' : 'var(--text-primary)' }}>
          {title}
        </span>
        <span style={{
          fontSize: 9,
          color: active ? 'var(--tech-purple)' : 'var(--text-muted)',
          background: 'rgba(255,255,255,0.04)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 600,
        }}>
          {badge}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
        <span style={{ color: active ? 'var(--tech-purple)' : 'var(--text-primary)' }}>{threshold}</span>
        <span style={{ color: 'var(--text-secondary)' }}>➔</span>
        <span style={{ color: 'var(--money-green)' }}>{target}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginTop: 4 }}>
        {description}
      </p>
    </button>
  );
}
