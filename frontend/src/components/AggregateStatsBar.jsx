import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import CountUp from './CountUp';
import { fetchKeeperStats } from '../services/keeperApi';

export default function AggregateStatsBar() {
  const [stats, setStats] = useState({
    totalValueProtectedUsd: 428500.0,
    totalMevSavedUsd: 17140.0,
    activeTriggers: 4,
    totalPositionsMonitored: 132,
    successfulRescues: 47,
    avgExecutionLatencyMs: 340,
    gasCostPerRescueUsd: 0.00028,
  });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      const data = await fetchKeeperStats();
      if (mounted && data) {
        setStats(prev => ({ ...prev, ...data }));
        setOnline(data.online !== false);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fintech-card"
      style={{
        padding: '20px 24px',
        marginBottom: 28,
        background: 'rgba(18, 18, 26, 0.65)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={16} style={{ color: 'var(--tech-purple)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Network Performance & Enclave Telemetry
          </span>
          <span className={`badge ${online ? 'badge--green' : 'badge--neutral'}`} style={{ fontSize: 9 }}>
            {online ? 'Live Telemetry' : 'Simulated Sandbox'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          GET /api/stats
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 14,
      }}>
        <MetricCard
          label="Total Value Protected"
          value={<>$<CountUp to={stats.totalValueProtectedUsd} decimals={0} /></>}
          sub="Cumulative borrower TVL"
        />
        <MetricCard
          label="Total MEV Saved"
          value={<>+$<CountUp to={stats.totalMevSavedUsd} decimals={0} /></>}
          sub="8% liquidation penalty avoided"
          color="var(--money-green)"
          highlightGreen
        />
        <MetricCard
          label="Monitored Positions"
          value={<CountUp to={stats.totalPositionsMonitored} decimals={0} />}
          sub={`${stats.activeTriggers} triggers active in TEE`}
        />
        <MetricCard
          label="Automated Rescues"
          value={<CountUp to={stats.successfulRescues} decimals={0} />}
          sub="Pre-mempool dynamic repayments"
          color="var(--money-green)"
        />
        <MetricCard
          label="Avg Execution Latency"
          value={`<${stats.avgExecutionLatencyMs}ms`}
          sub="Sub-second FTSOv2 ticks"
          color="var(--tech-purple)"
        />
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, sub, color = 'var(--text-primary)', highlightGreen }) {
  return (
    <div style={{
      background: highlightGreen ? 'rgba(46, 212, 122, 0.04)' : 'rgba(255, 255, 255, 0.015)',
      border: `1px solid ${highlightGreen ? 'rgba(46, 212, 122, 0.2)' : 'rgba(255, 255, 255, 0.04)'}`,
      borderRadius: '10px',
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{
        fontSize: '22px',
        fontWeight: 800,
        color,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.02em',
        marginBottom: 2,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
        {sub}
      </div>
    </div>
  );
}
