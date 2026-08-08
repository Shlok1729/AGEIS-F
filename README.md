# 🛡️ Aegis-F: Confidential Kinetic Lending Protector

> **Flare Summer Signal Hackathon** — *Bounty 2: Confidential Compute Apps ($6,000 Pool)*  
> **Target Network:** Flare Coston2 Testnet (Chain ID 114) · Flare Mainnet (Chain ID 14)  
> **Status:** Live on Coston2 Testnet · Smart Contracts Verified · Go TEE Keeper Active · 13/13 Unit Tests Passing · Interactive Dashboard Live

### 🔗 Live Coston2 Verified Smart Contracts (Chain ID 114)
* 🏦 **`MockKineticPosition`:** [`0x6376892136f7c85E09c0e36100ffA6b484B3AC8c`](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c)
* 📡 **`InstructionSender` (FCC Gateway):** [`0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c`](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c)
* 🔐 **`AegisVault` (Confidential Reserve):** [`0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e`](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e)
* 🤖 **Designated TEE Keeper:** [`0xB45f8a4946cD15bb6f208BF3372934b5946a1B38`](https://coston2-explorer.flare.network/address/0xB45f8a4946cD15bb6f208BF3372934b5946a1B38)

---

## ⚡ Executive Summary

**Aegis-F** is an autonomous, confidential risk-management keeper application built natively on the **Flare Network**. It solves a fundamental security vulnerability in decentralized lending markets: **Public Mempool Liquidation Hunting and MEV Front-Running**.

In standard DeFi lending protocols (such as Kinetic Market on Flare, Compound, or Aave), borrower stop-loss triggers and automated debt repayment bots operate through public smart contracts or transparent off-chain scripts. Because target health factors, trigger levels, and pending transactions are visible in the public mempool, predatory searchers and MEV bots can front-run protective transactions, sandwich repayments, or force public liquidations to capture an 8–10% liquidation bonus penalty.

**Aegis-F eliminates this attack vector by leveraging Flare Confidential Compute (FCC) inside a Hardware-Isolated Trusted Execution Environment (TEE):**
1. **Private Risk Configuration:** The borrower's stop-loss trigger threshold ($HF_{thresh}$), target buffer ($HF_{target} = 1.30$), and reserve authorizations remain encrypted in TEE enclave memory.
2. **Sub-Second FTSOv2 Ingestion:** The enclave keeper ingests native Flare Time Series Oracle v2 (FTSOv2) price feeds (`~1.8s` block latency) with active oracle staleness protection.
3. **Dynamic Debt Repayment Algorithm:** When health factor breaches threshold ($HF \le HF_{thresh}$), the TEE calculates the exact dynamic repayment needed to restore the position to a safe $1.30\text{ HF}$ buffer, and executes immediately via an isolated Protocol Managed Wallet (PMW) before public liquidators ($HF \le 1.00$) can strike.

---

## 🏛️ System Architecture & Data Pipeline

```
                                    PUBLIC / ON-CHAIN DOMAIN
 ┌─────────────────────────┐          ┌──────────────────────────┐          ┌─────────────────────────┐
 │   Kinetic Market /      │          │   AegisVault Contract    │          │  Flare ContractRegistry │
 │   MockKineticPosition   │◄─────────┤  (ReentrancyGuard +     │          │  & FTSOv2 Price Feeds   │
 │   (Staleness Checked)   │  Repay   │   Pausable Breaker)      │          │  (FLR, BTC, ETH, XRP)   │
 └───────────┬─────────────┘  Debt    └─────────────▲────────────┘          └────────────┬────────────┘
             │                                      │ Execute                            │
             │ Query                                │ Protection                         │ getFeedByIdInWei
             │ Collateral/Debt                      │ (PMW Signature)                    │ (~1.8s block latency)
             ▼                                      │                                    ▼
 ┌──────────────────────────────────────────────────┴─────────────────────────────────────────────────┐
 │                                                                                                    │
 │                               PRIVATE / TEE ENCLAVE DOMAIN (FCC)                                  │
 │                                                                                                    │
 │   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────┐   │
 │   │    Instruction Router     │      │   Dynamic Health Engine   │      │   FTSOv2 Poller      │   │
 │   │  • Signature Auth (EIP-191)─────►│  • Evaluates HF in TEE    │◄─────│  • Multi-Feed Poll   │   │
 │   │  • Multi-Position Map     │      │  • Dynamic Repay to 1.30  │      │  • Staleness Guard   │   │
 │   └───────────────────────────┘      └─────────────┬─────────────┘      └──────────────────────┘   │
 │                                                    │                                               │
 │                                                    ▼ Trigger Breached ($HF \le HF_{thresh}$)       │
 │                                      ┌───────────────────────────┐                                 │
 │                                      │   EVM ECDSA Signer (PMW)  │                                 │
 │                                      │   Signs executeProtection │                                 │
 │                                      └───────────────────────────┘                                 │
 └────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Confidential State Machine Breakdown

| Component | Visibility | Execution Layer | Security / Protection Guarantee |
| :--- | :---: | :---: | :--- |
| **`FLR/USD` Price Feed** | 🌐 Public | On-Chain FTSOv2 | Multi-provider decentralized oracle; staleness verified (<180s on-chain, <120s in TEE). |
| **Vault Reserve Balance** | 🌐 Public | Coston2 Smart Contract | Holds user-deposited repayment collateral in `AegisVault.sol` with `ReentrancyGuard`. |
| **Repayment Transaction** | 🌐 Public | Coston2 Explorer | Verifiable on-chain event confirming debt relief and restored health factor. |
| **User Stop-Loss Threshold** | 🔒 **Confidential** | TEE Enclave Memory | Target trigger ($1.15\text{ HF}$) known only to the enclave. Invisible to MEV bots. |
| **Dynamic Health Calculation**| 🔒 **Confidential** | Go FCE Daemon | Evaluated in hardware enclave; computes exact debt relief needed to reach $1.30\text{ HF}$. |
| **Keeper Signing Key (PMW)** | 🔒 **Confidential** | TEE Enclave Isolation | Enclave-custodied Go ECDSA signer (PMW fallback in MODE=0; native PMW in MODE=1). |

---

## 🔮 Flare Native Primitives Integration

Aegis-F is deeply built on top of Flare's core platform capabilities:

### 1. Flare Confidential Compute (FCC) & FCE Extensions
* **TEE Extension Daemon:** Written in Go (`fce-keeper/`), runs inside hardware enclave memory (AMD SEV-SNP in production / `MODE=0` local simulation for sandbox).
* **Protocol Managed Wallets (PMW) & Signing Fallback:** In this hackathon release (`MODE=0`), transaction signing is handled via a standard Go EVM secp256k1 ECDSA signer running isolated inside the keeper process memory (acting as the keeper's Protocol Managed Wallet fallback). In full production FCC (`MODE=1`), this integrates with Flare's native PMW threshold signing service or enclave KMS.
* **Cryptographic Signature Auth:** `/direct` endpoint verifies EIP-191 personal signatures from borrowers before modifying enclave triggers.
* **Instruction Routing:** `InstructionSender.sol` emits typed FCC instruction events (`OPType = 0x00000001`, `OPCommand = 0x8f33a211...`) parsed by the Go daemon.

### 2. Flare Time Series Oracle v2 (FTSOv2) & Staleness Checks
* Block-latency price ingestion querying `FtsoV2Interface.getFeedByIdInWei` or via Flare Contract Registry (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` on Coston2).
* **Staleness Protection:** Both on-chain contracts and TEE pollers check feed timestamps. Price reads older than maximum allowable staleness (180s on-chain / 120s in daemon) trigger an automatic pause to prevent stale oracle arbitrage.
* **Verified Feed IDs (Category Byte `01` + Hex Name, 21-byte right-padded):**
  * `FLR/USD`: `0x01464c522f55534400000000000000000000000000` *(Active position feed)*
  * `BTC/USD`: `0x014254432f55534400000000000000000000000000`
  * `ETH/USD`: `0x014554482f55534400000000000000000000000000`
  * `XRP/USD`: `0x015852502f55534400000000000000000000000000`

