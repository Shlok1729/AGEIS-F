import React, { useState } from 'react';
import { LayoutGrid, ShieldCheck, AlertCircle, ArrowUpRight, Lock, CheckCircle2 } from 'lucide-react';
import { playClickSound, playRescueChime } from '../services/audioService';

export default function PortfolioRiskHeatmap({ onOpenPosition }) {
  const [positions, setPositions] = useState([
    {
      id: 'POS-FLR-001',
      pair: 'FLR / USD',
      collateral: '1,000 FLR ($35.00)',
      debt: '$20.00 USD',
      hf: 1.4875,
      threshold: 1.15,
      armed: true,
      status: 'Safe',
      riskLevel: 'low',
    },
    {
      id: 'POS-BTC-002',
      pair: 'BTC / USDT',
      collateral: '0.50 BTC ($54,210)',
      debt: '$35,000 USDT',
      hf: 1.2390,
      threshold: 1.18,
      armed: true,
      status: 'Moderate',
      riskLevel: 'medium',
    },
    {
      id: 'POS-ETH-003',
      pair: 'ETH / USD',
      collateral: '10.0 ETH ($32,800)',
      debt: '$20,000 USD',
      hf: 1.3448,
      threshold: 1.15,
      armed: true,
      status: 'Safe',
      riskLevel: 'low',
    },
    {
      id: 'POS-XRP-004',
      pair: 'XRP / USD',
      collateral: '12,000 XRP ($27,000)',
      debt: '$14,000 USD',
      hf: 1.4464,
      threshold: 1.12,
      armed: false,
      status: 'Unprotected',
      riskLevel: 'warning',
    },
  ]);

  const [batchArmed, setBatchArmed] = useState(false);

  const handleBatchArm = () => {
    playClickSound();
    setPositions(prev => prev.map(p => ({ ...p, armed: true, status: p.status === 'Unprotected' ? 'Safe' : p.status })));
    setBatchArmed(true);
    playRescueChime();
  };

  return (
    <div className="fintech-card fintech-card--flat" style={{ padding: 'var(--space-5)', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <LayoutGrid size={16} style={{ color: 'var(--tech-purple)' }} />
            <span className="badge badge--neutral" style={{ fontSize: 10 }}>
              Institutional Treasury Desk
            </span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Multi-Position Portfolio Risk Heatmap
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Simultaneous multi-asset monitoring across Flare lending pools with batch confidential enclave execution.
          </span>
        </div>

        <button
          type="button"
          onClick={handleBatchArm}
          disabled={batchArmed}
          className="btn btn--primary"
          style={{ fontSize: 12, padding: '8px 16px', borderRadius: '8px' }}
        >
          <ShieldCheck size={14} />
          <span>{batchArmed ? 'All Positions Enclave Protected' : 'Batch Arm All in TEE'}</span>
        </button>
      </div>

      {/* Aggregate Portfolio Bar */}
      <div className="grid-responsive-4" style={{ marginBottom: 20 }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px 14px' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Portfolio TVL</span>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
            $114,045 USD
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px 14px' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Borrow Debt</span>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: 2 }}>
            $69,020 USD
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px 14px' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Portfolio Health</span>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--money-green)', marginTop: 2 }}>
            1.3280 HF
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '10px', padding: '12px 14px' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enclave Protection</span>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--tech-purple)', marginTop: 2 }}>
            {positions.filter(p => p.armed).length} / {positions.length} Positions
          </div>
        </div>
      </div>

      {/* Position Cards Grid */}
      <div className="grid-responsive-2">
        {positions.map((pos) => (
          <div
            key={pos.id}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${pos.armed ? 'rgba(155, 127, 255, 0.18)' : 'rgba(244, 63, 94, 0.25)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {pos.id}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-start' }}>
                <span className={`badge ${pos.armed ? 'badge--green' : 'badge--red'}`} style={{ fontSize: 10 }}>
                  {pos.armed ? 'Enclave Armed' : 'Unprotected'}
                </span>
                <span className="badge badge--neutral" style={{ fontSize: 10 }}>
                  {pos.pair}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 11 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Collateral</span>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{pos.collateral}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Debt Obligation</span>
                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{pos.debt}</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: 11,
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Health Factor: </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: pos.hf >= 1.30 ? 'var(--money-green)' : 'var(--risk-red)',
                }}>
                  {pos.hf.toFixed(4)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tech-purple)', fontFamily: 'var(--font-mono)' }}>
                <Lock size={12} />
                <span>Trigger: {pos.threshold.toFixed(2)} HF</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
