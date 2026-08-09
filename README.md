# 🛡️ Aegis-F: Confidential Kinetic Lending Protector

> **Flare Summer Signal Hackathon** — *Bounty 2: Confidential Compute Apps ($6,000 Pool)*  
> **Target Network:** Flare Coston2 Testnet (Chain ID 114) · Flare Mainnet (Chain ID 14)  
> **Status:** Live on Coston2 Testnet · Smart Contracts Verified · Go TEE Keeper Active · 13/13 Unit Tests Passing · Web3 Wallet Connected · Interactive Fintech Dashboard Live

---

### 🔗 Live Coston2 Verified Smart Contracts (Chain ID 114)

| Contract | Verified Coston2 Address | Role | Compiler / Status |
| :--- | :--- | :--- | :---: |
| 🏦 **`MockKineticPosition`** | [`0x6376892136f7c85E09c0e36100ffA6b484B3AC8c`](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c) | Kinetic / Compound V2 Position & Comptroller | `Solidity 0.8.20` · Exact Match |
| 📡 **`InstructionSender`** | [`0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c`](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c) | FCC Gateway & Instruction Relay | `Solidity 0.8.20` · Exact Match |
| 🔐 **`AegisVault`** | [`0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e`](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e) | Confidential Repayment Reserve Vault | `Solidity 0.8.20` · Exact Match |
| 🤖 **`Designated TEE Keeper`** | [`0xB45f8a4946cD15bb6f208BF3372934b5946a1B38`](https://coston2-explorer.flare.network/address/0xB45f8a4946cD15bb6f208BF3372934b5946a1B38) | Protocol Managed Wallet (PMW Signer) | Go TEE Daemon · Active |

---

## ⚡ Executive Summary

**Aegis-F** is an autonomous, confidential risk-management keeper application built natively on the **Flare Network**. It solves a fundamental security vulnerability in decentralized lending markets: **Public Mempool Liquidation Hunting and MEV Front-Running**.

In standard DeFi lending protocols (such as Kinetic Market on Flare, Compound, or Aave), borrower stop-loss triggers and automated debt repayment bots operate through public smart contracts or transparent off-chain scripts. Because target health factors, trigger levels, and pending transactions are visible in the public mempool, predatory searchers and MEV bots can front-run protective transactions, sandwich repayments, or force public liquidations to capture an **8–10% liquidation bonus penalty**.

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
 │                                                    ▼ Trigger Breached (HF <= HF_thresh)            │
 │                                      ┌───────────────────────────┐                                 │
 │                                      │   EVM ECDSA Signer (PMW)  │                                 │
 │                                      │   Signs executeProtection │                                 │
 │                                      └───────────────────────────┘                                 │
 └────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Confidential State Machine Breakdown

| Component | Visibility | Execution Layer | Security Guarantee |
| :--- | :---: | :---: | :--- |
| **`FLR/USD` Price Feed** | 🌐 Public | On-Chain FTSOv2 | Multi-provider decentralized oracle; staleness verified (<180s on-chain, <120s in TEE). |
| **Vault Reserve Balance** | 🌐 Public | Coston2 Smart Contract | Holds user-deposited repayment collateral in `AegisVault.sol` with `ReentrancyGuard`. |
| **Repayment Transaction** | 🌐 Public | Coston2 Explorer | Verifiable on-chain event confirming debt relief and restored health factor. |
| **User Stop-Loss Threshold** | 🔒 **Confidential** | TEE Enclave Memory | Target trigger ($1.15\text{ HF}$) known only to the enclave. Invisible to MEV bots. |
| **Dynamic Health Calculation**| 🔒 **Confidential** | Go FCE Daemon | Evaluated in hardware enclave; computes exact debt relief needed to reach $1.30\text{ HF}$. |
| **Keeper Signing Key (PMW)** | 🔒 **Confidential** | TEE Enclave Isolation | Enclave-custodied Go ECDSA signer (PMW fallback in MODE=0; native PMW in MODE=1). |

---

## 🔮 Flare Native Primitives Integration

### 1. Flare Confidential Compute (FCC) & Remote Attestation
* **TEE Extension Daemon:** Written in Go (`fce-keeper/`), runs inside hardware enclave memory (`AMD SEV-SNP` in production / `MODE=0` local simulation for sandbox).
* **Hardware Remote Attestation:** Enclave launch measurement hash (`MRENCLAVE` / `PCR0`: `0x7d9f2e8410b38c291847ad4492bf98301824a739b610c490a16e8902187b55f1`) verifiable via GCP Confidential Space.
* **Protocol Managed Wallets (PMW):** Enclave-custodied EVM ECDSA signer matching the authorized `teeKeeper` in `AegisVault.sol`.
* **Cryptographic Signature Auth:** `/direct` endpoint verifies EIP-191 personal signatures from borrowers before modifying enclave triggers.
* **Instruction Routing:** `InstructionSender.sol` emits typed FCC instruction events (`OPType = 0x00000001`, `OPCommand = 0x8f33a211...`) parsed by the Go daemon.

### 2. Flare Time Series Oracle v2 (FTSOv2) Multi-Asset Matrix
Block-latency price ingestion querying `FtsoV2Interface.getFeedByIdInWei` or via Flare Contract Registry (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` on Coston2) across 4 verified asset pairs:
* `FLR/USD`: `0x01464c522f55534400000000000000000000000000` *(Active position feed)*
* `BTC/USD`: `0x014254432f55534400000000000000000000000000`
* `ETH/USD`: `0x014554482f55534400000000000000000000000000`
* `XRP/USD`: `0x015852502f55534400000000000000000000000000`

---

## 🧮 Dynamic Repayment & MEV Savings Math Model

### 1. Dynamic Debt Repayment Formula (Target Safe Buffer $HF_{target} = 1.30$)

Given:
* Collateral: $C$ (in native asset)
* Oracle Price: $P$ (in USD)
* Collateral Factor: $CF = 0.85$ (Liquidation threshold)
* Outstanding Debt: $D$ (in USD)
* Current Health Factor: $HF = \frac{C \cdot P \cdot CF}{D}$

When $HF \le HF_{thresh}$, the enclave calculates the exact debt relief $\Delta D$ required to restore $HF$ to $HF_{target}$:

$$\Delta D = D - \frac{C \cdot P \cdot CF}{HF_{target}}$$

$$\text{Repayment Amount} = \min(D, \max(0, \Delta D))$$

### 2. Liquidation Bonus Avoided (Net Borrower Profit)

In standard Kinetic / Compound protocols, public liquidations seize an **8% liquidation bonus** on up to **50% of the loan (close factor)**:

$$\text{Liquidation Penalty Avoided} = D \times 50\% \times 8\%$$

$$\text{Net Benefit} = \text{Penalty Avoided} - \text{Flare Gas Fee ($0.00028 USD)}$$

---

## 💳 Web3 Wallet Integration on Flare Coston2

Aegis-F features native Web3 EVM wallet connectivity:
1. **MetaMask / Core / Injected Wallet Support:** Automatic detection and 1-click network switching to **Flare Coston2 Testnet (Chain ID 114)**.
2. **Real-time Balance Ingestion:** Reads live `C2FLR` native balance and deposited reserve in [`AegisVault.sol`](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e).
3. **EIP-191 Cryptographic Trigger Signing:** Users sign an off-chain message with their wallet to authorize confidential TEE triggers without revealing them on-chain.
4. **Direct Vault Reserve Deposits:** One-click deposit of testnet C2FLR into `AegisVault.sol` with transaction confirmation receipts.

---

## 🧪 Comprehensive Test Suite & Verification

### 1. Hardhat Smart Contract Unit Tests (13/13 Passing)

```bash
npx hardhat test
```

```
  Aegis-F Smart Contract Suite
    1. MockKineticPosition Core Mechanics
      ✔ should initialize with correct collateral, debt, and health factor
      ✔ should reflect oracle price changes in health factor calculation
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

### 2. End-to-End Simulation Script

```bash
npx hardhat run scripts/demo-e2e.cjs
```

---

## 🚀 Quickstart Guide

### Prerequisites
* Node.js >= 18.0.0
* Go >= 1.21 (for TEE keeper daemon)

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Run Hardhat Tests
```bash
npx hardhat test
```

### 3. Launch Go TEE Keeper Daemon (Terminal 1)
```bash
cd fce-keeper
go run main.go
```
*(Keeper starts on `http://localhost:6662` with FTSOv2 price poller active)*

### 4. Launch Interactive Web Dashboard (Terminal 2)
```bash
cd frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🏛️ Project Directory Structure

```
AGEIS-F/
├── contracts/
│   ├── AegisVault.sol            # Confidential Liquidation Reserve & TEE Auth
│   ├── InstructionSender.sol     # Flare Confidential Compute (FCC) Gateway
│   ├── MockKineticPosition.sol   # Kinetic Lending Position with FTSOv2 Reads
│   └── interfaces/               # FTSOv2 & Contract Registry Interfaces
├── fce-keeper/
│   ├── main.go                   # Go TEE Keeper Daemon & FCE Extension
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HeroPositionTicket.jsx       # Hero trade ticket visual
│   │   │   ├── TerminalProofBlock.jsx       # Side-by-side execution trace proof
│   │   │   ├── DynamicRepayCalculator.jsx   # Interactive mathematical formula calculator
│   │   │   ├── PredatorRaceVisualizer.jsx   # Mempool front-running vs TEE race visualizer
│   │   │   ├── TeeAttestationModal.jsx      # Cryptographic hardware remote attestation
│   │   │   ├── ContractsVerificationPanel.jsx # Verified Coston2 contracts & compiler chips
│   │   │   ├── AssetSelector.jsx            # Multi-asset FTSOv2 matrix switcher
│   │   │   ├── BlackSwanStressTester.jsx    # 1-click historical crash presets
│   │   │   ├── PortfolioRiskHeatmap.jsx     # Institutional portfolio desk
│   │   │   ├── WalletButton.jsx             # Web3 wallet header button
│   │   │   └── WalletModal.jsx              # Web3 wallet account & deposit modal
│   │   ├── sections/
│   │   │   ├── LandingHero.jsx              # GSAP load-in hero section
│   │   │   ├── PositionSetupPanel.jsx       # 2-step setup & EIP-191 signing panel
│   │   │   ├── LiveMonitorDashboard.jsx     # 3-column live monitor
│   │   │   ├── EventLog.jsx                 # Terminal audit trail
│   │   │   ├── ArchitectureStrip.jsx        # Data pipeline strip
│   │   │   └── SustainabilitySection.jsx    # 20 bps protection fee model
│   │   ├── services/
│   │   │   ├── walletService.js             # Web3 provider & Coston2 contract interactions
│   │   │   ├── WalletContext.jsx            # Global React wallet context
│   │   │   ├── keeperApi.js                 # Go TEE daemon REST client
│   │   │   └── audioService.js              # Synthetic Web Audio API feedback
│   │   ├── App.jsx
│   │   └── index.css                        # Fintech-premium near-black styling
│   └── package.json
├── test/
│   └── AegisF.test.cjs           # 13 Hardhat Unit Tests
├── scripts/
│   ├── deploy-coston2.cjs        # Live Coston2 Deployment Script
│   └── demo-e2e.cjs              # End-to-End Simulation Script
├── hardhat.config.cjs
└── README.md
```

---

## 🏆 Hackathon Bounty Alignment

| Bounty Requirement | How Aegis-F Satisfies It |
| :--- | :--- |
| **Confidential Compute (FCC / TEE)** | Private stop-loss thresholds, dynamic debt calculation, and signing keys isolated in hardware enclave RAM (`AMD SEV-SNP` / `MODE=0`). |
| **Flare Oracles (FTSOv2)** | Ingests native `FLR/USD`, `BTC/USD`, `ETH/USD`, and `XRP/USD` feeds with active timestamp staleness verification. |
| **DeFi Risk Management** | Protects Kinetic Market borrowers from public mempool MEV front-running and saves 8–10% liquidation penalties. |
| **Production Readiness** | Verified smart contracts on Coston2, passing Hardhat test suite, Web3 wallet integration, and Go TEE daemon. |