### 3. Kinetic Lending Protocol Math (Compound V2 Fork Mechanics)
* Modeled after Kinetic Market's Comptroller and Unitroller architecture (`0xeC7e541375D70c37262f619162502dB9131d6db5` on Flare Mainnet).
* Implements canonical Compound V2 lending dynamics in `MockKineticPosition.sol`. For demonstration and simulation benchmarks, parameters use canonical Compound-fork defaults (50% close factor, 8% liquidation incentive, 80% collateral factor, 85% liquidation threshold; live market parameters vary by asset pool).

---

## 🧮 Dynamic Repayment & MEV Savings Math Model

### 1. Dynamic Debt Repayment Formula (Target Safe Buffer $HF_{target} = 1.30$)

Instead of repaying a static number, Aegis-F calculates the exact debt repayment $D_{repay}$ required to return the position to a target safety buffer:

$$HF_{target} = \frac{\text{Collateral} \times \text{Price} \times \text{LiquidationThreshold}}{\text{Debt} - D_{repay}}$$

$$\implies D_{repay} = \text{Debt} - \left[ \frac{\text{Collateral} \times \text{Price} \times \text{LiquidationThreshold}}{HF_{target}} \right]$$

$$\text{Final Repayment} = \min(D_{repay}, \text{MaxAuthorizedCap}, \text{VaultReserve})$$

