# 🛡️ Aegis-F: Confidential Kinetic Lending Protector

> **Flare Summer Signal Hackathon** — *Bounty 2: Confidential Compute Apps ($6,000 Pool)*  
> **Target Network:** Flare Coston2 Testnet (Chain ID 114) · Flare Mainnet (Chain ID 14)  
> **Status:** Live on Coston2 Testnet · Smart Contracts Verified · Go TEE Keeper Active · Interactive Dashboard Live

### 🔗 Live Coston2 Verified Smart Contracts (Chain ID 114)
* 🏦 **`MockKineticPosition`:** [`0x6376892136f7c85E09c0e36100ffA6b484B3AC8c`](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c)
* 📡 **`InstructionSender` (FCC Gateway):** [`0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c`](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c)
* 🔐 **`AegisVault` (Confidential Reserve):** [`0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e`](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e)
* 🤖 **Designated TEE Keeper:** [`0xB45f8a4946cD15bb6f208BF3372934b5946a1B38`](https://coston2-explorer.flare.network/address/0xB45f8a4946cD15bb6f208BF3372934b5946a1B38)

---

## ⚡ Executive Summary

**Aegis-F** is a Confidential Automated Keeper application built natively on the **Flare Network**. It solves a multi-million-dollar vulnerability in decentralized lending markets: **Public Mempool MEV Front-Running and Liquidation Hunting**.

In standard DeFi lending protocols (such as Kinetic Market on Flare, Compound, or Aave), borrowers configure stop-loss or automated debt repayment bots via public smart contracts or off-chain bots. Because risk parameters, target health factors, and stop-loss trigger levels are visible in the public mempool or on-chain state, predatory searchers and MEV liquidation bots can front-run protective transactions, sandwich repayments, or artificially manipulate pricing to liquidate the position for an 8–10% liquidation bonus.

**Aegis-F changes the paradigm by utilizing Flare Confidential Compute (FCC) inside a Hardware-Isolated Trusted Execution Environment (TEE):**
1. **Private Risk Parameters:** The borrower's stop-loss trigger threshold ($HF_{thresh}$) and auto-repay amount are encrypted in TEE enclave memory and never touch the public blockchain.
2. **Sub-Second FTSOv2 Feeds:** The enclave keeper continuously ingests native Flare Time Series Oracle v2 (FTSOv2) price feeds (`~1.8s` block latency) over secure channels.
3. **Confidential Auto-Repay:** When health factor dips below the private threshold ($HF \le HF_{thresh}$), the TEE-isolated Protocol Managed Wallet (PMW) signs and broadcasts an immediate repayment transaction directly into `AegisVault.sol`, rescuing the position **before** the market drops to the public liquidation threshold ($HF \le 1.00$).

---

## 🏛️ Architecture & Data Flow

```
                                    PUBLIC / ON-CHAIN DOMAIN
 ┌─────────────────────────┐          ┌──────────────────────────┐          ┌─────────────────────────┐
 │   Kinetic Market /      │          │   AegisVault Contract    │          │  Flare ContractRegistry │
 │   MockKineticPosition   │◄─────────┤   (Repayment Reserves)   │          │  & FTSOv2 Price Feeds   │
 └───────────┬─────────────┘  Repay   └─────────────▲────────────┘          └────────────┬────────────┘
             │                Debt                  │ Execute                            │
             │ Query                                │ Protection                         │ getFeedByIdInWei
             │ Collateral/Debt                      │ (PMW Signature)                    │ (FLR/USD ~1.8s)
             ▼                                      │                                    ▼
 ┌──────────────────────────────────────────────────┴─────────────────────────────────────────────────┐
 │                                                                                                    │
 │                               PRIVATE / TEE ENCLAVE DOMAIN (FCC)                                  │
 │                                                                                                    │
 │   ┌───────────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────┐   │
 │   │    Instruction Router     │      │   Private Health Engine   │      │   FTSOv2 Poller      │   │
 │   │  OPType / OPCommand       │─────►│  Evaluates HF in Enclave  │◄─────│  Ingests 4 Feeds     │   │
 │   │  Decrypted in Memory      │      │  (Private Threshold HF)   │      │  FLR, BTC, ETH, XRP  │   │
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

| Component | Visibility | Execution Layer | Purpose |
| :--- | :---: | :---: | :--- |
| **`FLR/USD` Price Feed** | 🌐 Public | On-Chain FTSOv2 | Cryptographically proven multi-provider decentralized price stream. |
| **Vault Reserve Balance** | 🌐 Public | Coston2 Smart Contract | Holds user-deposited repayment collateral securely in `AegisVault.sol`. |
| **Repayment Transaction** | 🌐 Public | Coston2 Explorer | Verifiable on-chain event confirming debt relief and restored health factor. |
| **User Stop-Loss Threshold** | 🔒 **Confidential** | TEE Enclave Memory | Target trigger ($1.15$ HF) known only to the enclave. Invisible to MEV bots. |
| **Health Factor Calculation** | 🔒 **Confidential** | Go FCE Daemon | Evaluated in hardware-isolated enclave on each $\approx 1.8\text{s}$ oracle tick. |
| **Keeper Signing Key (PMW)** | 🔒 **Confidential** | TEE Enclave Isolation | Enclave-custodied Go ECDSA signer (PMW fallback in MODE=0; native PMW in MODE=1). |

---

## 🔮 Flare Native Primitives Integration

Aegis-F is deeply built on top of Flare's core platform capabilities:

### 1. Flare Confidential Compute (FCC) & FCE Extensions
* **TEE Extension Daemon:** Written in Go (`fce-keeper/`), runs inside hardware enclave memory (AMD SEV-SNP in production / `MODE=0` local simulation for sandbox).
* **Protocol Managed Wallets (PMW) & Signing Fallback:** In this hackathon release (`MODE=0`), transaction signing is handled via a standard Go EVM secp256k1 ECDSA signer running isolated inside the keeper process memory (acting as the keeper's Protocol Managed Wallet fallback). In full production FCC (`MODE=1`), this integrates with Flare's native PMW threshold signing service or enclave KMS.
* **Instruction Routing:** `InstructionSender.sol` emits typed FCC instruction events (`OPType = 0x00000001`, `OPCommand = 0x8f33a211...`) parsed by the Go daemon.

### 2. Flare Time Series Oracle v2 (FTSOv2)
* Block-latency price ingestion querying `FtsoV2Interface.getFeedByIdInWei` or via Flare Contract Registry (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` on Coston2).
* **Verified Feed IDs (Category Byte `01` + Hex Name, 21-byte right-padded):**
  * `FLR/USD`: `0x01464c522f55534400000000000000000000000000` *(Active position feed)*
  * `BTC/USD`: `0x014254432f55534400000000000000000000000000`
  * `ETH/USD`: `0x014554482f55534400000000000000000000000000`
  * `XRP/USD`: `0x015852502f55534400000000000000000000000000`

