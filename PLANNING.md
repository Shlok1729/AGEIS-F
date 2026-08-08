# Aegis-F: Master Project Plan

A confidential, TEE-based keeper on Flare Network that privately monitors a user's lending position on Kinetic Market and automatically repays debt using block-latency (~1.8s) FTSOv2 price triggers before MEV/liquidation-hunting bots can strike.

---

## 1. Architectural Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AEGIS-F SYSTEM DESIGN                     │
└─────────────────────────────────────────────────────────────┘

 [ Flare Mainnet (Chain 14) ]          [ Flare Coston2 Testnet (Chain 114) ]
   - Kinetic Comptroller Read-Only       - MockKineticPosition.sol (Health Factor)
   - Real Market Collateral/Debt ABI     - FTSOv2 Live Price Feeds (0x01464c522f...)
                                         - InstructionSender.sol (Event Relay)
                                         - AegisVault.sol (Keeper Repay Pool)
                                                         │
                                                         ▼
                                         ┌───────────────────────────────────┐
                                         │  tee-proxy (Port 6662 / 6661)     │
                                         │  /direct endpoint bypass (MODE=0) │
                                         └─────────────────┬─────────────────┘
                                                           │
                                                           ▼
                                         ┌───────────────────────────────────┐
                                         │  Go TEE Keeper / FCE Extension    │
                                         │  - Private threshold & trigger    │
                                         │  - FTSOv2 block-latency poller    │
                                         │  - ECDSA Enclave EVM Signer       │
                                         │  - Auto-repay execution on Coston2│
                                         └─────────────────┬─────────────────┘
                                                           │
                                                           ▼
                                         ┌───────────────────────────────────┐
                                         │  Split-Screen React/Vite UI       │
                                         │  - Left: Public MEV mempool view  │
                                         │  - Right: Private TEE protection  │
                                         └───────────────────────────────────┘
```

---

## 2. Project Breakdown into 6 Modular Parts

### Part 1: Core Smart Contracts (Solidity on Coston2)
* **`MockKineticPosition.sol`**: Mimics Kinetic Comptroller & cToken mechanics (`collateralValue`, `debtValue`, `healthFactor`, `repayBorrow`), querying Coston2 `FtsoV2Interface` (`0x01464c522f55534400000000000000000000000000`).
* **`InstructionSender.sol`**: Emits `Instruction` events with matching `OPType` / `OPCommand` (`bytes32`).
* **`AegisVault.sol`**: Custodies delegated repayment reserves and authorizes TEE Keeper execution.
* **Test & Deploy scripts**: Hardhat deployment config targeting Coston2 testnet (`Chain ID 114`).

### Part 2: Flare Confidential Compute Extension (Go TEE Keeper)
* **Go FCE Handler**: Implements router matching `OPType` / `OPCommand`.
* **FTSOv2 Poller**: Calls Coston2 `FtsoV2Interface.getFeedByIdInWei` on block ticks (~1.8s).
* **Confidential Health-Factor Engine**: Evaluates $HF = \frac{\text{Collateral} \times \text{Price} \times \text{CF}}{\text{Debt}}$.
* **EVM Signer & Broadcaster**: Constructs, signs, and dispatches repayment transactions to Coston2 when $HF \le HF_{thresh}$.
* **tee-proxy configuration**: Local simulation server (`MODE=0`) on port 6662 with `/direct` endpoint support.

### Part 3: Dual Oracle & Market Data Bridge
* **Flare Mainnet Reader**: Direct JSON-RPC `eth_call` to Flare Mainnet Kinetic Comptroller (`0xeC7e541375D70c37262f619162502dB9131d6db5`) demonstrating live production compatibility.
* **Coston2 FTSOv2 Streamer**: Live WebSocket / RPC poller streaming real-time FLR/USD feeds.

### Part 4: High-Aesthetic Split-Screen Web Dashboard
* **Public Predator View (Left Panel)**: Visualizes what public liquidators and MEV bots observe (deteriorating health factor, zero pending transactions in the mempool).
* **Confidential Enclave View (Right Panel)**: Shows encrypted trigger threshold ($HF_{trigger} = 1.15$), real-time FTSOv2 price ticks, TEE attestation badge, and automatic execution logs.
* **Interactive Controls**: Interactive sliders for simulating price moves, depositing collateral, setting private keeper thresholds, and triggering one-click demonstrations.

### Part 5: E2E Testing & Simulation Automation
* Comprehensive test script verifying:
  1. Position initialization ($HF = 1.50$).
  2. Enclave threshold registration ($HF = 1.15$).
  3. Price drop triggering enclave ($HF \to 1.10$).
  4. Auto-repayment on Coston2 contract.
  5. Restoration of position health ($HF \to 1.60$).

### Part 6: Hackathon Submission Kit & Docs
* Detailed documentation, verified contract addresses on Coston2, FTSOv2 feed IDs, architecture diagrams, and submission narrative.