### 2. Quantitative MEV Liquidation Penalty Model (Illustrative Compound-Fork Benchmark)

> [!NOTE]
> **Parameter Note:** Kinetic Market documentation presents risk parameters illustratively (e.g. 50% close factor), with live pool parameters varying by asset pair. The worked example below demonstrates the exact mathematical formula using canonical Compound-fork parameters (50% close factor, 8% liquidation incentive) as an illustrative benchmark.

When an unprotected position drops below $HF = 1.00$, public liquidators seize collateral at a discount:

$$\text{Eligible Debt Repayable} = \text{Debt} \times \text{Close Factor} \quad (50\%)$$

$$\text{Collateral Seized by Bot} = \text{Eligible Repay} \times (1 + \text{Liquidation Incentive}) \quad (1 + 8\%)$$

$$\text{Direct User MEV Loss} = \text{Eligible Repay} \times 8\%$$

#### Worked Example (Standard Aegis-F Demo Benchmark):
* **Collateral:** $1,000 \text{ FLR}$ ($=\$35.00$ at $\$0.035$)
* **Debt:** $\$20.00 \text{ USD}$
* **Liquidation Threshold:** $85\%$ ($\$29.75$ max borrow capacity before liquidation)
* **Initial Health Factor:** $\frac{\$29.75}{\$20.00} = 1.4875$ (Safe)

**Scenario 1: Without Aegis-F (Unprotected Public Liquidation)**
1. Price drops to $\$0.023$ $\rightarrow$ Collateral value falls to $\$23.00$ $\rightarrow$ Max safe borrow drops to $\$19.55$.
2. Health Factor drops to $\frac{\$19.55}{\$20.00} = 0.9775 < 1.00$ (Liquidatable).
3. A public MEV searcher detects this in the mempool, calls `liquidateBorrow()`, repays $\$10.00 \text{ debt}$ ($50\%$ close factor), and seizes **$\$10.80$ worth of FLR collateral**.
4. **Borrower Penalty Loss: $-\$0.80 \text{ USD}$ ($8\%$ penalty fee transferred directly to searcher).**

**Scenario 2: With Aegis-F (Confidential Enclave Protection)**
1. Borrower registers private threshold: $HF_{thresh} = 1.15$, Auto-repay cap: $\$8.00 \text{ USD}$, Target: $1.30\text{ HF}$.
2. Price drops to $\$0.027$ $\rightarrow$ Health Factor touches $\approx 1.1475 \le 1.15$.
3. TEE Keeper dynamically calculates $D_{repay} = \$20 - \frac{1000 \times 0.027 \times 0.85}{1.30} = \$2.346\text{ USD}$ (or up to cap), calls `AegisVault.executeProtection()`.
4. Position returns safely to $HF \ge 1.30$.
5. **Zero collateral lost to liquidators. MEV Front-Runners see $0$ pending liquidations.**

---

## 📁 Repository Structure

