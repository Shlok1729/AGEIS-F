import React from 'react';
import { ShieldCheck, Activity, Lock, ArrowUpRight, Cpu } from 'lucide-react';
import { formatAddress, CONTRACT_ADDRESSES } from '../services/walletService';

export default function HeroPositionTicket({
  flrPrice = 0.035,
  collateralFlr = 1000,
  debtUsd = 20,
  thresholdHf = 1.15,
  teeArmed = true,
  onOpenDemo,
}) {
  const collateralUsd = collateralFlr * flrPrice;
  const liqThreshold = collateralUsd * 0.85;
  const currentHf = debtUsd > 0 ? liqThreshold / debtUsd : Infinity;
  const isHealthy = currentHf >= 1.30;

  return (
    <div
      className="fintech-card hero-card"
      style={{
        padding: '24px',
        maxWidth: '480px',
        width: '100%',
        background: 'rgba(14, 14, 22, 0.75)',
        border: '1px solid rgba(155, 127, 255, 0.2)',
        borderRadius: '18px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(155, 127, 255, 0.08)',
      }}
    >
      {/* Ticket Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            #POS-FLR-0042
          </span>
          <span className="badge badge--neutral" style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>
            Coston2 114
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            className="pulse-dot"
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: teeArmed ? 'var(--money-green)' : 'var(--text-muted)',
            }}
          />
          <span className={`badge ${teeArmed ? 'badge--green' : 'badge--neutral'}`} style={{ fontSize: 10 }}>
            {teeArmed ? 'FCC ENCLAVE ARMED' : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Primary Financial Metric (Health Factor) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live Health Factor
          </span>
          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: isHealthy ? 'var(--money-green)' : 'var(--risk-red)',
            lineHeight: 1.1,
            marginTop: 4,
          }}>
            {isFinite(currentHf) ? currentHf.toFixed(4) : '∞'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Liquidation floor: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--risk-red)' }}>1.0000 HF</span>
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Private TEE Trigger
          </span>
          <div style={{
            fontSize: '22px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            color: 'var(--tech-purple)',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 4,
          }}>
            <Lock size={14} />
            <span>{thresholdHf.toFixed(2)} HF</span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Target buffer: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--money-green)' }}>1.30 HF</span>
          </span>
        </div>
      </div>

      {/* Position Breakdown Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
        marginBottom: 18,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '10px 12px',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
            Collateral (Kinetic)
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {collateralFlr.toLocaleString()} FLR
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', fontFamily: 'var(--font-mono)' }}>
            ≈ ${collateralUsd.toFixed(2)} USD
          </span>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '10px',
          padding: '10px 12px',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
            Current Debt
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            ${debtUsd.toFixed(2)} USD
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', fontFamily: 'var(--font-mono)' }}>
            Max Cap: ${(collateralUsd * 0.80).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Real-time Hardware & Oracle Metadata Chips */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'rgba(155, 127, 255, 0.04)',
        border: '1px solid rgba(155, 127, 255, 0.12)',
        borderRadius: '10px',
        marginBottom: 16,
        fontSize: 11,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={13} style={{ color: 'var(--tech-purple)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>FTSOv2 Ingestion:</span>
          <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            ${flrPrice.toFixed(5)} (~1.8s)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-muted)' }}>Keeper PMW:</span>
          <span style={{ color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {formatAddress(CONTRACT_ADDRESSES.teeKeeper)}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {onOpenDemo && (
        <button
          type="button"
          onClick={onOpenDemo}
          className="btn btn--primary"
          style={{ width: '100%', padding: '11px', fontSize: 13 }}
        >
          <ShieldCheck size={16} />
          <span>Launch Live Protection Demo</span>
          <ArrowUpRight size={14} />
        </button>
      )}
    </div>
  );
}
