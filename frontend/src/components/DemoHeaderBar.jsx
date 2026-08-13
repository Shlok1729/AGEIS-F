import React from 'react';
import CountUp from './CountUp';
import { useWallet } from '../services/WalletContext';
import { formatAddress, CONTRACT_ADDRESSES } from '../services/walletService';

/**
 * DemoHeaderBar — Slim persistent header bar for /demo
 * Clean, minimal, sentence-case styling following Apple-level restraint.
 */
export default function DemoHeaderBar({ flrPrice, teeArmed, onReset }) {
  const { account, isCoston2 } = useWallet();

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '12px',
        padding: '10px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        fontSize: 12,
        backdropFilter: 'var(--glass-blur)',
      }}
    >
      {/* Left side facts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: teeArmed ? 'var(--money-green)' : 'var(--text-muted)',
              display: 'inline-block',
            }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {teeArmed ? 'Enclave armed' : 'Enclave standby'}
          </span>
          <span className="badge badge--neutral" style={{ fontSize: 9 }}>FCC MODE=0</span>
        </div>

        <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>FTSOv2 FLR/USD: </span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            $<CountUp to={flrPrice} decimals={5} />
          </span>
        </div>

        <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>Latency: </span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>&lt;340ms</span>
        </div>

        <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>TEE PMW: </span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            {formatAddress(CONTRACT_ADDRESSES.teeKeeper)}
          </span>
        </div>

        {account && (
          <>
            <span style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Borrower: </span>
              <span style={{ color: 'var(--tech-purple)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {formatAddress(account)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right side controls */}
      <div>
        <button
          type="button"
          onClick={onReset}
          className="btn btn--surface"
          style={{ fontSize: 11, padding: '4px 12px', borderRadius: '8px' }}
        >
          Reset demo
        </button>
      </div>
    </div>
  );
}
