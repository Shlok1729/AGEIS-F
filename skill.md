---
name: fintech-premium-frontend
description: Design and build premium, production-ready fintech/Web3 landing pages and product UI — the "financial infrastructure" aesthetic (trade tickets, terminal/revert-error blocks, live interactive calculators, deployed-contract verification panels) in a black/white/purple/green money-coded palette, animated with Framer Motion, GSAP, and React Bits. Use whenever the user asks for a "premium" or "production-ready" design, a landing page for a fintech/DeFi/RWA/trading product, or mentions Tenor-style trade UI, bond calculators, settlement timelines, or wants the site to "feel expensive" / "not look like AI slop."
---

# Fintech Premium Frontend

This skill encodes a design system and animation stack refined over several rounds of critique on a real product (Tenor — a forward-settlement desk for tokenized real-world assets). The throughline across every round of feedback: **prove the product, don't decorate around it.** Real trade data, real terminal output, real contract addresses, real interactive math — beat stock illustrations and vague gradients every time. Read `/mnt/skills/public/frontend-design/SKILL.md` too if present; that skill's general anti-genericism principles still apply. This skill is the fintech-specific specialization plus the motion-engineering layer.

## Design philosophy

1. **Show the product, not a metaphor for the product.** A live trade-ticket panel with real field values (`Trade #0042`, `Settlement +30 days`, `Bond Required 87.5 tUSD`) beats a hero illustration every time. If the product has state, numbers, or a UI of its own — show that UI as the hero visual.
2. **Terminal/proof blocks over prose claims.** Don't say "our system catches this edge case" — show the actual API response next to the actual on-chain revert (`APassExpired(0x570ac889...)`). A code block with a real error is more convincing than three paragraphs of explanation.
3. **Interactive math over static numbers.** If the product involves a formula (a bond rate, a fee, a rate curve), ship it as a live calculator with sliders, not a table of examples. Users trust a number they made themselves.
4. **Real verification over trust-me claims.** Deployed contract addresses with Sourcify/Etherscan links and a Copy button. Test counts. Compiler versions. This is the fintech-specific trust layer — a technical audience checks these.
5. **One signature moment, not five competing ones.** Pick the hero interaction (usually the live product panel or the calculator) and let everything else use restrained, consistent motion. If every card has its own hover tilt and its own entrance stagger, nothing reads as intentional.
6. **No AI-slop tells:** no emoji as icons (ever — use a real icon set), no unmotivated gradient blobs, no generic rounded-friendly display type on a technical product, no stock photography, no fabricated social proof numbers.

## Color system — black / white / purple / green ("money" coding)

The palette should do semantic work, not just look good:

| Token | Role | Why |
|---|---|---|
| Near-black (`#0A0A0F`–`#0D0D12`) | Page background | Terminal/trading-desk base. Never pure `#000` — slight blue/purple undertone reads more "fintech" than flat black. |
| Off-white (`#F5F3F7`–`#FAFAFA`) | Primary headline/body text | Never pure `#FFF` on near-black — slight warmth or lavender tint avoids harsh contrast fatigue. |
| Green (`#2ED47A`–`#22C55E` range) | Money/value semantics only | Live status dots, positive amounts, "verified"/"passing" states, settlement success. Reserve green *specifically* for "this is good / this is money / this is confirmed" — don't use it decoratively elsewhere or it dilutes the signal. |
| Purple (`#7C5CFC`–`#9B7FFF` range) | Tech/premium/proof accent | Gradient text on "proof" words (mirrors the pattern from earlier rounds — apply consistently to one key phrase per section heading, e.g. "the wrong question," "Zero ambiguity," "Verified"), interactive element accents (calculator borders, active tab states). |
| Red/rose (`#F43F5E`–`#FB7185` range) | Risk/error/critical-finding only | Revert errors, "buyer expiry" countdowns, critical-finding callout borders. Never use red decoratively — it should always mean "pay attention, risk." |

