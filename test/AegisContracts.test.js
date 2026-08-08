const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Aegis-F Smart Contract Suite", function () {
  let position;
  let instructionSender;
  let vault;

  let owner;
  let borrower;
  let teeKeeper;
  let liquidator;

  const INITIAL_PRICE_WEI = ethers.parseEther("0.035"); // $0.035 per FLR
  const DEPOSIT_COLLATERAL = ethers.parseEther("1000"); // 1,000 FLR = $35.00 collateral value
  const BORROW_DEBT = ethers.parseEther("20"); // $20.00 USD debt
  // Max borrow capacity at 80% LTV = $35 * 0.80 = $28.00
  // Liquidation threshold at 85% = $35 * 0.85 = $29.75
  // Initial Health Factor = $29.75 / $20.00 = 1.4875 (1.4875e18)

  beforeEach(async function () {
    [owner, borrower, teeKeeper, liquidator] = await ethers.getSigners();

    // 1. Deploy MockKineticPosition with mock price fallback
    const PositionFactory = await ethers.getContractFactory("MockKineticPosition");
    position = await PositionFactory.deploy(ethers.ZeroAddress);
    await position.waitForDeployment();
    await position.setMockPrice(INITIAL_PRICE_WEI, true);

    // 2. Deploy InstructionSender
    const SenderFactory = await ethers.getContractFactory("InstructionSender");
    instructionSender = await SenderFactory.deploy();
    await instructionSender.waitForDeployment();

    // 3. Deploy AegisVault with TEE Keeper address
    const VaultFactory = await ethers.getContractFactory("AegisVault");
    vault = await VaultFactory.deploy(teeKeeper.address);
    await vault.waitForDeployment();
  });

  describe("1. MockKineticPosition Lending Mechanics & FTSO Math", function () {
    it("should allow collateral deposit and calculate correct initial health factor", async function () {
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      await position.connect(borrower).borrow(BORROW_DEBT);

      const [collateral, debt, hf, price, isLiquidatable] = await position.getPositionView(borrower.address);

      expect(collateral).to.equal(DEPOSIT_COLLATERAL);
      expect(debt).to.equal(BORROW_DEBT);
      expect(price).to.equal(INITIAL_PRICE_WEI);
      expect(isLiquidatable).to.be.false;

      // Expected HF: (1000 * 0.035 * 0.85) / 20 = 29.75 / 20 = 1.4875e18
      const expectedHf = ethers.parseEther("1.4875");
      expect(hf).to.equal(expectedHf);
    });

    it("should accurately reflect health factor drops when oracle price falls", async function () {
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      await position.connect(borrower).borrow(BORROW_DEBT);

      // Price drops to $0.027 per FLR: Collateral value = $27, Liquidation value = $22.95, HF = 22.95 / 20 = 1.1475 (Breaches 1.15 TEE trigger!)
      const droppedPrice = ethers.parseEther("0.027");
      await position.setMockPrice(droppedPrice, true);

      const hf = await position.getHealthFactorView(borrower.address);
      const expectedHf = ethers.parseEther("1.1475");
      expect(hf).to.equal(expectedHf);

      // Verify not yet liquidatable by public bots (1.1475 > 1.0)
      const [, , , , isLiquidatable] = await position.getPositionView(borrower.address);
      expect(isLiquidatable).to.be.false;
    });

    it("should allow liquidation only when health factor drops below 1.0", async function () {
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      await position.connect(borrower).borrow(BORROW_DEBT);

      // Severe crash to $0.020: Collateral = $20, Liq value = $17, HF = 17 / 20 = 0.85 (Liquidatable!)
      const crashPrice = ethers.parseEther("0.020");
      await position.setMockPrice(crashPrice, true);

      const [, , hf, , isLiquidatable] = await position.getPositionView(borrower.address);
      expect(isLiquidatable).to.be.true;
      expect(hf).to.be.lt(ethers.parseEther("1.0"));

      // Public liquidator liquidates the position
      await expect(position.connect(liquidator).liquidateBorrow(borrower.address))
        .to.emit(position, "Liquidated");

      const [collateralAfter, debtAfter] = await position.getPositionView(borrower.address);
      expect(debtAfter).to.equal(0);
      expect(collateralAfter).to.be.lt(DEPOSIT_COLLATERAL);
    });
  });

  describe("2. InstructionSender Confidential Compute Routing", function () {
    it("should emit FCC instruction events with matching OPType and OPCommand", async function () {
      const thresholdWei = ethers.parseEther("1.15"); // 1.15 HF trigger
      const maxRepayWei = ethers.parseEther("10"); // $10 repay

      const tx = await instructionSender.connect(borrower).registerPrivateTrigger(
        await position.getAddress(),
        await vault.getAddress(),
        thresholdWei,
        maxRepayWei
      );

      const opType = await instructionSender.OP_TYPE_AEGIS();
      const opCmd = await instructionSender.OP_CMD_REGISTER_TRIGGER();

      await expect(tx)
        .to.emit(instructionSender, "Instruction")
        .withArgs(opType, opCmd, (val) => val !== undefined, 1, borrower.address);

      await expect(tx).to.emit(instructionSender, "TriggerRegistered");
    });
  });

  describe("3. AegisVault & TEE Enclave Debt Repayment", function () {
    it("should allow user to deposit repayment reserve and execute protection via TEE Keeper", async function () {
      // 1. Borrower deposits collateral and borrows debt on Kinetic position
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      await position.connect(borrower).borrow(BORROW_DEBT);

      // 2. Borrower deposits $10 reserve into AegisVault
      const reserveAmount = ethers.parseEther("10");
      await vault.connect(borrower).depositReserve({ value: reserveAmount });
      expect(await vault.getReserve(borrower.address)).to.equal(reserveAmount);

      // 3. Price drops to $0.027 (HF drops to 1.1475, breaching TEE trigger of 1.15)
      const droppedPrice = ethers.parseEther("0.027");
      await position.setMockPrice(droppedPrice, true);

      // 4. TEE Keeper detects trigger breach and executes confidential repayment of $8
      const repayAmount = ethers.parseEther("8");
      const positionAddress = await position.getAddress();

      await expect(
        vault.connect(teeKeeper).executeProtection(borrower.address, positionAddress, repayAmount)
      )
        .to.emit(vault, "ProtectionTriggered")
        .withArgs(borrower.address, positionAddress, repayAmount, teeKeeper.address, reserveAmount - repayAmount);

      // 5. Verify position health factor has recovered!
      // New debt = $12. Collateral = 1,000 FLR @ $0.027 = $27. Liq Value = $22.95.
      // New HF = 22.95 / 12 = 1.9125 (Healthy & completely safe from MEV liquidation!)
      const [, debtRemaining, recoveredHf, , isLiquidatable] = await position.getPositionView(borrower.address);
      expect(debtRemaining).to.equal(BORROW_DEBT - repayAmount);
      expect(recoveredHf).to.equal(ethers.parseEther("1.9125"));
      expect(isLiquidatable).to.be.false;
    });

    it("should prevent unauthorized callers from triggering protection", async function () {
      const reserveAmount = ethers.parseEther("5");
      await vault.connect(borrower).depositReserve({ value: reserveAmount });

      await expect(
        vault.connect(liquidator).executeProtection(
          borrower.address,
          await position.getAddress(),
          ethers.parseEther("5")
        )
      ).to.be.revertedWith("Caller not authorized TEE keeper");
    });
  });
});
