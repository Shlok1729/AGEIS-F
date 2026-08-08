# Aegis-F: Hackathon Submission Kit & Project Writeup
### Target Bounty: Bounty 2 — Confidential Compute Apps ($6,000 Pool)

---

## 1. Project Information

* **Project Name:** Aegis-F (Confidential Kinetic Protector)
* **Bounty Selection:** Bounty 2 — Confidential Compute Apps
* **Short Description:** A TEE-based keeper on Flare Network that privately monitors a borrower's lending position on Kinetic Market and automatically repays debt using sub-second FTSOv2 price triggers before public MEV liquidator bots can strike.
* **Target Users:** Large capital deployers, DeFi institutions, and whale borrowers who need private liquidation protection without exposing their risk thresholds, stop-loss triggers, or repayment strategies on-chain.
* **Target Network:** Flare Coston2 Testnet (Chain ID 114) + Live Read-Only Queries to Flare Mainnet Kinetic Market (Chain ID 14).

---

## 2. Flare Primitives & Technical Integration

Aegis-F is deeply integrated with Flare's native primitives rather than relying on superficial wrappers or third-party marketplaces:

1. **Flare Confidential Compute (FCC):**
   * **TEE Extension (FCE):** Runs custom Go keeper logic (`fce-keeper/`) inside hardware-isolated enclave memory.
   * **Protocol Managed Wallets (PMW) / Enclave Custody:** Private keys for repayment execution never leave the TEE enclave.
   * **Instruction Routing:** `InstructionSender.sol` emits `Instruction` events with `bytes32` `OPType` and `OPCommand` pairs matching the Go daemon router.

2. **Flare Time Series Oracle v2 (FTSOv2):**
   * Block-latency (~1.8 second) price feeds querying `FtsoV2Interface.getFeedByIdInWei` for `FLR/USD` (`0x01464c522f55534400000000000000000000000000`).
   * Provides real-time pricing without trusting centralized off-chain oracles.

3. **Flare Mainnet Kinetic Compatibility:**
   * Direct ABI-compatible interface with Kinetic Comptroller (`0xeC7e541375D70c37262f619162502dB9131d6db5`) and Unitroller (`0x8041680Fb73E1Fe5F851e76233DCDfA0f2D2D7c8`) on Flare Mainnet.

---

## 3. What Was Newly Built vs. Origin

* **Origin:** Aegis was originally conceptualized on Arbitrum Sepolia using iExec Nox protocol for Aave V3.
* **Newly Built for Flare Hackathon:**
  1. **Flare Confidential Extension (FCE):** Full Go daemon implementing FCC routing (`OPType`/`OPCommand`), `tee-proxy` dual-port architecture (6662/6661), and PMW key management.
  2. **Native FTSOv2 Integration:** Sub-second block-latency oracle polling via Coston2 `FtsoV2Interface`.
  3. **Solidity Contract Suite on Coston2:**
     * `MockKineticPosition.sol` (Kinetic Comptroller lending math + FTSOv2 integration).
     * `InstructionSender.sol` (FCC instruction event dispatching).
     * `AegisVault.sol` (Confidential repayment reserve custody & TEE execution).
  4. **Split-Screen Interactive Dashboard:** Modern Vite + React UI contrasting the transparent public mempool (what liquidator bots see) with the confidential enclave memory (what Aegis-F executes).
  5. **Automated E2E Simulation Suite:** Hardhat and Go testing suites verifying automated debt repayment and MEV liquidation evasion.

---

## 4. Deployed Smart Contracts & Verified Addresses

### Flare Coston2 Testnet (Chain ID 114)
* **RPC Endpoint:** `https://coston2-api.flare.network/ext/C/rpc`
* **FTSOv2 ContractRegistry:** `0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019`
* **FTSOv2 Direct Address:** `0x3d893c53d9e80E433582fe4091473fC49f11618F`
* **FLR/USD Feed ID:** `0x01464c522f55534400000000000000000000000000`
* **MockKineticPosition:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
* **InstructionSender:** `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
* **AegisVault:** `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

### Flare Mainnet Reference Contracts (Chain ID 14 · Read-Only Verification)
* **RPC Endpoint:** `https://flare-api.flare.network/ext/C/rpc`
* **Kinetic Comptroller:** `0xeC7e541375D70c37262f619162502dB9131d6db5`
* **Kinetic Unitroller:** `0x8041680Fb73E1Fe5F851e76233DCDfA0f2D2D7c8`
* **ProtocolFTSOV3Oracle:** `0xC1d7029C970d9B683Da9d37b49d84D081dbeD54c`

