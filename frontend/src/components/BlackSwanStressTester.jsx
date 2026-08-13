import React from 'react';
import { AlertTriangle, Zap, TrendingDown, Clock, ShieldAlert } from 'lucide-react';
import { playClickSound, playAlertBeep } from '../services/audioService';

export default function BlackSwanStressTester({ currentPrice, onTriggerScenario }) {
  const scenarios = [
    {
      id: 'cascade',
      title: 'May 2021 Liquidation Cascade',
      dropPct: -42,
      targetPrice: +(currentPrice * 0.58).toFixed(5),
      desc: 'Violent -42% market dump. Pushes unhedged positions into immediate liquidation.',
      tag: 'Critical Crash',
      color: 'var(--risk-red)',
    },
    {
      id: 'wick',
      title: 'Oracle Flash Wick Glitch',
      dropPct: -18,
      targetPrice: +(currentPrice * 0.82).toFixed(5),
      desc: 'Sudden -18% wick drop testing FTSOv2 staleness guard & sub-second reaction.',
      tag: 'Sub-Second Wick',
      color: 'var(--flare-blue)',
    },
    {
      id: 'bleed',
      title: 'Macro Volatility Bleed',
      dropPct: -25,
      targetPrice: +(currentPrice * 0.75).toFixed(5),
      desc: 'Progressive -25% decline testing continuous health engine evaluation in enclave RAM.',
      tag: 'Progressive Bleed',
      color: 'var(--tech-purple)',
    },
  ];

  const handleRun = (sc) => {
    playClickSound();
    playAlertBeep();
    onTriggerScenario(sc.targetPrice, sc.title);
  };

  return (
    <div className="fintech-card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--risk-red)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Historical "Black Swan" Market Stress Presets
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          1-Click Execution Test
        </span>
      </div>

      <div className="grid-responsive-3">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => handleRun(sc)}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = sc.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                {sc.title}
              </span>
              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: sc.color,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                {sc.dropPct}%
              </span>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
              {sc.desc}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>Target: ${sc.targetPrice}</span>
              <span style={{ color: sc.color, fontWeight: 600 }}>Simulate Drop →</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