**Gradient discipline:** purple→pink→blue text gradients are a system, not a one-off effect. Apply them to exactly one accent phrase per major section heading. If every word is gradient, none of them read as emphasis.

**Backgrounds:** avoid generic radial glow blobs. Prefer motifs drawn from the subject — a faint tick-mark settlement-timeline axis (T+0 → T+180d) running the full page height behind all sections is the pattern that worked here: it ties disconnected sections into one continuous surface and reinforces the product's actual domain (forward settlement, time-based risk). Opacity 5-8%, never competing with foreground content.

## Typography

- Headline face: something with mechanical/engineered character — a tighter grotesque or a face with slight monospace DNA — not a soft rounded sans. This is a technical financial product; the type should feel like it belongs next to a terminal block, not a consumer app.
- Terminal/code content: a real monospace (JetBrains Mono fits this user's existing aesthetic identity — Catppuccin/terminal-native setups).
- Numbers that matter (bond rate, prices, addresses): monospace or tabular-figure treatment so digits align — financial UIs lose credibility instantly when numbers aren't tabular.

## Iconography

Tabler outline icon set or an equivalent consistent line-icon system. **Never emoji** — the single most common "this looks unfinished" tell in fintech UI. One stroke weight, one size scale, colored via the semantic tokens above (green for confirm, red for risk, purple for feature/tech).

## Signature component patterns

Reusable patterns proven across this product's review cycles — reach for these before inventing new layouts:

- **Trade ticket card**: bordered panel, right-aligned or hero-adjacent, showing live-feeling state (an "Open" status pill, a countdown, a monospace ID). This is usually the single strongest hero element — build it before anything else.
- **Terminal/revert-error block**: three-dot window chrome, monospace body, a highlighted error line in the risk-red token. Pair prose claims with one of these whenever the claim is "the system catches X."
- **Interactive calculator**: sliders bound to a real formula, output numbers that tween/count-up on change (not snap instantly), a one-line plain-English interpretation below the output ("At subTier 5, a 15-day gap costs 4.14% of trade value").
- **Numbered mechanism timeline**: only justified when the process is genuinely sequential (5 steps, in order). Connect numbered circles with a line that fills/draws in as the user scrolls past each step rather than sitting static.
- **Deployed-contracts / verification panel**: address + Copy button + external verifier link (Sourcify/Etherscan) + exact-match/partial-match status, plus a row of build metadata chips (compiler version, EVM target, test count). This is the fintech-specific trust closer — put it late in the page, after the product has been explained.
- **Multi-beat demo selector**: tabbed "Beat 01/02/03" cards showing different scenarios, each revealing an execution-trace log (real command sequence, real revert) rather than a screenshot.

## Animation stack — Framer Motion + GSAP + React Bits

Same division-of-labor rule as always: **one engine owns one element**, decided before writing code, or you get two engines fighting over the same `transform` in the same frame.

| Job | Owner | Why |
|---|---|---|
| Scroll-linked / scrubbed animation (pin, reveal-on-scroll, timeline-axis marker highlighting, mechanism-line draw-in) | **GSAP + ScrollTrigger** | Robust pinning/scrubbing/batch-stagger at scale; use `ScrollTrigger.batch()` for card grids so reveals fire once, batched, not per-card. |
| Component mount/unmount, route transitions, tab/beat switching | **Framer Motion** (`AnimatePresence`, `layout`, `layoutId`) | State-driven animation tied to React's render cycle; GSAP has no concept of unmount and will leak timelines if used here. |
| Gesture-driven interaction (hover, tap, drag, magnetic buttons) | **Framer Motion** | Spring physics and gesture recognizers (`whileHover`, `whileTap`) built for this. |
| Complex orchestrated sequences (hero load-in choreographed across 5+ elements, headline word/char stagger) | **GSAP timelines** | Frame-accurate sequencing GSAP's declarative variants don't match at this complexity. |
| Pre-built visual primitives (text reveals, animated backgrounds, marquees) | **React Bits**, as a starting point only | Copy in via CLI, then restyle every default prop/color to the palette above before shipping — never leave React Bits demo colors, they're recognizable. |

### Setup
```bash
npm install framer-motion gsap
# React Bits has no runtime dependency — components are copied as owned source:
npx shadcn@latest add "https://reactbits.dev/r/ComponentName"
# or
npx jsrepo add https://reactbits.dev/default/CategoryName/ComponentName
```
GSAP 3.13+ bundles ScrollTrigger, SplitText, and other formerly-paid plugins for free — verify the installed version before assuming a plugin needs a license.

### Production-readiness checklist (non-negotiable)
- Animate only `transform` and `opacity`.
- `prefers-reduced-motion` handled everywhere: `gsap.matchMedia()` branch for GSAP, `useReducedMotion()` for Framer Motion. This includes the ambient timeline background — it must fully disable, not just slow down.
- Every `useGSAP()`/`gsap.context()` reverted on unmount; every ScrollTrigger killed on route change. Un-killed triggers on an SPA are the #1 leak source.
- `ScrollTrigger.refresh()` after any async layout shift (images, fonts, dynamic content).
- Pause ambient/background animation on `document.visibilitychange` (tab not visible) to save CPU.
- Lazy-load anything WebGL/canvas (`next/dynamic` with `ssr:false`) so it never blocks LCP.
- Test on throttled CPU + real mid-range Android, not just a dev laptop.
- Every animation under ~0.6s. Nothing should feel like a demo reel — quiet, expensive-feeling motion, not more motion.

### Reference patterns

**Hero load-in (GSAP timeline)** — eyebrow → headline stagger → subtext → CTAs → hero product card, in that order, last element landing around 0.5-0.8s total:
```js
useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".eyebrow", { opacity: 0, y: 12, duration: 0.5 })
    .from(".headline .word", { opacity: 0, y: 24, stagger: 0.06, duration: 0.7 }, "-=0.2")
    .from(".subtext", { opacity: 0, y: 12, duration: 0.5 }, "-=0.3")
    .from(".cta-group", { opacity: 0, y: 12, duration: 0.4 }, "-=0.3")
    .from(".hero-card", { opacity: 0, x: 24, duration: 0.6 }, "-=0.3");
}, { scope: containerRef });
```

**Batched scroll reveal for card grids:**
```js
useGSAP(() => {
  ScrollTrigger.batch(".reveal-item", {
    onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 32, stagger: 0.1, duration: 0.6 }),
    start: "top 85%",
    once: true,
  });
}, { scope: containerRef });
```

**Count-up on calculator output change (Framer Motion + a tween helper):**
```jsx
const displayValue = useSpring(rawValue, { stiffness: 120, damping: 20 });
useEffect(() => { displayValue.set(rawValue); }, [rawValue]);
```

**Beat/tab switch (Framer Motion, avoids instant snap):**
```jsx
<AnimatePresence mode="wait">
  <motion.div key={activeBeat} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
    {beatContent}
  </motion.div>
</AnimatePresence>
```

## Workflow

1. Identify the hero product-state visual (trade ticket, dashboard fragment, whatever the product's real UI is) — this comes before any copywriting or layout decisions.
2. Assign color tokens per the semantic table above; assign animation ownership per the division-of-labor table.
3. Build static layout fully responsive first, no animation — animating a broken layout hides bugs.
4. Layer motion in order of importance: hero load-in first, then scroll reveals, then micro-interactions last.
5. Run the production-readiness checklist.
6. Common bug to check for: headline text losing whitespace between spans/gradient-wrapped words — verify rendered text against source copy before calling it done.
7. If something feels janky, check for dual-ownership conflicts (two animation engines on one node) before anything else.