---

## 5. Architectural Transparency Disclosures

In accordance with hackathon evaluation guidelines:
1. **Simulation Mode (`MODE=0`):** The TEE daemon runs in local simulation mode (`MODE=0`), bypassing GCP Confidential Space hardware charges while executing the exact same Go keeper and EVM signing logic.
2. **Proxy `/direct` Endpoint:** For local testnet demonstrations, trigger notifications utilize the `tee-proxy` `/direct` endpoint rather than the 100 Data Provider consensus relay.
3. **Kinetic Market Target (Path A + Path B Hybrid):** Monitored on Coston2 via `MockKineticPosition.sol` with live FTSOv2 price feeds, backed by read-only verification against Flare Mainnet Kinetic contracts.

---

## 6. How to Run & Verify the Demo

### Step 1: Run Smart Contract Tests
```bash
npx hardhat test
```

### Step 2: Run End-to-End Simulation
```bash
npx hardhat run scripts/demo-e2e.cjs
```

### Step 3: Run the Go TEE Keeper Daemon
```bash
cd fce-keeper
./aegis-keeper
```

### Step 4: Run the Interactive Web Dashboard
```bash
cd frontend
npm run dev
```
Open `http://localhost:3000` to interact with the split-screen comparison and test real-time price volatility triggers.

---

## 8. Roadmap & Next Steps

The following are documented next steps — not built in this hackathon submission, but representing the natural production path from this prototype:

### 8.1 FDC-Verified Cross-Chain Protection

The most impactful next step is integrating the **Flare Data Connector (FDC)** to attest to the *original* lending position state on a foreign chain (e.g., Aave V3 on Arbitrum). In this architecture:

- FDC provides a cryptographically-verified, on-chain proof that a borrower's Aave position has dropped below a given health factor on Arbitrum.
- The Flare TEE keeper reads this attestation, applies private threshold logic, and executes a cross-chain repayment routed through CCIP or LayerZero.
- This closes the loop between Aegis-F's Flare port and its original design, making **Flare's interoperability layer (not just its compute layer) load-bearing** to the product's value.

### 8.2 FAssets-Denominated Position Protection

Extending Aegis-F to protect positions collateralized with **FXRP, FBTC, or FDOGE** (Flare's native FAssets) ties the project directly to Flare's founding mission of unlocking DeFi for non-smart-contract assets.

- Users holding FXRP-collateralized debt on Kinetic Market (current ISO markets: `FXRP-USDT0`, `JOULE-USDC-FLR`) face the same MEV liquidation risk as any EVM-native borrower.
- Aegis-F's TEE keeper monitors FAsset-denominated collateral values using the same FTSOv2 feed architecture (FXRP/USD: `0x01465852502f555344000000000000000000000000`) and applies identical private-threshold protection.
- This makes Aegis-F relevant to a user cohort that has no equivalent protection tool on any other chain.

### 8.3 Production TEE Attestation

In this demo, the enclave runs in **MODE=0** (local simulation). A production version would:

1. Deploy the Go keeper to **GCP Confidential Space** (AMD SEV-SNP hardware).
2. Publish the AMD attestation record on-chain via `TeeMachineRegistry` on Coston2.
3. Surface the attestation hash in the frontend as a verifiable badge — confirming to any external observer that the threshold and health factor computations occurred inside genuine hardware-isolated memory, not on a regular server.

This is the key step that transforms Aegis-F's privacy claim from "trust us" to "verify on-chain."

---

## 9. Pre-Coston2 Deployment Enhancement Checklist

- [x] Multi-feed FTSOv2 dashboard (FLR/USD, BTC/USD, ETH/USD, XRP/USD) — verified feed IDs from `dev.flare.network/ftso/feeds`
- [x] MEV-savings calculator — Kinetic liquidation parameters sourced from Compound V2 defaults (50% close factor, 8% liquidation incentive); labeled as estimates where exact on-chain values not confirmed
- [x] TEE attestation: documented gap (MODE=0 simulation) — not faked; production path described above
- [x] Roadmap written into submission (FDC cross-chain + FAssets)
- [x] All FTSOv2 feed IDs verified against `dev.flare.network/ftso/feeds` specification (category byte `01` + hex-encoded name, right-padded to 21 bytes)
- [x] Kinetic liquidation penalty explicitly labeled as Compound-fork estimate, not fabricated precision

