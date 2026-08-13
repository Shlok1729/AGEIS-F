import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Shield, ArrowRight, Play, Cpu, Lock, CheckCircle2 } from 'lucide-react';
import HeroPositionTicket from '../components/HeroPositionTicket';

export default function LandingHero({ onEnterDemo, onOpenSimulator, flrPrice = 0.035 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.45 })
        .from('.hero-headline-word', { opacity: 0, y: 22, stagger: 0.05, duration: 0.65 }, '-=0.2')
        .from('.hero-subtext', { opacity: 0, y: 14, duration: 0.5 }, '-=0.3')
        .from('.hero-cta-group', { opacity: 0, y: 12, duration: 0.4 }, '-=0.3')
        .from('.hero-card', { opacity: 0, x: 20, duration: 0.55 }, '-=0.3');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} style={{ padding: '56px 0 40px' }}>
      <div className="landing-hero-grid">
        {/* Left Column: Copy & Actions */}
        <div>
          {/* Eyebrow */}
          <div className="hero-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            <span className="badge badge--purple" style={{ fontSize: 11 }}>
              <Cpu size={12} />
              <span>Flare Confidential Compute (FCC)</span>
            </span>
            <span className="badge badge--green" style={{ fontSize: 11 }}>
              <CheckCircle2 size={12} />
              <span>FTSOv2 Sub-Second Oracles</span>
            </span>
          </div>

          {/* Headline with Word Stagger */}
          <h1 style={{
            fontSize: 'clamp(32px, 4.2vw, 48px)',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            lineHeight: 1.18,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            <span className="hero-headline-word" style={{ display: 'inline-block', marginRight: '0.28em' }}>Confidential</span>
            <span className="hero-headline-word" style={{ display: 'inline-block', marginRight: '0.28em' }}>DeFi</span>
            <span className="hero-headline-word" style={{ display: 'inline-block', marginRight: '0.28em' }}>Lending</span>
            <span className="hero-headline-word" style={{ display: 'inline-block', marginRight: '0.28em' }}>Defense.</span>
            <br />
            <span className="hero-headline-word gradient-text" style={{ display: 'inline-block', fontWeight: 800 }}>
              Zero Mempool Front-Running.
            </span>
          </h1>

          {/* Subtext */}
          <p className="hero-subtext" style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            maxWidth: 560,
            marginBottom: 32,
          }}>
            Aegis-F operates an autonomous risk keeper inside Flare Hardware TEE Enclaves.
            It privately monitors your Kinetic lending health factor and executes dynamic debt repayments
            using sub-second FTSOv2 price feeds before predatory MEV searchers can front-run your stop-loss.
          </p>

          {/* CTAs */}
          <div className="hero-cta-group" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onEnterDemo}
              className="btn btn--primary"
              style={{ fontSize: 14, padding: '12px 26px', borderRadius: '10px' }}
            >
              <Play size={15} />
              <span>Launch Live Demo</span>
            </button>

            <button
              type="button"
              onClick={onOpenSimulator}
              className="btn btn--surface"
              style={{ fontSize: 14, padding: '12px 22px', borderRadius: '10px' }}
            >
              <span>Dynamic Simulator</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Trust Metric Strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: 36,
            paddingTop: 24,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Oracle Latency
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                &lt;340ms
              </span>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.08)' }} />

            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Front-Run MEV Leakage
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--money-green)' }}>
                0.00%
              </span>
            </div>

            <div style={{ width: 1, height: 28, background: 'rgba(255, 255, 255, 0.08)' }} />

            <div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>
                Flare Coston2 Tests
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--tech-purple)' }}>
                13/13 Passing
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Live Position Ticket */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <HeroPositionTicket
            flrPrice={flrPrice}
            collateralFlr={1000}
            debtUsd={20}
            thresholdHf={1.15}
            teeArmed={true}
            onOpenDemo={onEnterDemo}
          />
        </div>
      </div>
    </section>
  );
}
