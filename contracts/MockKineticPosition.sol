// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/FtsoV2Interface.sol";
import "./interfaces/ContractRegistry.sol";

/**
 * @title MockKineticPosition
 * @notice Simulates Kinetic Market's Comptroller & ISO lending market mechanics on Flare Coston2.
 * Integrates live FTSOv2 block-latency price feeds with fallback support for local sandbox testing.
 */
contract MockKineticPosition {
    // 21-byte Feed ID for FLR/USD (0x01 + 'FLR/USD' padded to 21 bytes)
    bytes21 public constant FLR_USD_FEED = 0x01464c522f55534400000000000000000000000000;

    // FTSOv2 price feed contract reference
    FtsoV2Interface public ftsoV2;

    // Mock price override (used when FTSOv2 is unavailable or in deterministic simulation)
    uint256 public mockPriceWei;
    bool public useMockPrice;

    // Lending market parameters (basis points: 10000 = 100%)
    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public collateralFactorBps = 8000;      // 80% LTV borrow limit
    uint256 public liquidationThresholdBps = 8500;  // 85% Liquidation point
    uint256 public liquidationBonusBps = 800;       // 8% bonus for liquidators

    // User position data: Borrower => Collateral & Debt
    struct Position {
        uint256 collateralWei; // FLR deposited as collateral (18 decimals)
        uint256 debtWei;       // USD debt borrowed (18 decimals, 1 USD = 1e18)
        uint256 lastUpdated;
    }

    mapping(address => Position) public positions;

    // Protocol Events
    event CollateralDeposited(address indexed user, uint256 amountWei, uint256 totalCollateral);
    event Borrowed(address indexed user, uint256 amountWei, uint256 totalDebt);
    event RepaymentExecuted(address indexed borrower, address indexed payer, uint256 amountWei, uint256 remainingDebt, uint256 newHealthFactor);
    event Liquidated(address indexed borrower, address indexed liquidator, uint256 debtRepaid, uint256 collateralSeized);
    event MockPriceSet(uint256 newPriceWei, bool active);
    event FtsoV2Updated(address indexed newFtsoV2);

    constructor(address _ftsoV2Address) {
        if (_ftsoV2Address != address(0)) {
            ftsoV2 = FtsoV2Interface(_ftsoV2Address);
            useMockPrice = false;
        } else {
            mockPriceWei = 0.035 ether;
            useMockPrice = true;
        }
    }

    /**
     * @notice Retrieve the latest FLR/USD price from FTSOv2 or fallback mock
     * @return priceWei Price of 1 FLR in USD (scaled to 18 decimals)
     * @return timestamp Last price update timestamp
     */
    function getLatestPrice() public returns (uint256 priceWei, uint64 timestamp) {
        if (useMockPrice || address(ftsoV2) == address(0)) {
            return (mockPriceWei, uint64(block.timestamp));
        }

        try ftsoV2.getFeedByIdInWei(FLR_USD_FEED) returns (uint256 val, uint64 ts) {
            if (val > 0) {
                return (val, ts);
            }
        } catch {}

        // Fallback to mock price if live query fails
        return (mockPriceWei > 0 ? mockPriceWei : 0.035 ether, uint64(block.timestamp));
    }

    /**
     * @notice View helper to get current price (reading mock or static state)
     */
    function getLatestPriceView() public view returns (uint256 priceWei, uint64 timestamp) {
        return (mockPriceWei > 0 ? mockPriceWei : 0.035 ether, uint64(block.timestamp));
    }

    /**
     * @notice Deposit native FLR as collateral
     */
    function depositCollateral() external payable {
        require(msg.value > 0, "Zero deposit");
        Position storage pos = positions[msg.sender];
        pos.collateralWei += msg.value;
        pos.lastUpdated = block.timestamp;

        emit CollateralDeposited(msg.sender, msg.value, pos.collateralWei);
    }

    /**
     * @notice Deposit collateral on behalf of a user
     */
    function depositCollateralFor(address user) external payable {
        require(msg.value > 0, "Zero deposit");
        require(user != address(0), "Invalid user");
        Position storage pos = positions[user];
        pos.collateralWei += msg.value;
        pos.lastUpdated = block.timestamp;

        emit CollateralDeposited(user, msg.value, pos.collateralWei);
    }

    /**
     * @notice Borrow USD debt against deposited collateral
     * @param amountWei USD amount to borrow (18 decimals)
     */
    function borrow(uint256 amountWei) external {
        require(amountWei > 0, "Zero borrow");
        Position storage pos = positions[msg.sender];

        (uint256 priceWei, ) = getLatestPrice();
        uint256 collateralValueUsd = (pos.collateralWei * priceWei) / 1e18;
        uint256 maxBorrowUsd = (collateralValueUsd * collateralFactorBps) / BPS_DIVISOR;

        require(pos.debtWei + amountWei <= maxBorrowUsd, "Exceeds borrow capacity");

        pos.debtWei += amountWei;
        pos.lastUpdated = block.timestamp;

        emit Borrowed(msg.sender, amountWei, pos.debtWei);
    }

    /**
     * @notice Repay borrowed debt for a borrower (can be called by AegisVault or user)
     * @param borrower The address of the borrower whose debt is being repaid
     * @param amountWei Amount of USD debt to repay (18 decimals)
     */
    function repayBorrow(address borrower, uint256 amountWei) external {
        require(amountWei > 0, "Zero repay");
        Position storage pos = positions[borrower];
        require(pos.debtWei > 0, "No active debt");

        uint256 actualRepay = amountWei > pos.debtWei ? pos.debtWei : amountWei;
        pos.debtWei -= actualRepay;
        pos.lastUpdated = block.timestamp;

        uint256 newHealthFactor = getHealthFactor(borrower);
        emit RepaymentExecuted(borrower, msg.sender, actualRepay, pos.debtWei, newHealthFactor);
    }

    /**
     * @notice Public liquidation mechanism (MEV bots call this when Health Factor < 1.0)
     * @param borrower Address to liquidate
     */
    function liquidateBorrow(address borrower) external {
        uint256 hf = getHealthFactor(borrower);
        require(hf < 1e18, "Position is healthy (HF >= 1.0)");

        Position storage pos = positions[borrower];
        uint256 debtToCover = pos.debtWei;
        require(debtToCover > 0, "No debt to liquidate");

        (uint256 priceWei, ) = getLatestPrice();

        // Calculate collateral seized including liquidation bonus
        uint256 collateralValueRequired = (debtToCover * (BPS_DIVISOR + liquidationBonusBps)) / BPS_DIVISOR;
        uint256 collateralToSeize = (collateralValueRequired * 1e18) / priceWei;

        if (collateralToSeize > pos.collateralWei) {
            collateralToSeize = pos.collateralWei;
        }

        pos.debtWei = 0;
        pos.collateralWei -= collateralToSeize;
        pos.lastUpdated = block.timestamp;

        emit Liquidated(borrower, msg.sender, debtToCover, collateralToSeize);
    }

    /**
     * @notice Calculate current health factor for an account
     * @dev Health Factor = (Collateral Value in USD * Liquidation Threshold) / Debt in USD
     * @return hf Health factor scaled to 18 decimals (1e18 = 1.0, 1.5e18 = 1.5)
     */
    function getHealthFactor(address user) public returns (uint256 hf) {
        Position storage pos = positions[user];
        if (pos.debtWei == 0) {
            return type(uint256).max; // Infinite health factor if no debt
        }
        if (pos.collateralWei == 0) {
            return 0;
        }

        (uint256 priceWei, ) = getLatestPrice();
        uint256 collateralValueUsd = (pos.collateralWei * priceWei) / 1e18;
        uint256 liquidationValueUsd = (collateralValueUsd * liquidationThresholdBps) / BPS_DIVISOR;

        return (liquidationValueUsd * 1e18) / pos.debtWei;
    }

    /**
     * @notice Calculate current health factor for an account (view mode)
     */
    function getHealthFactorView(address user) public view returns (uint256 hf) {
        Position storage pos = positions[user];
        if (pos.debtWei == 0) {
            return type(uint256).max;
        }
        if (pos.collateralWei == 0) {
            return 0;
        }

        (uint256 priceWei, ) = getLatestPriceView();
        uint256 collateralValueUsd = (pos.collateralWei * priceWei) / 1e18;
        uint256 liquidationValueUsd = (collateralValueUsd * liquidationThresholdBps) / BPS_DIVISOR;

        return (liquidationValueUsd * 1e18) / pos.debtWei;
    }

    /**
     * @notice Get comprehensive position details in a single call
     */
    function getPosition(address user) external returns (
        uint256 collateralWei,
        uint256 debtWei,
        uint256 healthFactor,
        uint256 currentPriceWei,
        bool isLiquidatable
    ) {
        Position storage pos = positions[user];
        (uint256 price, ) = getLatestPrice();
        uint256 hf = getHealthFactor(user);
        bool liquidatable = (pos.debtWei > 0 && hf < 1e18);

        return (
            pos.collateralWei,
            pos.debtWei,
            hf,
            price,
            liquidatable
        );
    }

    /**
     * @notice Get comprehensive position details (view mode)
     */
    function getPositionView(address user) external view returns (
        uint256 collateralWei,
        uint256 debtWei,
        uint256 healthFactor,
        uint256 currentPriceWei,
        bool isLiquidatable
    ) {
        Position storage pos = positions[user];
        (uint256 price, ) = getLatestPriceView();
        uint256 hf = getHealthFactorView(user);
        bool liquidatable = (pos.debtWei > 0 && hf < 1e18);

        return (
            pos.collateralWei,
            pos.debtWei,
            hf,
            price,
            liquidatable
        );
    }

    /**
     * @notice Override mock price for local testing or simulated market volatility
     */
    function setMockPrice(uint256 _priceWei, bool _active) external {
        mockPriceWei = _priceWei;
        useMockPrice = _active;
        emit MockPriceSet(_priceWei, _active);
    }

    /**
     * @notice Update FTSOv2 interface address
     */
    function setFtsoV2(address _newFtsoV2) external {
        ftsoV2 = FtsoV2Interface(_newFtsoV2);
        useMockPrice = (_newFtsoV2 == address(0));
        emit FtsoV2Updated(_newFtsoV2);
    }
}
