# Aegis-F: Confidential Kinetic Protector
### Build README for Flare Summer Signal Hackathon (Bounty 2 — Confidential Compute Apps)

> **How to use this document:** This is a complete build brief for an autonomous/agentic coding assistant. It contains the product spec, verified technical facts (with sources), a critical risk decision that must be made before Day 1, a day-by-day build plan, exact API/contract references, and submission requirements. Read the whole thing before writing any code — Section 2 changes the shape of Day 4.

---

## 1. Product Spec

**One-line pitch:** A TEE-based keeper that privately monitors a user's lending position and automatically repays debt using sub-second FTSOv2 price triggers, so the user's liquidation threshold and strategy are never exposed on-chain to MEV/liquidation-hunting bots.

**Why this matters:** On a normal lending protocol, a borrower's health factor is fully public. Anyone can watch a position approach its liquidation threshold and race to liquidate it the instant it crosses — this is standard MEV behavior. Aegis-F lets a user privately delegate "if my health factor drops below X, repay Y" to a Trusted Execution Environment (TEE). The enclave holds the repayment funds, watches FTSOv2 prices, and fires the repayment before a public liquidator bot gets the chance. The user's threshold and trigger logic are invisible until the enclave acts.

**Origin / reuse:** This is a re-platform of an existing project, **Aegis** — a confidential liquidation protector originally built for Aave V3 on Arbitrum Sepolia using iExec's Nox protocol (Go Sentinel daemon, ERC-7984 confidential tokens, TEE-based repayment). Aegis-F keeps the core logic (health-factor monitoring, threshold triggers, auto-repay) and re-platforms it onto **Flare Confidential Compute (FCC)**, with a Flare-native lending market swapped in for Aave and **FTSOv2** swapped in for the original price feed.

**Target bounty:** Bounty 2 — Confidential Compute Apps ($6,000 pool, $4,000/$2,000).

**Load-bearing Flare primitives:**
- **Flare Confidential Compute (FCC)** — TEE extension logic (FCE) + Protocol Managed Wallets (PMW) for private key custody and repayment execution.
- **FTSOv2** — block-latency (~1.8s) price feeds for precise liquidation-risk calculation.

**Submission narrative (write this early, not on Day 5):** Explicitly state what existed before (Aegis on Arbitrum/iExec), what's newly built for Flare (FCE port, FTSOv2 integration, Kinetic-position monitoring or mock), and why the Flare version is meaningful (native TEE + native oracle, no third-party compute marketplace dependency).

---

## 2. CRITICAL — Decide This Before Day 1: Kinetic Deployment Target

Kinetic Market (the Flare-native lending protocol this project monitors) was originally announced (Dec 2023) to launch first on **Coston2 testnet**. **However, Kinetic's current public contract documentation (`docs.kinetic.market/contracts-and-api-documentation`) lists only mainnet contract addresses** — all reference chain ID 14 (`flare-explorer.flare.network`, Flare Mainnet), including the Comptroller, Unitroller, ISO markets (FXRP-USDT0-STFXRP, JOULE-USDC-FLR), and FTSO oracle wrapper contracts. **No Coston2 addresses were found for Kinetic in current docs.**

This means one of three paths must be chosen explicitly, and stated explicitly in the submission writeup — do not silently assume Kinetic-on-Coston2 exists:

**Path A — Mock the lending position (recommended for a 5-day build).**
Build a minimal mock "lending position" contract on Coston2 that exposes `collateralValue`, `debtValue`, and `healthFactor` in the same shape Kinetic's Comptroller would. This is honest, fast, and keeps 100% of the demo running on Flare's own free testnet infrastructure. State clearly in the submission: "Kinetic is not currently deployed on Coston2; this demo monitors a mock position contract with Kinetic's real health-factor formula, ready to point at live Kinetic mainnet contracts post-hackathon." This does not hurt "Flare integration quality" scoring, because the FCC/FTSOv2 integration — the actual judged primitive — is fully real either way.

**Path B — Point at real Kinetic mainnet contracts, read-only.**
The TEE extension can read live Kinetic mainnet state (Comptroller `0xeC7e541375D70c37262f619162502dB9131d6db5`, per Section 5) for real health-factor data, without executing real repayments (repayment execution stays simulated/testnet). This is more impressive but adds mainnet RPC dependency and slightly more risk if mainnet state is messy for a random test wallet. Do this only if Day 1–2 goes faster than planned.

