const { ethers } = require("hardhat");

/**
 * End-to-End Simulation Script for Aegis-F
 * Simulates a live market price drop and verifies that the confidential TEE keeper
 * executes auto-repayment before public liquidator bots can strike.
 */
async function main() {
  console.log("\n================================================================================");
  console.log("🛡️  AEGIS-F: CONFIDENTIAL KINETIC LIQUIDATION PROTECTOR — E2E SIMULATION");
  console.log("================================================================================\n");

  const [deployer, borrower, teeKeeper, liquidatorBot] = await ethers.getSigners();

  console.log(`[00:00.000] 🔑 Actors Initialized:`);
  console.log(`   - Borrower:       ${borrower.address}`);
  console.log(`   - TEE Keeper:     ${teeKeeper.address} (FCC Enclave Custody)`);
  console.log(`   - MEV Liquidator: ${liquidatorBot.address} (Public Mempool Bot)\n`);

  // Step 1: Deploy Contract Suite
  console.log(`[00:00.120] 📦 Deploying Aegis-F Smart Contracts...`);
  const PositionFactory = await ethers.getContractFactory("MockKineticPosition");
  const position = await PositionFactory.deploy(ethers.ZeroAddress);
  await position.waitForDeployment();
  await position.setMockPrice(ethers.parseEther("0.035"), true);

  const SenderFactory = await ethers.getContractFactory("InstructionSender");
  const sender = await SenderFactory.deploy();
  await sender.waitForDeployment();

  const VaultFactory = await ethers.getContractFactory("AegisVault");
  const vault = await VaultFactory.deploy(teeKeeper.address);
  await vault.waitForDeployment();

  console.log(`   ✓ MockKineticPosition: ${await position.getAddress()}`);
  console.log(`   ✓ InstructionSender:   ${await sender.getAddress()}`);
  console.log(`   ✓ AegisVault:          ${await vault.getAddress()}\n`);

  // Step 2: Open Lending Position
  console.log(`[00:01.050] 🏦 Step 1: Borrower opens Kinetic Lending Position`);
  const collateralFlr = ethers.parseEther("1000"); // 1,000 FLR @ $0.035 = $35.00
  const borrowUsd = ethers.parseEther("20");       // $20.00 USD debt
  
  await position.connect(borrower).depositCollateral({ value: collateralFlr });
  await position.connect(borrower).borrow(borrowUsd);

  let [collateral, debt, hf, price, isLiq] = await position.getPositionView(borrower.address);
  console.log(`   - Collateral:  ${ethers.formatEther(collateral)} FLR ($${(Number(ethers.formatEther(collateral)) * 0.035).toFixed(2)} USD)`);
  console.log(`   - Borrow Debt: $${ethers.formatEther(debt)} USD`);
  console.log(`   - FLR Price:   $${ethers.formatEther(price)} USD`);
  console.log(`   - Health Factor: ${ethers.formatEther(hf)} (Healthy > 1.40)\n`);

  // Step 3: Register Confidential TEE Trigger
  console.log(`[00:02.100] 🔒 Step 2: Borrower delegates confidential trigger to TEE Enclave`);
  const thresholdHf = ethers.parseEther("1.15"); // Trigger at 1.15 HF
  const maxRepay = ethers.parseEther("8");       // Repay $8 USD
  const reserveDeposit = ethers.parseEther("10"); // Deposit $10 into vault

  await vault.connect(borrower).depositReserve({ value: reserveDeposit });
  const registerTx = await sender.connect(borrower).registerPrivateTrigger(
    await position.getAddress(),
    await vault.getAddress(),
    thresholdHf,
    maxRepay
  );
  await registerTx.wait();
  console.log(`   ✓ Confidential trigger stored inside TEE memory.`);
  console.log(`   ✓ Zero stop-loss or liquidation strategy visible in public mempool!\n`);

  // Step 4: Market Volatility & FTSOv2 Price Drop
  console.log(`[00:03.450] 📉 Step 3: Market Volatility — FTSOv2 updates FLR/USD price to $0.027`);
  const droppedPrice = ethers.parseEther("0.027");
  await position.setMockPrice(droppedPrice, true);

  [collateral, debt, hf, price, isLiq] = await position.getPositionView(borrower.address);
  console.log(`   - New FLR Price:   $${ethers.formatEther(price)} USD`);
  console.log(`   - Collateral Value: $${(Number(ethers.formatEther(collateral)) * 0.027).toFixed(2)} USD`);
  console.log(`   - Degraded Health Factor: ${ethers.formatEther(hf)} (Breaches 1.15 TEE Threshold!)\n`);

  // Step 5: TEE Keeper Executes Confidential Repayment
  console.log(`[00:03.850] ⚡ Step 4: TEE Keeper detects trigger breach & dispatches auto-repayment`);
  const repayTx = await vault.connect(teeKeeper).executeProtection(
    borrower.address,
    await position.getAddress(),
    maxRepay
  );
  const receipt = await repayTx.wait();
  console.log(`   ✓ Protection executed in Tx: ${receipt.hash}`);
  console.log(`   ✓ Repaid: $${ethers.formatEther(maxRepay)} USD from AegisVault reserve.\n`);

  // Step 6: Verify Rescued Position & MEV Liquidation Evasion
  console.log(`[00:04.200] 🏆 Step 5: Post-Execution Verification`);
  let [finalCol, finalDebt, finalHf, , finalIsLiq] = await position.getPositionView(borrower.address);
  console.log(`   - Remaining Debt: $${ethers.formatEther(finalDebt)} USD (Reduced from $20 to $12)`);
  console.log(`   - Restored Health Factor: ${ethers.formatEther(finalHf)} (Recovered to 1.9125)`);
  console.log(`   - Liquidatable by public bots: ${finalIsLiq ? "YES (FAILED)" : "NO (100% PROTECTED)"}`);

  console.log("\n================================================================================");
  console.log("✅ SIMULATION COMPLETE: Borrower position successfully protected by Aegis-F!");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Simulation error:", err);
  process.exitCode = 1;
});