### 3. Kinetic Lending Protocol Math (Compound V2 Fork Mechanics)
* Modeled after Kinetic Market's Comptroller and Unitroller architecture (`0xeC7e541375D70c37262f619162502dB9131d6db5` on Flare Mainnet).
* Implements canonical Compound V2 lending dynamics in `MockKineticPosition.sol`. For demonstration and simulation benchmarks, parameters use canonical Compound-fork defaults (50% close factor, 8% liquidation incentive, 80% collateral factor, 85% liquidation threshold; live market parameters vary by asset pool).

---

## 💰 Quantitative MEV Savings Model (Illustrative Compound-Fork Benchmark)

> [!NOTE]
> **Parameter Note:** Kinetic Market documentation presents risk parameters illustratively (e.g. 50% close factor), with live pool parameters varying by asset pair. The worked example below demonstrates the exact mathematical formula using canonical Compound-fork parameters (50% close factor, 8% liquidation incentive) as an illustrative benchmark.

When a DeFi lending position drops below $HF = 1.00$, public liquidators seize collateral at a discount:

$$\text{Eligible Debt Repayable} = \text{Debt} \times \text{Close Factor} \quad (50\%)$$

$$\text{Collateral Seized by Bot} = \text{Eligible Repay} \times (1 + \text{Liquidation Incentive}) \quad (1 + 8\%)$$

$$\text{Direct User MEV Loss} = \text{Eligible Repay} \times 8\%$$

