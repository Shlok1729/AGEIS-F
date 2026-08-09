# 🛡️ Aegis-F: Comprehensive System Context & Technical Architecture

> **Project Name:** Aegis-F (Confidential Kinetic Lending Protector)  
> **Hackathon Track:** Flare Summer Signal Hackathon — Bounty 2: Confidential Compute Apps ($6,000 Pool)  
> **Primary Networks:** Flare Coston2 Testnet (Chain ID 114) · Flare Mainnet (Chain ID 14)  
> **Status:** Production-Ready · Verified On-Chain Contracts · Active Go TEE Daemon · Web3 Connected · Tested (13/13 Hardhat Tests)

---

## 1. Executive Overview & Problem Statement

### The Problem: Public Mempool Liquidation Hunting in DeFi Lending
In standard decentralized lending protocols (such as **Kinetic Market** on Flare, Compound V2/V3, or Aave), loan risk management suffers from a fundamental structural flaw: **transparency leakage in the public mempool**.

```
Standard DeFi Lending Liquidation Attack Vector:
┌────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────┐
│ Collateral Drops   │ ───► │ Pending Liquidation /   │ ───► │ MEV Searcher Bots    │
│ (HF approaches 1.0)│      │ Transparent Bot Order   │      │ Sandwich & Front-Run │
└────────────────────┘      │ Visible in Mempool      │      │ Seize 8–10% Penalty  │
                            └─────────────────────────┘      └──────────────────────┘
```

1. **Predatory Front-Running:** If a borrower sets an on-chain stop-loss or uses a transparent bot to repay debt before liquidation, MEV searchers detect the pending transaction in the public mempool and front-run or sandwich it with higher priority gas fees.
2. **Forced Liquidation Penalties:** When a position crosses $HF \le 1.00$, liquidators seize borrower collateral and extract an **8% to 10% liquidation bonus penalty** on up to 50% of the loan (close factor), inflicting severe economic losses on borrowers during market distress.
3. **Inefficient Full/Half Liquidations:** Traditional protocols liquidate fixed chunks (e.g., 50% close factor), seizing far more collateral than necessary to restore safety.

### The Solution: Aegis-F (Flare Confidential Compute + FTSOv2)
**Aegis-F** is an autonomous risk-management keeper application running natively inside **Flare Trusted Execution Environments (TEE)**. It privately monitors a borrower's lending position on Kinetic Market and executes dynamic debt repayments directly from an authorized reserve before public liquidators or MEV bots can detect any risk.

```
Aegis-F Confidential TEE Defense:
┌────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────┐
│ FTSOv2 Oracle Reads│ ───► │ Enclave Hardware RAM    │ ───► │ Enclave PMW Signer   │
│ (~1.8s Sub-Second) │      │ Private Trigger ($1.15) │      │ Dynamic Auto-Repay   │
└────────────────────┘      │ 0 Bytes Mempool Leakage │      │ Restores 1.30 Buffer │
                            └─────────────────────────┘      └──────────────────────┘
```

---

## 2. System Architecture & Component Domains

Aegis-F strictly separates state into two security domains: the **Public On-Chain Domain** and the **Private TEE Enclave Domain**.

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

### Confidential State Machine

| Component | Visibility | Execution Layer | Security & Privacy Guarantee |
| :--- | :---: | :---: | :--- |
| **`FLR/USD` Price Feed** | 🌐 Public | On-Chain FTSOv2 | Verified decentralized oracle with on-chain staleness checks (<180s). |
| **Vault Reserve Balance** | 🌐 Public | Coston2 Smart Contract | Non-custodial repayment reserve in `AegisVault.sol` with `ReentrancyGuard`. |
| **Repayment Transaction** | 🌐 Public | Coston2 Explorer | Verifiable on-chain event confirming debt relief and restored health factor. |
| **Borrower Stop-Loss Limit** | 🔒 **Confidential** | TEE Enclave Memory | Trigger threshold ($HF_{thresh} = 1.15$) is encrypted in hardware RAM. Invisible to MEV bots. |
| **Dynamic Debt Calculation** | 🔒 **Confidential** | Go FCE Daemon | Evaluated in hardware enclave; calculates exact debt relief needed to reach $1.30\text{ HF}$. |
| **Keeper Signing Key (PMW)** | 🔒 **Confidential** | TEE Enclave Isolation | Enclave-custodied Go ECDSA signer (PMW fallback in MODE=0; native PMW in MODE=1). |

