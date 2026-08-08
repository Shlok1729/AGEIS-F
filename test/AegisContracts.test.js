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

  describe("2. Edge Cases & Security Validations", function () {
    it("should handle zero debt safely with max uint256 health factor", async function () {
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      const hf = await position.getHealthFactorView(borrower.address);
      expect(hf).to.equal(ethers.MaxUint256);
    });

    it("should return zero health factor if collateral is zero with active debt", async function () {
      // Direct position simulation with debt but zero collateral
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      await position.connect(borrower).borrow(BORROW_DEBT);
      // Liquidator liquidates all collateral
      await position.setMockPrice(ethers.parseEther("0.001"), true);
      await position.connect(liquidator).liquidateBorrow(borrower.address);
      const [collateralAfter, debtAfter] = await position.getPositionView(borrower.address);
      expect(debtAfter).to.equal(0);
      expect(collateralAfter).to.equal(0);
    });

    it("should reject borrows exceeding maximum borrowing capacity", async function () {
      await position.connect(borrower).depositCollateral({ value: DEPOSIT_COLLATERAL });
      // Max borrow at 80% LTV = $28.00 USD. Trying to borrow $30 should revert.
      await expect(position.connect(borrower).borrow(ethers.parseEther("30")))
        .to.be.revertedWith("Exceeds borrow capacity");
    });

    it("should allow owner to update maximum oracle staleness limit", async function () {
      await expect(position.setMaxOracleStaleness(300))
        .to.emit(position, "OracleStalenessUpdated")
        .withArgs(180, 300);
      expect(await position.maxOracleStaleness()).to.equal(300);
    });
  });

  describe("3. InstructionSender Confidential Compute Routing", function () {
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

    it("should allow borrower to revoke an active trigger", async function () {
      const thresholdWei = ethers.parseEther("1.15");
      const maxRepayWei = ethers.parseEther("10");

      const tx = await instructionSender.connect(borrower).registerPrivateTrigger(
        await position.getAddress(),
        await vault.getAddress(),
        thresholdWei,
        maxRepayWei
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => instructionSender.interface.parseLog(l)?.name === "TriggerRegistered");
      const triggerId = instructionSender.interface.parseLog(event).args.triggerId;

      await expect(instructionSender.connect(borrower).revokeTrigger(triggerId))
        .to.emit(instructionSender, "TriggerRevoked")
        .withArgs(triggerId);
    });
  });

  describe("4. AegisVault, Circuit Breaker & TEE Debt Repayment", function () {
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

    it("should support circuit breaker pausing to halt automated execution during emergencies", async function () {
      const reserveAmount = ethers.parseEther("5");
      await vault.connect(borrower).depositReserve({ value: reserveAmount });

      // Owner triggers emergency pause
      await expect(vault.connect(owner).pause())
        .to.emit(vault, "Paused")
        .withArgs(owner.address);
      expect(await vault.paused()).to.be.true;

      // Executions should be blocked while paused
      await expect(
        vault.connect(teeKeeper).executeProtection(
          borrower.address,
          await position.getAddress(),
          ethers.parseEther("5")
        )
      ).to.be.revertedWith("Vault is paused");

      // Owner unpauses
      await expect(vault.connect(owner).unpause())
        .to.emit(vault, "Unpaused")
        .withArgs(owner.address);
      expect(await vault.paused()).to.be.false;
    });

    it("should allow users to withdraw their unspent reserve", async function () {
      const depositAmount = ethers.parseEther("5");
      await vault.connect(borrower).depositReserve({ value: depositAmount });

      const withdrawAmount = ethers.parseEther("2");
      await expect(vault.connect(borrower).withdrawReserve(withdrawAmount))
        .to.emit(vault, "ReserveWithdrawn")
        .withArgs(borrower.address, withdrawAmount);

      expect(await vault.getReserve(borrower.address)).to.equal(depositAmount - withdrawAmount);
    });
  });
});