### Worked Example (Standard Aegis-F Demo Benchmark):
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
1. Borrower registers private threshold: $HF_{thresh} = 1.15$, Auto-repay: $\$8.00 \text{ USD}$.
2. Price drops to $\$0.027$ $\rightarrow$ Health Factor touches $\approx 1.1475 \le 1.15$.
3. TEE Keeper fires with sub-second execution (well within FTSOv2's $\approx 1.8\text{s}$ cadence), calling `AegisVault.executeProtection()`, repaying $\$8.00 \text{ USD}$ debt directly.
4. Debt reduces to $\$12.00$, Collateral remains $1,000 \text{ FLR}$, new $HF = \frac{1000 \times 0.027 \times 0.85}{12} = 1.9125$ (Completely Safe).
5. **Zero collateral lost to liquidators. MEV Front-Runners see $0$ pending liquidations.**

---

## 📁 Repository Structure

```
AGEIS-F/
├── contracts/                        # Solidity Smart Contracts
│   ├── MockKineticPosition.sol       # Kinetic math + FTSOv2 oracle reader & mock sandbox
│   ├── AegisVault.sol                # Reserve custody & authorized keeper execution
│   ├── InstructionSender.sol         # FCC Event emission & instruction relay
│   └── interfaces/
│       ├── FtsoV2Interface.sol       # Flare FTSOv2 interface
│       └── ContractRegistry.sol      # Flare on-chain contract registry interface
│
├── fce-keeper/                       # Go Flare Confidential Compute (FCC) Keeper Daemon
│   ├── main.go                       # Daemon entrypoint, HTTP server (/info, /logs, /direct)
│   ├── health_engine.go              # TEE in-memory health factor evaluation engine
│   ├── ftso_poller.go                # Multi-feed FTSOv2 price poller (~1.8s tick cadence)
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
│   │   │   ├── PositionSetupPanel.jsx# Enclave configuration & live HF preview
│   │   │   ├── LiveMonitorDashboard.jsx # 3-Column real-time monitor & Redacted TEE view
│   │   │   ├── EventLog.jsx          # Auto-scrolling terminal execution log & tx links
│   │   │   └── ArchitectureStrip.jsx # Interactive 5-stage cryptographic pipeline
│   │   └── services/
│   │       └── keeperApi.js          # Typed fetch layer connecting frontend to Go keeper
│   └── vite.config.js                # Vite configuration with /api reverse proxy to :6662
│
├── scripts/
│   ├── deploy.cjs                    # Production Hardhat deployment to Coston2 / Mainnet
│   └── demo-e2e.cjs                  # End-to-end integration & simulation test script
│
├── test/
│   └── AegisContracts.test.js        # Hardhat unit test suite (6/6 passing)
│
├── docs/
│   └── SUBMISSION.md                 # Complete hackathon submission writeup & rubric
│
├── .env.example                      # Comprehensive environment template
├── hardhat.config.cjs                # Hardhat network & compiler configuration
└── TODO.md                           # Progress and milestones tracker
```

---

## 🚀 Quickstart & Local Demonstration

### Prerequisites
* **Node.js:** v18+ or v20+
* **Go:** 1.21+ (Optional if using the pre-compiled `fce-keeper/aegis-keeper` binary)
* **NPM:** v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/AGEIS-F.git
cd AGEIS-F

# Install root dependencies (Hardhat, Ethers, etc.)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Run the Smart Contract Test Suite
```bash
npx hardhat test --network hardhat
```
*Expected Output:*
```
  Aegis-F Smart Contract Suite
    1. MockKineticPosition Lending Mechanics & FTSO Math
      ✔ should allow collateral deposit and calculate correct initial health factor
      ✔ should accurately reflect health factor drops when oracle price falls
      ✔ should allow liquidation only when health factor drops below 1.0
    2. InstructionSender Confidential Compute Routing
      ✔ should emit FCC instruction events with matching OPType and OPCommand
    3. AegisVault & TEE Enclave Debt Repayment
      ✔ should allow user to deposit repayment reserve and execute protection via TEE Keeper
      ✔ should prevent unauthorized callers from triggering protection

  6 passing (450ms)
```

### 3. Run the Automated End-to-End Simulation
```bash
npx hardhat run scripts/demo-e2e.cjs
```
This executes the full five-stage lifecycle in an automated sandbox:
1. User deposits $1,000 \text{ FLR}$ collateral and borrows $\$20 \text{ USD}$ debt.
2. User deposits $\$10 \text{ USD}$ reserve into `AegisVault.sol` and authorizes the TEE keeper.
3. FTSOv2 price drops from $\$0.035$ to $\$0.027$ (breaching private $1.15$ HF trigger).
4. TEE keeper automatically calls `executeProtection()`, repaying $\$8.00$ debt.
5. Position health factor recovers to $1.9125$ (Safe).

### 4. Run the Go TEE Keeper Daemon
```bash
cd fce-keeper
./aegis-keeper
# Output:
# 🚀 Aegis-F Confidential Keeper Daemon starting...
# 🛡️ Mode: MODE=0 (FCC Local Simulation) | Port: 6662
# 📡 Initializing FTSOv2 real-time feed poller...
# 🚀 TEE Proxy listening on http://localhost:6662
```

### 5. Launch the Interactive Web Dashboard
In a new terminal:
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser:
* **Section 1 (Landing Hero):** Review the visual split between Public On-Chain and Private TEE Enclave data.
* **Section 2 (Live Go Keeper Status):** Expand the top card to see real-time data polled from `localhost:6662/info`.
* **Section 3 (Position Setup):** Adjust collateral, debt, private threshold ($1.15$), and click **"🔐 Register in TEE"**.
* **Section 4 (Live Monitor):** Observe 4 ticking FTSOv2 feeds (`FLR`, `BTC`, `ETH`, `XRP`). Click **"👁 TEE VIEW"** to see how an outside observer only sees redacted `██████` data.
* **Section 5 (Trigger Simulation):** Click **"🔻 Drop → $0.027"** to trigger the confidential rescue. Watch the celebratory confetti, instant execution log, and the **MEV Savings Payoff Card** (+$\$0.8000$ saved).

---

## 🌐 Coston2 Testnet Deployment & Verified Contracts

Aegis-F is fully deployed and verified on **Flare Coston2 Testnet (Chain ID 114)**:

| Contract | Verified Coston2 Address | Block Explorer Link |
| :--- | :--- | :--- |
| **`MockKineticPosition`** | `0x6376892136f7c85E09c0e36100ffA6b484B3AC8c` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c) |
| **`InstructionSender`** | `0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c) |
| **`AegisVault`** | `0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e` | [View on Explorer ↗](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e) |
| **Designated TEE Keeper** | `0xB45f8a4946cD15bb6f208BF3372934b5946a1B38` | Coston2 EVM Signer |

To redeploy or deploy your own instances:
```bash
npx hardhat --config hardhat.config.cjs run scripts/deploy.cjs --network coston2
```

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