```
AGEIS-F/
├── contracts/                        # Solidity Smart Contracts (Coston2 Testnet)
│   ├── MockKineticPosition.sol       # Kinetic math + FTSOv2 oracle reader with staleness checks
│   ├── AegisVault.sol                # Reserve custody, ReentrancyGuard, and Pausable circuit breaker
│   ├── InstructionSender.sol         # FCC Event emission & instruction relay
│   └── interfaces/
│       ├── FtsoV2Interface.sol       # Flare FTSOv2 interface
│       └── ContractRegistry.sol      # Flare on-chain contract registry interface
│
├── fce-keeper/                       # Go Flare Confidential Compute (FCC) Keeper Daemon
│   ├── main.go                       # Daemon entrypoint, HTTP server (/info, /logs, /direct), EIP-191 auth
│   ├── health_engine.go              # Dynamic debt repayment algorithm & multi-position registry
│   ├── ftso_poller.go                # Multi-feed FTSOv2 price poller with staleness detection
│   ├── signer.go                     # PMW ECDSA signer & EVM transaction broadcaster
│   ├── types.go                      # Enclave data structures & OPType constants
│   └── aegis-keeper                  # Standalone pre-compiled Go ELF binary
│
├── frontend/                         # Catppuccin Mocha React + Vite Dashboard
│   ├── src/
│   │   ├── App.jsx                   # Master orchestrator, state machine, and ticker loop
│   │   ├── index.css                 # Catppuccin Mocha terminal theme & design tokens
│   │   ├── components/
│   │   │   ├── FeedStrip.jsx         # Priority 1: 4-Feed live FTSOv2 oracle ticker
│   │   │   ├── MevSavingsCard.jsx    # Priority 2: Real-time MEV liquidation savings payoff card
│   │   │   ├── KeeperStatusPanel.jsx # Live backend poller (/api/info & /api/logs)
│   │   │   ├── CountUp.jsx           # GSAP animated numerical transitions
│   │   │   └── SpotlightCard.jsx     # Mouse-tracking interactive card component
│   │   ├── sections/
│   │   │   ├── LandingHero.jsx       # 2-Column Private vs Public architecture split
│   │   │   ├── PositionSetupPanel.jsx# Enclave configuration & dynamic buffer preview
│   │   │   ├── LiveMonitorDashboard.jsx # 3-Column real-time monitor & Redacted TEE view
│   │   │   ├── EventLog.jsx          # Auto-scrolling terminal execution log & tx links
│   │   │   └── ArchitectureStrip.jsx # Interactive 5-stage cryptographic pipeline
│   │   └── services/
│   │       └── keeperApi.js          # Typed fetch layer with VITE_KEEPER_URL & /api support
│   ├── vite.config.js                # Vite configuration with /api reverse proxy to :6662
│   └── vercel.json                   # Vercel SPA routing configuration
│
├── scripts/
│   ├── deploy.cjs                    # Production Hardhat deployment to Coston2 / Mainnet
│   └── demo-e2e.cjs                  # End-to-end integration & simulation test script
│
├── test/
│   └── AegisContracts.test.js        # Expanded Hardhat unit test suite (13/13 passing)
│
├── docs/
│   └── SUBMISSION.md                 # Complete hackathon submission writeup & rubric
│
├── Dockerfile                        # Multi-stage production container for Go TEE keeper
├── render.yaml                       # Render blueprint for 24/7 autonomous keeper hosting
├── vercel.json                       # Root Vercel deployment blueprint
├── .env.example                      # Comprehensive environment template
├── hardhat.config.cjs                # Hardhat network & compiler configuration
└── TODO.md                           # Progress and milestones tracker
```

---

## 🚀 Quickstart & Verification

### 1. Run the Smart Contract Test Suite (13 Passing Tests)
```bash
npx hardhat test --network hardhat
```
*Output:*
```
  Aegis-F Smart Contract Suite
    1. MockKineticPosition Lending Mechanics & FTSO Math
      ✔ should allow collateral deposit and calculate correct initial health factor
      ✔ should accurately reflect health factor drops when oracle price falls
      ✔ should allow liquidation only when health factor drops below 1.0
    2. Edge Cases & Security Validations
      ✔ should handle zero debt safely with max uint256 health factor
      ✔ should return zero health factor if collateral is zero with active debt
      ✔ should reject borrows exceeding maximum borrowing capacity
      ✔ should allow owner to update maximum oracle staleness limit
    3. InstructionSender Confidential Compute Routing
      ✔ should emit FCC instruction events with matching OPType and OPCommand
      ✔ should allow borrower to revoke an active trigger
    4. AegisVault, Circuit Breaker & TEE Debt Repayment
      ✔ should allow user to deposit repayment reserve and execute protection via TEE Keeper
      ✔ should prevent unauthorized callers from triggering protection
      ✔ should support circuit breaker pausing to halt automated execution during emergencies
      ✔ should allow users to withdraw their unspent reserve

  13 passing (633ms)
```

