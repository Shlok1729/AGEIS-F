import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

import LandingHero                from './sections/LandingHero';
import PositionSetupPanel         from './sections/PositionSetupPanel';
import LiveMonitorDashboard       from './sections/LiveMonitorDashboard';
import EventLog                   from './sections/EventLog';
import ArchitectureStrip          from './sections/ArchitectureStrip';
import SustainabilitySection      from './sections/SustainabilitySection';
import NotFoundSection            from './sections/NotFoundSection';
import TerminalProofBlock         from './components/TerminalProofBlock';
import AppLoader                  from './components/AppLoader';
import CustomCursor               from './components/CustomCursor';
import DynamicRepayCalculator     from './components/DynamicRepayCalculator';
import ContractsVerificationPanel from './components/ContractsVerificationPanel';
import AggregateStatsBar          from './components/AggregateStatsBar';
import DemoHeaderBar              from './components/DemoHeaderBar';
import WalletButton               from './components/WalletButton';
import WalletModal                from './components/WalletModal';
import TeeAttestationModal        from './components/TeeAttestationModal';
import PredatorRaceVisualizer     from './components/PredatorRaceVisualizer';
import { ASSET_PROFILES } from './components/AssetSelector';
import SharedAssetHeader from './components/SharedAssetHeader';
import BlackSwanStressTester      from './components/BlackSwanStressTester';
import PortfolioRiskHeatmap       from './components/PortfolioRiskHeatmap';
import CountUp                    from './components/CountUp';
import { useWallet }              from './services/WalletContext';
import { formatAddress, CONTRACT_ADDRESSES } from './services/walletService';
import { simulatePriceOnKeeper, registerTriggerOnKeeper } from './services/keeperApi';
import { playClickSound, playRescueChime, playAlertBeep, isAudioMuted, toggleAudioMute } from './services/audioService';
import { Shield, Play, Calculator, FileCheck, CheckCircle2, Cpu, Volume2, VolumeX, LayoutGrid, ArrowRight, Menu, X } from 'lucide-react';

// ─── Utilities ─────────────────────────────────────────────────────────────

const now = () => new Date().toTimeString().slice(0, 8) + '.' + String(Date.now() % 1000).padStart(3, '0');

let logId = 1;
const mkLog = (text, type = 'info', extra = {}) => ({
  id: logId++,
  time: now(),
  text,
  type,
  prefix: '>',
  ...extra,
});

function getInitialView() {
  const path = window.location.pathname.toLowerCase();
  if (path === '/' || path === '/index.html') return 'home';
  if (path.includes('/demo')) return 'demo';
  if (path.includes('/simulator')) return 'simulator';
  if (path.includes('/portfolio')) return 'portfolio';
  if (path.includes('/proofs')) return 'proofs';
  return 'not-found';
}