---

## 3. Flare Native Primitives Integration

### 1. Flare Confidential Compute (FCC) & Remote Attestation
* **TEE Enclave Extension:** Written in Go (`fce-keeper/`), runs in hardware-isolated enclave memory (AMD SEV-SNP in production / `MODE=0` local simulation for sandbox).
* **Hardware Remote Attestation:** Enclave launch measurement hash (`MRENCLAVE` / `PCR0`: `0x7d9f2e8410b38c291847ad4492bf98301824a739b610c490a16e8902187b55f1`) verifiable via GCP Confidential Space.
* **Protocol Managed Wallets (PMW):** Enclave-custodied EVM ECDSA signer matching the authorized `teeKeeper` in `AegisVault.sol`.
* **Cryptographic Signature Auth:** `/direct` endpoint verifies EIP-191 personal signatures from borrowers before modifying enclave triggers.
* **Instruction Routing:** `InstructionSender.sol` emits typed FCC instruction events (`OPType = 0x00000001`, `OPCommand = 0x8f33a211...`) parsed by the Go daemon.

### 2. Flare Time Series Oracle v2 (FTSOv2) Multi-Asset Matrix
The TEE keeper continuously reads prices from `FtsoV2Interface.getFeedByIdInWei` or via Flare Contract Registry (`0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019` on Coston2) across 4 verified asset pairs:
* `FLR/USD`: `0x01464c522f55534400000000000000000000000000` *(Active position feed)*
* `BTC/USD`: `0x014254432f55534400000000000000000000000000`
* `ETH/USD`: `0x014554482f55534400000000000000000000000000`
* `XRP/USD`: `0x015852502f55534400000000000000000000000000`
* **Oracle Staleness Protection:** Timestamps older than 180s on-chain or 120s in daemon automatically halt execution to prevent stale oracle arbitrage.

### 3. Kinetic Lending Protocol Mechanics (Compound V2 Fork)
* Modeled after Kinetic Market's Comptroller and Unitroller architecture (`0xeC7e541375D70c37262f619162502dB9131d6db5` on Flare Mainnet).
* Implements Compound V2 dynamics in `MockKineticPosition.sol` (50% close factor, 8% liquidation incentive, 80% collateral factor, 85% liquidation threshold).

---

## 4. Mathematical Formulation & Financial Risk Model

### 1. Dynamic Debt Repayment Formula
Unlike naive bots that repay random amounts or standard liquidations that seize 50% of the loan, Aegis-F calculates the **exact minimum debt repayment** $\Delta D$ needed to restore the position to an optimal safe buffer ($HF_{target} = 1.30$):

Given:
* Collateral: $C$
* Oracle Price: $P$
* Collateral Factor: $CF = 0.85$ (Liquidation threshold)
* Outstanding Debt: $D$
* Target Safe Health Factor Buffer: $HF_{target} = 1.30$

$$\text{Health Factor: } HF = \frac{C \cdot P \cdot CF}{D}$$

When $HF \le HF_{thresh}$, solving for the required repayment $\Delta D$:

$$HF_{target} = \frac{C \cdot P \cdot CF}{D - \Delta D}$$

$$(D - \Delta D) \cdot HF_{target} = C \cdot P \cdot CF$$

$$\Delta D = D - \frac{C \cdot P \cdot CF}{HF_{target}}$$

$$\text{Executed Repayment} = \min\left(D, \, \max\left(0, \, D - \frac{C \cdot P \cdot CF}{HF_{target}}\right)\right)$$

### 2. MEV Liquidation Penalty Avoidance (Borrower Savings)
Standard public liquidation seizes an **8% liquidation bonus penalty** on the liquidated debt tranche:

$$\text{Liquidation Penalty Avoided} = D \times 50\% \times 8\%$$

$$\text{Net Borrower Profit} = \text{Penalty Avoided} - \text{Flare L1 Gas Fee ($0.00028 USD)}$$

---

## 5. Live Coston2 Verified Smart Contracts