### 2. Run the Automated End-to-End Simulation
```bash
npx hardhat run scripts/demo-e2e.cjs
```

### 3. Run the Go TEE Keeper Daemon
```bash
cd fce-keeper
./aegis-keeper
```

### 4. Launch the Interactive Web Dashboard
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Coston2 Testnet Deployment & Verified Contracts

Aegis-F is fully deployed and verified on **Flare Coston2 Testnet (Chain ID 114)**:

| Contract | Verified Coston2 Address | Block Explorer Link |
| :--- | :--- | :--- |
| **`MockKineticPosition`** | `0x6376892136f7c85E09c0e36100ffA6b484B3AC8c` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c) |
| **`InstructionSender`** | `0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c) |
| **`AegisVault`** | `0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e) |
| **Designated TEE Keeper** | `0xB45f8a4946cD15bb6f208BF3372934b5946a1B38` | Coston2 EVM Signer |

---

## ☁️ Cloud & Docker Deployment

### 1. Frontend on Vercel
* Pre-configured with [`vercel.json`](file:///home/divyansh/Development/Projects/AGEIS-F/vercel.json).
* Import repository to [Vercel](https://vercel.com/new).
* Set `VITE_KEEPER_URL=https://your-keeper.onrender.com` to connect to a cloud daemon.

### 2. Go TEE Keeper on Render / Docker
* Production [`Dockerfile`](file:///home/divyansh/Development/Projects/AGEIS-F/Dockerfile) and [`render.yaml`](file:///home/divyansh/Development/Projects/AGEIS-F/render.yaml) included.
* Minimal Alpine runtime running the autonomous keeper on port `6662`.

---

## 🗺️ Production Roadmap & Next Steps

### 1. FDC-Verified Cross-Chain Protection (Arbitrum Aave $\rightarrow$ Flare TEE)
Using the **Flare Data Connector (FDC)**, Aegis-F can attest to state from foreign EVM chains (e.g., an Aave V3 borrow position on Arbitrum or Ethereum). The Flare TEE keeper reads the FDC cryptographic attestation proof, evaluates the private threshold in enclave memory, and triggers cross-chain repayments via CCIP / LayerZero. This makes Flare's data portability layer load-bearing for multi-chain DeFi.

### 2. FAssets-Denominated Position Protection (`FXRP`, `FBTC`, `FDOGE`)
Extending Aegis-F to protect positions collateralized with Flare's native FAssets on Kinetic ISO markets (such as `FXRP-USDT0` and `JOULE-USDC-FLR`). Non-smart-contract assets bridged to Flare gain institutional-grade, private liquidation immunity.

### 3. Production Hardware Attestation (AMD SEV-SNP via GCP Confidential Space)
Transitioning from `MODE=0` simulation to `MODE=1` production deployment inside GCP Confidential Space. The enclave publishes its AMD SEV-SNP attestation quote to `TeeMachineRegistry.sol` on Flare, allowing users to verify via on-chain cryptography that their stop-loss logic is executed strictly inside confidential hardware.

---

## 📄 License & Disclosures
 
* **License:** MIT License
* **Attestation & PMW Disclosure:** In this hackathon demonstration release, the Go keeper operates under `MODE=0` (FCC Local Enclave Simulation), with transaction signing handled by an enclave-memory-isolated Go EVM ECDSA signer acting as the PMW fallback. In production `MODE=1`, this integrates with Flare's native PMW service and AMD SEV-SNP attestation on GCP Confidential Space.
* **Protocol Parameters:** The MEV savings calculations and `MockKineticPosition.sol` risk parameters utilize canonical Compound V2 defaults (50% close factor, 8% liquidation incentive) as an illustrative benchmark; live Kinetic Market parameters vary across market pools.

---

*Built with ❤️ for the **Flare Summer Signal Hackathon** (Confidential Compute Track).*