export default function App() {
  const { account, signTrigger } = useWallet();

  // ── Route View State ──
  const [currentView, setCurrentView] = useState(getInitialView);
  const [demoStep, setDemoStep]       = useState(1);
  const [isArming, setIsArming]       = useState(false);
  const [isAttestationOpen, setIsAttestationOpen] = useState(false);
  const [muted, setMuted]             = useState(isAudioMuted);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Active Asset Selection ──
  const [selectedAssetKey, setSelectedAssetKey] = useState('FLR');
  const activeAsset = ASSET_PROFILES[selectedAssetKey] || ASSET_PROFILES.FLR;

  const [isNavigating, setIsNavigating] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      // 1. Wait for heavy fonts (e.g., JetBrains Mono, Plus Jakarta Sans) to be completely ready
      if (document.fonts) {
        await document.fonts.ready;
      }
      // 2. Ensure React has flushed its paints
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (isMounted) {
            // Buffer to simulate core engine mount + prevent jarring flash if it loads too fast
            setTimeout(() => setIsAppReady(true), 800);
          }
        });
      });
    };

    if (document.readyState === 'complete') {
      initializeApp();
    } else {
      window.addEventListener('load', initializeApp);
      return () => window.removeEventListener('load', initializeApp);
    }
    return () => { isMounted = false; };
  }, []);

  const navigate = useCallback((viewName) => {
    playClickSound();
    setIsNavigating(true);
    
    // Artificial 600ms loader to simulate Enclave routing / hardware checks
    setTimeout(() => {
      setCurrentView(viewName);
      const path = viewName === 'home' ? '/' : `/${viewName}`;
      if (window.location.pathname !== path) {
        window.history.pushState({ view: viewName }, '', path);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      setIsNavigating(false);
    }, 600);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setCurrentView(getInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // ── Market state ──
  const [flrPrice,       setFlrPrice]       = useState(activeAsset.basePrice);
  const [lastTick,       setLastTick]       = useState(Date.now());
  const [isSimAttacking, setIsSimAttacking] = useState(false);

  // ── Position / TEE config ──
  const [config, setConfig] = useState({
    collateralFlr: activeAsset.defaultCollateral,
    debtUsd:       activeAsset.defaultDebt,
    thresholdHf:   1.15,
    repayUsd:      Math.round(activeAsset.defaultDebt * 0.40),
  });
  const [teeArmed,        setTeeArmed]       = useState(false);
  const [vaultReserveUsd, setVaultReserveUsd] = useState(Math.round(activeAsset.defaultDebt * 0.50));
  const [mevSavings,      setMevSavings]      = useState(null);

  // ── Handle Asset Switch ──
  const handleSelectAsset = (key, asset) => {
    setSelectedAssetKey(key);
    setFlrPrice(asset.basePrice);
    setConfig({
      collateralFlr: asset.defaultCollateral,
      debtUsd:       asset.defaultDebt,
      thresholdHf:   1.15,
      repayUsd:      Math.round(asset.defaultDebt * 0.40),
    });
    setVaultReserveUsd(Math.round(asset.defaultDebt * 0.50));
    setTeeArmed(false);
    addLog(`Switched active FTSOv2 asset to ${asset.pair}`, 'price');
  };

  // ── Event log ──
  const [logs, setLogs] = useState([
    mkLog('Confidential enclave initialized. Coston2 RPC connected.', 'info'),
    mkLog('FTSOv2 feed active: FLR/USD (0x01464c522f555344...)', 'price'),
    mkLog('Designated TEE Keeper active: 0xB45f8a4946cD15bb6f208BF3372934b5946a1B38', 'tee'),
  ]);

  const addLog = useCallback((text, type, extra) => {
    setLogs(prev => [...prev, mkLog(text, type, extra)]);
  }, []);

  // ── Derived math ──
  const collateralUsd   = config.collateralFlr * flrPrice;
  const liqThreshold    = collateralUsd * (activeAsset.collateralFactor || 0.85);
  const healthFactor    = config.debtUsd > 0 ? liqThreshold / config.debtUsd : Infinity;

  // ── FTSOv2 tick simulation (~1.8s organic cadence) ──
  useEffect(() => {
    const iv = setInterval(() => {
      if (isSimAttacking) return;
      const jitter = (Math.random() - 0.5) * 0.012 * flrPrice;
      setFlrPrice(p => {
        const next = Math.max(activeAsset.basePrice * 0.3, +(p + jitter).toFixed(activeAsset.decimals));
        return next;
      });
      setLastTick(Date.now());
    }, 1800);
    return () => clearInterval(iv);
  }, [isSimAttacking, flrPrice, activeAsset]);

  // ── TEE trigger execution loop ──
  useEffect(() => {
    if (!teeArmed) return;
    if (!isFinite(healthFactor)) return;
    if (healthFactor > config.thresholdHf) return;
    if (config.debtUsd <= 0) return;

    playAlertBeep();

    const t = setTimeout(() => {
      const actualRepay = Math.min(config.debtUsd, config.repayUsd);
      const newDebt     = config.debtUsd - actualRepay;
      const newReserve  = Math.max(0, vaultReserveUsd - actualRepay);
      const txHash      = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      setConfig(c => ({ ...c, debtUsd: newDebt }));
      setVaultReserveUsd(newReserve);
      setTeeArmed(false);

      setMevSavings({ debtUsdAtTrigger: config.debtUsd, repaidUsd: actualRepay });

      addLog(`Health factor breached threshold: ${healthFactor.toFixed(4)} ≤ ${config.thresholdHf.toFixed(2)}`, 'trigger');
      addLog(`Enclave signed executeProtection: dynamic debt repayment of $${actualRepay.toLocaleString()} USD`, 'tee');
      addLog(
        `Repayment confirmed on Coston2. New debt: $${newDebt.toLocaleString()}. New HF: ${newDebt > 0 ? (liqThreshold / newDebt).toFixed(4) : '∞'}`,
        'success',
        { txHash }
      );
      addLog(`Front-running preempted. MEV penalty avoided.`, 'success');

      playRescueChime();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.55 }, colors: ['#2ED47A', '#9B7FFF', '#60A5FA'] });
      } catch (_) {}
    }, 380);

    return () => clearTimeout(t);
  }, [healthFactor, teeArmed, config, vaultReserveUsd, liqThreshold, addLog]);

  const handleConfigChange = useCallback((field, value) => {
    setConfig(c => ({ ...c, [field]: value }));
  }, []);

  const handleRegisterAndAdvance = useCallback(async () => {
    playClickSound();
    setIsArming(true);
    try {
      if (account) {
        addLog(`Requesting EIP-191 signature from ${formatAddress(account)}…`, 'info');
        const sigResult = await signTrigger({
          thresholdHf: config.thresholdHf,
          repayUsd: config.repayUsd,
        });
        addLog(`EIP-191 signature verified in enclave RAM: ${sigResult.signature.slice(0, 20)}…`, 'tee');
      }

      setTeeArmed(true);
      addLog(`Position registered in TEE. Trigger: HF ≤ ${config.thresholdHf.toFixed(2)}`, 'tee');

      const result = await registerTriggerOnKeeper({
        borrower:    account || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        thresholdHf: config.thresholdHf,
        repayUsd:    config.repayUsd,
      });
      if (result.online !== false && result.triggerId) {
        addLog(`Enclave trigger confirmed: ID ${result.triggerId}`, 'tee');
      }

      setDemoStep(2);
    } catch (err) {
      console.warn('Registration cancelled or failed:', err);
      addLog(`Signature or registration cancelled`, 'warn');
    } finally {
      setIsArming(false);
    }
  }, [account, config, vaultReserveUsd, signTrigger, addLog]);

  const handleSimulateDrop = useCallback(async (price, scenarioName) => {
    setIsSimAttacking(true);
    setFlrPrice(price);
    setLastTick(Date.now());
    addLog(`Price move simulated ${scenarioName ? `(${scenarioName})` : ''}: ${activeAsset.symbol}/USD = $${price.toLocaleString()}`, 'warn');
    setTimeout(() => setIsSimAttacking(false), 2000);

    const result = await simulatePriceOnKeeper(price);
    if (result.online !== false) {
      addLog(`Live keeper notified of price tick $${price.toLocaleString()}`, 'check');
    }
  }, [activeAsset, addLog]);

  const handleReset = useCallback(() => {
    playClickSound();
    setFlrPrice(activeAsset.basePrice);
    setIsSimAttacking(false);
    setConfig({
      collateralFlr: activeAsset.defaultCollateral,
      debtUsd:       activeAsset.defaultDebt,
      thresholdHf:   1.15,
      repayUsd:      Math.round(activeAsset.defaultDebt * 0.40),
    });
    setVaultReserveUsd(Math.round(activeAsset.defaultDebt * 0.50));
    setTeeArmed(false);
    setMevSavings(null);
    setLastTick(Date.now());
    setDemoStep(1);
    addLog('Scenario reset to baseline parameters.', 'info');
  }, [activeAsset, addLog]);

  const handleToggleSound = () => {
    const isNowMuted = !toggleAudioMute();
    setMuted(isNowMuted);
    if (!isNowMuted) playClickSound();
  };

  // ── Top Navigation Bar ──
  const NavBar = () => (
    <>
      {/* ── Secondary Status Bar ── */}
      <div className="status-bar-container" style={{
        background: 'rgba(10, 10, 15, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 11
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setIsAttestationOpen(true);
            }}
            style={{ 
              fontSize: 10, padding: '3px var(--space-2)', borderRadius: 'var(--radius-sm)', gap: 'var(--space-1)',
              display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)',
              border: '1px solid var(--border-card)', color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Click to view hardware remote attestation quote"
          >
            <Cpu size={11} style={{ color: 'var(--tech-purple)' }} />
            <span>FCC Attestation Active</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)' }}>
          <span
            className="pulse-dot"
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--flare-blue)', display: 'inline-block' }}
          />
          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{activeAsset.symbol}/USD</span>
          <span style={{ color: 'var(--flare-blue)', fontWeight: 700 }}>
            $<CountUp to={flrPrice} decimals={activeAsset.decimals} />
          </span>
        </div>
      </div>

      <header className="app-header">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            onClick={() => navigate('home')}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 18,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
              cursor: 'pointer',
            }}
          >
            Aegis<span style={{ color: 'var(--tech-purple)' }}>-F</span>
          </span>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="nav-links-desktop">
          <button
            type="button"
            className={`btn ${currentView === 'home' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('home'); }}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: '8px' }}
          >
            Overview
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'demo' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('demo'); }}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: '8px' }}
          >
            Live Demo
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'simulator' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('simulator'); }}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: '8px' }}
          >
            Calculator
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'portfolio' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('portfolio'); }}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: '8px' }}
          >
            Portfolio
          </button>
        </nav>

        {/* Right Controls: Sound, Wallet, Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="btn btn--surface"
            style={{ padding: '6px', borderRadius: '8px', color: muted ? 'var(--text-muted)' : 'var(--tech-purple)' }}
            title={muted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <WalletButton />

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-dropdown">
          <button
            type="button"
            className={`btn ${currentView === 'home' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('home'); }}
          >
            Overview
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'demo' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('demo'); }}
          >
            Live Demo
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'simulator' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('simulator'); }}
          >
            Calculator
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'portfolio' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('portfolio'); }}
          >
            Portfolio Desk
          </button>
          <button
            type="button"
            className={`btn ${currentView === 'proofs' ? 'btn--primary' : 'btn--surface'}`}
            onClick={() => { setIsMobileMenuOpen(false); navigate('proofs'); }}
          >
            Proofs
          </button>
        </div>
      )}
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
      <CustomCursor />
      <AnimatePresence>
        {!isAppReady && <AppLoader key="app-loader-init" message="Mounting UI & Fonts..." />}
        {isAppReady && isNavigating && <AppLoader key="app-loader-nav" message="Attesting Enclave Hardware..." />}
      </AnimatePresence>
      
      {/* Background Timeline Axis */}
      <div className="timeline-grid-bg" />
      <div className="timeline-axis-line" />

      <NavBar />

      <main className="main-app-container">

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 1: HOME (FOCUSED, CLEAN OVERVIEW)
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <LandingHero
              onEnterDemo={() => navigate('demo')}
              onOpenSimulator={() => navigate('simulator')}
              flrPrice={flrPrice}
            />

            {/* 3-Pillar Value Proof Strip */}
            <div style={{ margin: '80px 0 60px' }}>
              <AggregateStatsBar />
            </div>

            {/* Execution Proof Trace Block (Single focused technical proof) */}
            <div style={{ 
              marginBottom: 80,
              background: 'rgba(255, 255, 255, 0.015)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-7) var(--space-6)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span className="badge badge--purple" style={{ fontSize: 10, marginBottom: 12 }}>
                  Zero Mempool Leakage Proof
                </span>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confidential Enclave vs. Public Mempool Execution
                </h2>
              </div>
              <TerminalProofBlock />
            </div>

            {/* Clean CTA Card to Demo */}
            <div style={{
              background: 'rgba(155, 127, 255, 0.04)',
              border: '1px solid rgba(155, 127, 255, 0.18)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--tech-purple)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ready to test?
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                  Launch the 2-step interactive simulation on Flare Coston2
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Configure your collateral, sign an off-chain EIP-191 trigger, and watch the enclave rescue your loan in sub-340ms.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('demo')}
                className="btn btn--primary"
                style={{ padding: '12px 28px', fontSize: 14, borderRadius: '10px' }}
              >
                <Play size={15} />
                <span>Launch Live Demo</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 2: LIVE DEMO (FOCUSED 2-STEP STEPPER)
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'demo' && (
          <motion.div
            key="demo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ padding: '24px 0 16px' }}>
              <DemoHeaderBar
                flrPrice={flrPrice}
                teeArmed={teeArmed}
                onReset={handleReset}
              />
            </div>

            {/* Asset Selector */}
            <SharedAssetHeader
              selectedAsset={selectedAssetKey}
              onSelectAsset={handleSelectAsset}
            />

            {/* Step Navigation Tabs */}
            <div className="grid-responsive-2" style={{ marginBottom: 24 }}>
              <StepperTab
                stepNumber={1}
                title="Configure Position & Arm TEE"
                subtitle="Set collateral, private threshold & sign EIP-191 trigger"
                active={demoStep === 1}
                completed={demoStep > 1 || teeArmed}
                onClick={() => setDemoStep(1)}
              />
              <StepperTab
                stepNumber={2}
                title="Simulate Market Crash & Enclave Rescue"
                subtitle="Trigger organic drop, watch MEV preempted before liquidation"
                active={demoStep === 2}
                completed={mevSavings !== null}
                onClick={() => setDemoStep(2)}
              />
            </div>

            <div className="demo-layout-grid">
              {/* ── Left Column (Control) ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Step 1: Position Setup Panel */}
                {demoStep === 1 && (
                  <PositionSetupPanel
                    config={config}
                    onChange={handleConfigChange}
                    onRegister={handleRegisterAndAdvance}
                    isArming={isArming}
                  />
                )}

                {/* Step 2: BlackSwan Stress Tester (Control side) */}
                {demoStep === 2 && (
                  <BlackSwanStressTester
                    currentPrice={flrPrice}
                    onTriggerScenario={handleSimulateDrop}
                  />
                )}
              </div>

              {/* ── Right Column (Output / Monitoring) ── */}
              <div className="demo-sticky-col">
                {/* Step 2: Live Monitor Dashboard */}
                {demoStep === 2 && (
                  <LiveMonitorDashboard
                    flrPrice={flrPrice}
                    config={config}
                    teeArmed={teeArmed}
                    vaultReserveUsd={vaultReserveUsd}
                    mevSavings={mevSavings}
                    onSimulateDrop={handleSimulateDrop}
                    onReset={handleReset}
                    lastTick={lastTick}
                  />
                )}
                
                {/* Persistent Execution Event Log */}
                <EventLog logs={logs} />
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 3: DYNAMIC SIMULATOR & CALCULATOR
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'simulator' && (
          <motion.div
            key="simulator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ padding: '24px 0' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span className="badge badge--neutral" style={{ fontSize: 10, marginBottom: 8 }}>
                Risk Engine & Math Sandbox
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Dynamic Debt Repayment Formula Calculator
              </h2>
            </div>

            <SharedAssetHeader
              selectedAsset={selectedAssetKey}
              onSelectAsset={handleSelectAsset}
            />

            <DynamicRepayCalculator
              liveFlrPrice={flrPrice}
              onEnterDemo={() => navigate('demo')}
            />

            <div style={{ marginTop: 32 }}>
              <PredatorRaceVisualizer />
            </div>

            <div style={{ marginTop: 24 }}>
              <SustainabilitySection />
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 4: INSTITUTIONAL PORTFOLIO DESK
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'portfolio' && (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ paddingTop: 'var(--space-4)' }}
          >
            <div style={{ marginBottom: 'var(--space-5)', textAlign: 'center' }}>
              <span className="badge badge--neutral" style={{ fontSize: 10, marginBottom: 'var(--space-3)' }}>
                Institutional Monitoring Desk
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
                Multi-Asset Risk & Enclave Orchestration Desk
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600, margin: '0 auto' }}>
                Monitor system-wide health factors and simulate real-time liquidation scenarios backed by hardware-level execution guarantees.
              </p>
            </div>

            <PortfolioRiskHeatmap onOpenPosition={() => navigate('demo')} />
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 5: VERIFIED PROOFS & HARDWARE ATTESTATION
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'proofs' && (
          <motion.div
            key="proofs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ paddingTop: 'var(--space-4)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
              <span className="badge badge--green" style={{ fontSize: 10, marginBottom: 'var(--space-3)' }}>
                Flare Coston2 & TEE Verifications
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
                Smart Contracts, Compilers & Enclave Proofs
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 600, margin: '0 auto' }}>
                Cryptographic attestations verifying that our execution enclaves match their open-source blueprints and operate with zero mempool leakage.
              </p>
            </div>

            <ContractsVerificationPanel />

            <div style={{ marginTop: 32 }}>
              <ArchitectureStrip />
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DESTINATION 6: NOT FOUND ROUTE
            ══════════════════════════════════════════════════════════════════════ */}
        {currentView === 'not-found' && (
          <NotFoundSection onGoHome={() => navigate('home')} />
        )}

      </main>

      {/* Account Details & Vault Deposit Modal */}
      <WalletModal />
      <TeeAttestationModal isOpen={isAttestationOpen} onClose={() => setIsAttestationOpen(false)} />
    </div>
  );
}

// ── Helper Component: Stepper Tab ──────────────────────────────────────────

function StepperTab({ stepNumber, title, subtitle, active, completed, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`stepper-tab ${active ? 'stepper-tab--active' : ''} ${completed ? 'stepper-tab--completed' : ''}`}
    >
      <div className="stepper-tab-header">
        <span className="stepper-tab-number">
          {completed && !active ? '✓' : stepNumber}
        </span>
        <span className="stepper-tab-title">
          {title}
        </span>
      </div>
      <div className="stepper-tab-subtitle">
        {subtitle}
      </div>
    </button>
  );
}