**Path C — Confirm Coston2 deployment directly before deciding.**
Before defaulting to Path A, spend 20 minutes on Day 1 checking Kinetic's Discord/docs directly, or asking in the Flare Hackathon Telegram (`https://t.me/+5Vn6ZKhr6KI3NjIx`) whether a Coston2 deployment exists that isn't in the public docs page. If yes, use those addresses and skip the mock.

**Default assumption for the rest of this README: Path A (mock position contract on Coston2).** All later steps reference this. Swap in real addresses if Path B/C confirms otherwise.

---

## 3. Architecture Overview

```
┌─────────────────────┐
│  User (frontend)     │  Sets: target health factor, repayment funds, position ref
└──────────┬───────────┘
           │ tx
           ▼
┌─────────────────────────────────┐
│  Flare C-Chain (Coston2)         │
│  - InstructionSender contract    │  emits instruction events
│  - TeeExtensionRegistry          │  onboards the extension, attestation
│  - Mock/real position contract   │  exposes collateral/debt/health factor
└──────────┬────────────────────────┘
           │ instruction event (or /direct call, hackathon shortcut)
           ▼
┌─────────────────────────────────┐
│  tee-proxy (public, port 6662)   │  auth via signature or X-API-Key
└──────────┬────────────────────────┘
           │ internal (port 6661, network-isolated)
           ▼
┌─────────────────────────────────┐
│  tee-node / FCE extension (Go)   │
│  - holds PMW-managed wallet      │  private key never leaves TEE
│  - reads FTSOv2 via getFeedById  │
│  - computes health factor        │
│  - if breached: signs & sends    │  repayment transaction
│    repayment tx from PMW wallet  │
└─────────────────────────────────┘
```

