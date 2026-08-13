import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Play, Zap, Clock, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { playClickSound, playRescueChime } from '../services/audioService';

export default function PredatorRaceVisualizer() {
  const [isRacing, setIsRacing] = useState(false);
  const [raceStep, setRaceStep] = useState(0); // 0 = idle, 1 = drop, 2 = race, 3 = finish

  const handleStartRace = () => {
    playClickSound();
    setIsRacing(true);
    setRaceStep(1);

    setTimeout(() => {
      setRaceStep(2);
    }, 800);

    setTimeout(() => {
      setRaceStep(3);
      setIsRacing(false);
      playRescueChime();
    }, 2400);
  };

  return (
    <div
      className="fintech-card fintech-card--flat"
      style={{
        padding: '28px',
        maxWidth: '960px',
        margin: '0 auto',
        background: 'rgba(18, 18, 26, 0.75)',
        border: '1px solid var(--border-card)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge--purple" style={{ fontSize: 10 }}>
              MEV Preemption Race
            </span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Execution Race: Public Mempool Snipers vs. Confidential TEE Enclave
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            Observe how sub-second FTSOv2 ingestion inside hardware enclaves preempts front-running bots before public liquidations can strike.
          </span>
        </div>

        <button
          type="button"
          disabled={isRacing}
          onClick={handleStartRace}
          className="btn btn--primary"
          style={{ fontSize: 12, padding: '8px 18px', borderRadius: '8px', cursor: isRacing ? 'wait' : 'pointer' }}
        >
          <Play size={13} />
          <span>{isRacing ? 'Simulating Race…' : 'Run Race Simulation'}</span>
        </button>
      </div>

      {/* Split-Track Visualizer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Track 1: Public Mempool Route (Red) */}
        <div style={{
          background: 'rgba(244, 63, 94, 0.03)',
          border: '1px solid rgba(244, 63, 94, 0.18)',
          borderRadius: '14px',
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} style={{ color: 'var(--risk-red)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--risk-red)' }}>
                Track A: Standard Public Mempool (Vulnerable)
              </span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--risk-red)' }}>
              Latency: 12,000ms+ (Public Block Delay)
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            position: 'relative',
          }}>
            <RaceStepCard
              step={1}
              active={raceStep >= 1}
              title="1. Price Crash"
              desc="FLR drops to $0.024. Health factor crosses 1.00."
              risk
            />
            <RaceStepCard
              step={2}
              active={raceStep >= 2}
              title="2. Mempool Leak"
              desc="Pending stop-loss broadcast to public mempool."
              risk
            />
            <RaceStepCard
              step={3}
              active={raceStep >= 2}
              title="3. MEV Sandwich"
              desc="Searchers bid +120 Gwei gas fee to front-run."
              risk
            />
            <RaceStepCard
              step={4}
              active={raceStep >= 3}
              title="4. Penalty Liquidated"
              desc="Borrower loses -8% liquidation bonus ($8.00 USD)."
              risk
              finalResult={raceStep >= 3 ? 'Loss: -$8.00' : null}
            />
          </div>
        </div>

        {/* Track 2: Aegis-F TEE Enclave Route (Green/Purple) */}
        <div style={{
          background: 'rgba(46, 212, 122, 0.03)',
          border: '1px solid rgba(46, 212, 122, 0.22)',
          borderRadius: '14px',
          padding: '18px 22px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} style={{ color: 'var(--money-green)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--money-green)' }}>
                Track B: Aegis-F Confidential TEE Enclave (Protected)
              </span>
            </div>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--money-green)' }}>
              Latency: &lt;340ms (Sub-Second Enclave Execution)
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            position: 'relative',
          }}>
            <RaceStepCard
              step={1}
              active={raceStep >= 1}
              title="1. FTSOv2 Ingestion"
              desc="Enclave reads ~1.8s feed off-mempool in RAM."
            />
            <RaceStepCard
              step={2}
              active={raceStep >= 2}
              title="2. Private Trigger"
              desc="Health factor <= 1.15 evaluated in encrypted RAM."
            />
            <RaceStepCard
              step={3}
              active={raceStep >= 2}
              title="3. Enclave PMW Sign"
              desc="Autonomous dynamic repay dispatched in <340ms."
            />
            <RaceStepCard
              step={4}
              active={raceStep >= 3}
              title="4. Position Saved"
              desc="Restored to 1.30 HF. 0 bytes mempool leakage."
              finalResult={raceStep >= 3 ? 'Saved: +$8.00' : null}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function RaceStepCard({ step, active, title, desc, risk, finalResult }) {
  return (
    <div style={{
      background: active
        ? (risk ? 'rgba(244, 63, 94, 0.08)' : 'rgba(46, 212, 122, 0.08)')
        : 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${active ? (risk ? 'var(--risk-red-border)' : 'var(--money-green-border)') : 'rgba(255, 255, 255, 0.05)'}`,
      borderRadius: '10px',
      padding: '12px 14px',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: active ? (risk ? 'var(--risk-red)' : 'var(--money-green)') : 'var(--text-secondary)' }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
        {desc}
      </p>
      {finalResult && (
        <div style={{
          marginTop: 8,
          fontSize: 11,
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: risk ? 'var(--risk-red)' : 'var(--money-green)',
        }}>
          {finalResult}
        </div>
      )}
    </div>
  );
}
