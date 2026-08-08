import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import CountUp from '../components/CountUp';

/**
 * FeedStrip — Priority 1: Multi-feed FTSOv2 dashboard strip
 *
 * Feed IDs verified from dev.flare.network/ftso/feeds:
 *   FLR/USD  0x01464c522f55534400000000000000000000000000
 *   BTC/USD  0x014254432f55534400000000000000000000000000
 *   ETH/USD  0x014554482f55534400000000000000000000000000
 *   XRP/USD  0x015852502f55534400000000000000000000000000
 *
 * In the demo these tick via simulated jitter matching ~1.8s cadence.
 * Only the FLR/USD feed is visually connected to the HF calculation (highlighted border).
 */

const FEEDS = [
  {
    id: 'FLR/USD',
    feedId: '0x01464c522f55534400000000000000000000000000',
    label: 'FLR/USD',
    decimals: 5,
    basePrice: 0.035,
    jitterPct: 0.008,   // ±0.8% per tick
    primary: true,      // Connected to HF calculation
    color: 'var(--mauve)',
    bgColor: 'rgba(203,166,247,0.06)',
    borderColor: 'rgba(203,166,247,0.35)',
  },
  {
    id: 'BTC/USD',
    feedId: '0x014254432f55534400000000000000000000000000',
    label: 'BTC/USD',
    decimals: 2,
    basePrice: 108420.0,
    jitterPct: 0.003,
    primary: false,
    color: 'var(--peach)',
    bgColor: 'rgba(250,179,135,0.04)',
    borderColor: 'rgba(250,179,135,0.15)',
  },
  {
    id: 'ETH/USD',
    feedId: '0x014554482f55534400000000000000000000000000',
    label: 'ETH/USD',
    decimals: 2,
    basePrice: 3280.0,
    jitterPct: 0.004,
    primary: false,
    color: 'var(--blue)',
    bgColor: 'rgba(137,180,250,0.04)',
    borderColor: 'rgba(137,180,250,0.12)',
  },
  {
    id: 'XRP/USD',
    feedId: '0x015852502f55534400000000000000000000000000',
    label: 'XRP/USD',
    decimals: 4,
    basePrice: 2.2140,
    jitterPct: 0.006,
    primary: false,
    color: 'var(--teal)',
    bgColor: 'rgba(148,226,213,0.04)',
    borderColor: 'rgba(148,226,213,0.12)',
  },
];

export default function FeedStrip({ flrPriceOverride, lastTick }) {
  // Independent price state per feed
  const pricesRef = useRef(FEEDS.map(f => f.basePrice));
  const [prices, setPrices] = React.useState(FEEDS.map(f => f.basePrice));
  const tickRefs  = useRef(FEEDS.map(() => React.createRef()));
  const secondsRef = useRef(null);
  const [secondsAgo, setSecondsAgo] = React.useState(0);

  // Sync the FLR/USD feed to the parent-controlled price
  useEffect(() => {
    if (flrPriceOverride != null) {
      pricesRef.current[0] = flrPriceOverride;
      setPrices(prev => {
        const next = [...prev];
        next[0] = flrPriceOverride;
        return next;
      });
    }
  }, [flrPriceOverride]);

  // Tick non-FLR feeds independently
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => {
        const next = [...prev];
        FEEDS.forEach((f, i) => {
          if (f.primary) return; // FLR/USD controlled by parent
          const jitter = (Math.random() - 0.5) * 2 * f.jitterPct;
          next[i] = +(prev[i] * (1 + jitter)).toFixed(f.decimals);
        });
        pricesRef.current = next;
        return next;
      });
    }, 1800);
    return () => clearInterval(iv);
  }, []);

  // "Xs ago" ticker relative to lastTick
  useEffect(() => {
    const iv = setInterval(() => {
      if (lastTick) setSecondsAgo(Math.round((Date.now() - lastTick) / 1000));
    }, 500);
    return () => clearInterval(iv);
  }, [lastTick]);

  // GSAP pulse on price change for each feed
  useEffect(() => {
    FEEDS.forEach((f, i) => {
      const el = document.getElementById(`feed-price-${f.id}`);
      if (!el) return;
      gsap.fromTo(el,
        { color: f.color, scale: 1.06 },
        { color: 'var(--text)', scale: 1, duration: 0.4, ease: 'power2.out' }
      );
    });
  }, [prices]);

  return (
    <div style={{
      border: '1px solid var(--border-dim)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 16,
    }}>
      {/* Strip header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 14px',
        background: 'var(--mantle)',
        borderBottom: '1px solid var(--border-dim)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--overlay2)',
      }}>
        <span
          style={{
            display: 'inline-block', width: 7, height: 7,
            borderRadius: '50%', background: 'var(--blue)',
          }}
          className="pulse"
        />
        <span>FTSOv2 Live Feeds</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--overlay0)', fontWeight: 400 }}>
          ~1.8s block-latency · {FEEDS.length} feeds
          {lastTick ? ` · last tick ${secondsAgo}s ago` : ''}
        </span>
        <span className="badge badge--blue" style={{ fontSize: 9, marginLeft: 8 }}>PUBLIC / ON-CHAIN</span>
      </div>

      {/* Feeds row */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${FEEDS.length}, 1fr)` }}>
        {FEEDS.map((feed, i) => (
          <div
            key={feed.id}
            style={{
              padding: '12px 16px',
              background: feed.bgColor,
              borderRight: i < FEEDS.length - 1 ? '1px solid var(--border-dim)' : 'none',
              borderLeft: feed.primary ? `2px solid ${feed.color}` : 'none',
              position: 'relative',
            }}
          >
            {/* Primary badge */}
            {feed.primary && (
              <div style={{
                position: 'absolute',
                top: 6,
                right: 8,
                fontSize: 9,
                fontWeight: 700,
                color: feed.color,
                letterSpacing: '0.08em',
              }}>
                ▲ POSITION FEED
              </div>
            )}

            <div style={{ fontSize: 10, color: feed.color, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 5 }}>
              {feed.label}
            </div>

            <div
              id={`feed-price-${feed.id}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.01em',
              }}
            >
              $<CountUp to={prices[i]} decimals={feed.decimals} />
            </div>

            <div style={{ fontSize: 10, color: 'var(--overlay0)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {feed.feedId.slice(0, 10)}…
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