Two data paths matter for the demo:
1. **Decentralized path (documented, referenced, not fully built in 5 days):** C-chain instruction → 100 Data Providers reach >50% signature-weight consensus → relay to TEE. This is the "real" production path.
2. **Hackathon shortcut (what you'll actually demo):** an external Node.js cron script polls the `tee-proxy` `/direct` endpoint directly, bypassing Data Provider consensus. **This must be disclosed explicitly in the submission** as a known shortcut, not hidden. Judges are explicitly told to evaluate integration quality — disclosing this honestly protects your score; hiding it risks looking like you don't understand the architecture.

---

## 4. Environment & Repo Setup

Reference repos (Flare Foundation GitHub):
- `flare-foundation/fce-extension-scaffold` — "Hello World" FCE starter. Start here.
- `flare-foundation/fce-sign` — signing example, useful for the PMW repayment-transaction signing step.
- `flare-foundation/tee-proxy` — proxy source, useful if you need to inspect/modify the `/direct` endpoint behavior.
- `flare-foundation/developer-hub` — source of `dev.flare.network`; every doc page is available as agent-readable Markdown by appending `.md` to the URL (e.g. `https://dev.flare.network/ftso/feeds/.md`) — feed this directly to your coding agent for exact API signatures instead of re-deriving them.

Networks:
- **Coston2** is Flare's public testnet — this is where all development for this hackathon must target (FCC is not on Flare mainnet; it's mid-rollout to Songbird canary network as of the hackathon window, per Flare's STP.13 governance vote).
- Get testnet C2FLR from the Coston2 faucet (linked from `dev.flare.network`).

Local setup checklist for the agent:
```bash
git clone https://github.com/flare-foundation/fce-extension-scaffold
cd fce-extension-scaffold
# Read the repo's own README fully before touching config —
# it defines the exact env vars, MODE flag, and build steps.
```

Run the extension in **`MODE=0` (simulation mode)** for the entire hackathon. This skips GCP Confidential Space hardware attestation and reproducible-build code-hash whitelisting — both are real production requirements but are not achievable in a 5-day window and are not necessary to demonstrate the product logic. State this trade-off explicitly in the submission, same as the `/direct` endpoint shortcut.

---

## 5. Verified Technical Reference

Everything below was checked against Flare's own documentation and GitHub during research for this project — use these as ground truth for the agent, not general training knowledge, since FCC is new enough that a coding agent's own knowledge may be stale or wrong.

### 5.1 FCC on-chain building blocks
- `TeeExtensionRegistry` — manages onboarding of compute extensions and TEE machine attestation.
- `TeeMachineRegistry` — companion registry for TEE machine identity.
- `InstructionSender` — the only contract address allowed to submit instructions to the relay; you deploy your own instance of this pattern.
- Routing: extensions match on `OPType`/`OPCommand` — `bytes32` pairs that must match exactly across your Solidity contract, your Go config, and your Go router. Mismatches here are the most likely source of "nothing happens" bugs — verify this three-way match first if the extension doesn't respond.

### 5.2 tee-proxy
- Dual-port architecture: **6662** is the public-facing port (GET routes like `/info`, `/action` unauthenticated; POST routes require a signature or an `X-API-Key` header). **6661** is internal-only, relies on network isolation (Kubernetes NetworkPolicy or loopback), no application-layer auth.
- `/direct` endpoint (POST) accepts `opType`, `opCommand`, `message`, authenticated via `X-API-Key`. This is the synchronous bypass path described in Section 3 — use it for the demo trigger.
- TLS termination must happen upstream of the proxy; the proxy itself speaks cleartext HTTP.

### 5.3 Reproducible builds (relevant only if you later pursue Path B/C production hardening)
- Docker images must hash identically on every build via `SOURCE_DATE_EPOCH` injection, because the network cryptographically verifies the TEE is running exact, unmodified extension code. Not required in `MODE=0` — skip for the hackathon, know it exists.

### 5.4 Protocol Managed Wallets (PMW)
- Built into FCC; lets the TEE generate, store, and manage private keys and sign transactions for external chains from inside the enclave.
- **Unverified / flag this explicitly to your agent:** PMW documentation and examples are currently heavily oriented toward XRPL and Bitcoin signing. EVM (Flare C-chain) transaction serialization support inside PMW is not confirmed in public docs as of this research. Since Aegis-F's repayment transaction is an EVM transaction (repaying a position on Flare itself, not a foreign chain), **have the agent check `fce-sign` and the PMW section of `dev.flare.network` directly on Day 1** for EVM signing support before committing to PMW for the repayment step. If EVM signing isn't cleanly supported, fall back to a standard Go EVM wallet library (e.g. `go-ethereum`'s `accounts/abi/bind`) running inside the same TEE process for the signing step, and be upfront in the submission that key custody uses a TEE-held standard wallet rather than the PMW subsystem specifically.

### 5.5 FTSOv2
- Block-latency feeds update ~every 1.8 seconds, free to query on-chain.
- Feed ID encoding: category byte + hex-encoded feed name, right-padded with zeros to 21 bytes (42 hex chars), prefixed `0x`. Category `01` = crypto.
- Verified example: `FLR/USD` → `0x01464c522f55534400000000000000000000000000`
- Solidity access pattern (verified from Flare's own docs):
```solidity
import {ContractRegistry} from "@flarenetwork/flare-periphery-contracts/coston2/ContractRegistry.sol";
import {FtsoV2Interface} from "@flarenetwork/flare-periphery-contracts/coston2/FtsoV2Interface.sol";

contract HealthFactorReader {
    FtsoV2Interface internal ftsoV2;
    constructor() {
        ftsoV2 = ContractRegistry.getFtsoV2();
    }
    function getPrice(bytes21 feedId) external returns (uint256 value, int8 decimals, uint64 timestamp) {
        return ftsoV2.getFeedById(feedId);
    }
}
```
- Go equivalent for the TEE extension: use `getFeedByIdInWei` for a wei-denominated read, matching whatever decimals your health-factor math expects.
- Use Coston2 package path (`.../coston2/...`), not the mainnet path, for all imports and `ContractRegistry` calls during the hackathon.

### 5.6 Kinetic reference data (for Path A mock design or Path B/C real reads)
Kinetic's real health-factor logic is: `collateralValue × collateralFactor > debtValue`, sourced via their own `ProtocolFTSOV3Oracle` wrapper around Flare's FTSO. If building the Path A mock, mirror this shape so the demo is architecturally honest about what a real integration would look like.

Mainnet reference addresses (chain ID 14 — **do not deploy or transact against these for the hackathon**, reference only, for Path B read-only or for documentation purposes):
- Comptroller: `0xeC7e541375D70c37262f619162502dB9131d6db5`
- Unitroller: `0x8041680Fb73E1Fe5F851e76233DCDfA0f2D2D7c8`
- ProtocolFTSOV3Oracle: `0xC1d7029C970d9B683Da9d37b49d84D081dbeD54c`
- Full list: `docs.kinetic.market/contracts-and-api-documentation`

### 5.7 FAssets / Smart Accounts
Not directly load-bearing for Aegis-F (that's the other candidate's territory), but if the roadmap section of the submission wants to mention future direction (e.g. "extend to protect FXRP-collateralized Kinetic positions"), the real mechanism is: FAssets Direct Minting via a 32-byte (any executor) or 48-byte (restricted executor) XRPL memo format, routed through `MintingTagManager` and `executeDirectMinting`. Cite this only as roadmap, don't build it in the 5 days.

---

## 6. Day-by-Day Build Plan

**Day 1 — Scaffold + decision lock**
- Clone `fce-extension-scaffold`, get it running locally in `MODE=0` against Coston2.
- Resolve Section 2 (Kinetic deployment path). Default to Path A unless Telegram/docs confirm otherwise within an hour of checking.
- Check PMW EVM-signing support (Section 5.4) and decide the signing approach now, not on Day 4.
- Get Coston2 testnet C2FLR from the faucet into a dev wallet.

**Day 2 — Core logic + price feed**
- Port the Aegis Go logic (health-factor calc, threshold trigger, repay decision) into the FCE handler shape.
- Wire `getFeedByIdInWei` for live Coston2 FTSOv2 prices — this is the easiest, most copy-paste-able part; verify against Section 5.5 exactly.
- If Path A: write and deploy the mock position contract (collateral, debt, health factor getters) to Coston2.

**Day 3 — On-chain wiring**
- Write and deploy the `InstructionSender` Solidity contract.
- Verify the three-way `OPType`/`OPCommand` match (Solidity ↔ Go config ↔ Go router) — budget real slack here, this is historically the most likely stall point.
- Start drafting the submission writeup now (existed-before / built-during / why-it-matters), in parallel, not after building is done.

**Day 4 — Integration + signing**
- Connect the extension to real (or mock) Kinetic-shaped position state and compute live health factor from FTSOv2 prices.
- Implement the repayment signing path decided on Day 1 (PMW or fallback Go EVM wallet).
- If Path A was chosen and there's spare time, attempt Path C (confirm real Coston2 Kinetic deployment) — don't force it if behind schedule.

**Day 5 — Demo path + submission**
- Implement the `/direct` endpoint trigger + external Node.js cron script that polls it and fires the extension when the health factor is breached.
- Record the demo video/GIF showing: deposit → threshold set → simulated price move → automatic repay, before it would be publicly liquidatable.
- Finalize submission: project name, bounty selection, product description, target user, demo link, GitHub repo, Flare-usage explanation, what-was-newly-built breakdown, deployment details (Coston2), roadmap/next steps. Explicitly disclose the `/direct`-polling shortcut and the MODE=0 simulation trade-off as known production gaps, per Section 3 and Section 4.

---

## 7. Submission Requirements Checklist (from the hackathon page — verify nothing is missed)

- [ ] Project name
- [ ] Selected bounty (Bounty 2 — Confidential Compute Apps)
- [ ] Short product description
- [ ] Target user (large capital deployers / whales who want private liquidation protection)
- [ ] Demo link, video, or working app link
- [ ] GitHub repo / technical materials
- [ ] Explanation of how the project uses Flare (FCC + FTSOv2, load-bearing not superficial)
- [ ] Explanation of what was newly built vs. ported from original Aegis
- [ ] Smart contract addresses / deployment details (Coston2)
- [ ] Short roadmap / next steps
- [ ] (Encouraged, not required) Deployment network confirmation: Coston2
- [ ] (Encouraged) Any user acquisition/traction signals — likely none for a 5-day hackathon build, fine to state plainly

---

## 8. Known Open Risks (carry these into the build, don't let the agent silently assume they're resolved)

1. **Kinetic-on-Coston2 does not appear to exist in public docs** — Section 2 must be resolved on Day 1, not discovered on Day 4.
2. **PMW EVM signing support is unverified** — Section 5.4 fallback plan exists; confirm early.
3. **FCC itself is pre-production** — as of the hackathon window it's mid-rollout to Songbird canary via governance vote, not yet on Flare mainnet. Coston2 targeting is correct and expected by the hackathon; just don't let the agent assume mainnet-grade stability.
4. **`/direct` endpoint bypasses decentralized consensus** — must be disclosed in the submission, not hidden, per Section 3.