| Contract | Address on Flare Coston2 (Chain ID 114) | Role | Verification |
| :--- | :--- | :--- | :---: |
| **`MockKineticPosition`** | [`0x6376892136f7c85E09c0e36100ffA6b484B3AC8c`](https://coston2-explorer.flare.network/address/0x6376892136f7c85E09c0e36100ffA6b484B3AC8c) | Kinetic / Compound V2 Position & Comptroller | Exact Match |
| **`InstructionSender`** | [`0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c`](https://coston2-explorer.flare.network/address/0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c) | FCC Instruction Gateway & Event Relay | Exact Match |
| **`AegisVault`** | [`0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e`](https://coston2-explorer.flare.network/address/0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e) | Confidential Liquidation Reserve & TEE Auth | Exact Match |
| **`Designated TEE Keeper`** | [`0xB45f8a4946cD15bb6f208BF3372934b5946a1B38`](https://coston2-explorer.flare.network/address/0xB45f8a4946cD15bb6f208BF3372934b5946a1B38) | Protocol Managed Wallet (PMW Signer) | Active Keeper |

---

## 6. Frontend Architecture & Design System

The Aegis-F frontend is built following the **Fintech-Premium Frontend (`fintech-premium-frontend`)** design system:

```
Near-Black Money-Coded Palette:
• Base Background: #0A0A0F (Terminal desk base)
• Off-White Text:  #F5F3F7 (Primary) / #A1A1B5 (Secondary)
• Money Green:     #2ED47A (Strictly money, positive savings, verified states)
• Proof Purple:    #9B7FFF → #7C5CFC (Gradient text on proof phrases, active states)
• Risk Red:        #F43F5E (Exclusively liquidation risk & breaches)
• Tabular Numerals: font-variant-numeric: tabular-nums across all numbers
• Zero Emojis:     100% clean outline Lucide icons
```

### Signature Feature Modules:
1. **`HeroPositionTicket.jsx`:** Real live position defense ticket (`#POS-FLR-0042`) showing collateral, debt, live $HF$, private trigger ($HF_{thresh}$), target buffer ($1.30$), and sub-second FTSOv2 price feeds.
2. **`TerminalProofBlock.jsx`:** 3-dot window chrome comparing public mempool front-running vs. confidential TEE execution with real opcode traces.
3. **`DynamicRepayCalculator.jsx`:** Interactive sliders bound to the dynamic repayment formula with count-up tweens and plain-English financial interpretations.
4. **`PredatorRaceVisualizer.jsx`:** Split animated race track comparing the 12s public mempool front-running delay against the <340ms TEE enclave auto-repay.
5. **`TeeAttestationModal.jsx`:** Cryptographic hardware remote attestation report (MRENCLAVE measurement, AMD SEV-SNP RAM encryption, on-chain keeper verification).
6. **`AssetSelector.jsx`:** Multi-asset matrix supporting `FLR/USD`, `BTC/USD`, `ETH/USD`, and `XRP/USD`.
7. **`BlackSwanStressTester.jsx`:** 1-click historical crash presets (May 2021 cascade, Oracle wick glitch, Volatility bleed).
8. **`PortfolioRiskHeatmap.jsx`:** Institutional treasury desk monitoring 4 simultaneous positions with batch TEE arming.
9. **`WalletButton.jsx` & `WalletModal.jsx`:** Web3 EVM wallet provider supporting MetaMask/Core on Coston2, C2FLR deposits to `AegisVault.sol`, and EIP-191 trigger signing.
10. **`audioService.js`:** Zero-dependency Web Audio API synthesizer for tactile clicks and decisive rescue chimes.

---

## 7. Economic Sustainability & Protocol Fee Model

Aegis-F implements a **20 bps (0.20%) success-only fee architecture**:
* **Zero Upfront Cost:** No subscription or idle fees.
* **Success Deductions:** When an automated rescue executes, a 0.20% fee is deducted from the repaid amount.
* **Self-Sustaining Gas Pool:** 50% of fees replenish the `AegisKeeperGasPool`, continuously funding the TEE PMW signer with native FLR (1 rescue funds 130+ keeper gas cycles at <$0.0003/tx).
* **Institutional Streaming SLA:** Enterprise funds subscribe to dedicated hardware TEE enclaves via micro-streamed SLA.

---

## 8. Quickstart & Verification Commands

```bash
# 1. Run Smart Contract Test Suite (13/13 passing)
npx hardhat test

# 2. Run End-to-End Simulation Script
npx hardhat run scripts/demo-e2e.cjs

# 3. Start Go TEE Keeper Daemon (Port 6662)
cd fce-keeper && go run main.go

# 4. Start React Frontend Dashboard (Port 3000)
cd frontend && npm run dev
```
