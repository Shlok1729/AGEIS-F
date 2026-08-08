// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockKineticPosition.sol";

/**
 * @title AegisVault
 * @notice Confidential Liquidation Protection Vault.
 * Custodies user repayment reserves and grants permission to authorized TEE enclaves
 * to execute debt repayments when confidential health-factor triggers are breached.
 */
contract AegisVault {
    address public owner;
    
    // Authorized TEE Keeper address (held inside the FCC TEE enclave / PMW)
    address public teeKeeper;

    // User reserve balance for automated repayments (in Wei)
    mapping(address => uint256) public userReserves;

    // Custom authorized keepers per user (optional, fallback to global teeKeeper)
    mapping(address => address) public userDelegatedKeeper;

    event ReserveDeposited(address indexed user, uint256 amount);
    event ReserveWithdrawn(address indexed user, uint256 amount);
    event TeeKeeperUpdated(address indexed previousKeeper, address indexed newKeeper);
    event UserKeeperDelegated(address indexed user, address indexed keeper);
    event ProtectionTriggered(
        address indexed borrower,
        address indexed positionContract,
        uint256 repayAmount,
        address indexed keeper,
        uint256 remainingReserve
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedKeeper(address borrower) {
        address designatedKeeper = userDelegatedKeeper[borrower];
        if (designatedKeeper == address(0)) {
            designatedKeeper = teeKeeper;
        }
        require(
            msg.sender == designatedKeeper || msg.sender == owner,
            "Caller not authorized TEE keeper"
        );
        _;
    }

    constructor(address _teeKeeper) {
        owner = msg.sender;
        teeKeeper = _teeKeeper;
    }

    /**
     * @notice Set or update the global TEE Keeper address
     */
    function setTeeKeeper(address _newKeeper) external onlyOwner {
        require(_newKeeper != address(0), "Invalid keeper");
        address old = teeKeeper;
        teeKeeper = _newKeeper;
        emit TeeKeeperUpdated(old, _newKeeper);
    }

    /**
     * @notice Delegate an explicit custom keeper address for msg.sender
     */
    function delegateCustomKeeper(address _keeper) external {
        userDelegatedKeeper[msg.sender] = _keeper;
        emit UserKeeperDelegated(msg.sender, _keeper);
    }

    /**
     * @notice Deposit reserve funds allocated for automated debt repayment
     */
    function depositReserve() external payable {
        require(msg.value > 0, "Zero deposit");
        userReserves[msg.sender] += msg.value;
        emit ReserveDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Deposit reserve on behalf of a specific user
     */
    function depositReserveFor(address user) external payable {
        require(msg.value > 0, "Zero deposit");
        require(user != address(0), "Invalid user");
        userReserves[user] += msg.value;
        emit ReserveDeposited(user, msg.value);
    }

    /**
     * @notice Withdraw unused reserve funds
     */
    function withdrawReserve(uint256 amount) external {
        require(userReserves[msg.sender] >= amount, "Insufficient reserve");
        userReserves[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit ReserveWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Execute confidential debt repayment on behalf of a borrower
     * @dev Only callable by the verified TEE enclave keeper holding the private trigger
     * @param borrower Target borrower whose position is in danger
     * @param positionContract Address of the lending market / MockKineticPosition contract
     * @param repayAmount Amount of debt to repay in USD Wei
     */
    function executeProtection(
        address borrower,
        address positionContract,
        uint256 repayAmount
    ) external onlyAuthorizedKeeper(borrower) {
        require(positionContract != address(0), "Invalid position contract");
        require(repayAmount > 0, "Zero repay amount");

        uint256 currentReserve = userReserves[borrower];
        require(currentReserve >= repayAmount, "Insufficient user reserve");

        userReserves[borrower] -= repayAmount;

        // Call the lending position contract to repay the debt
        MockKineticPosition(positionContract).repayBorrow(borrower, repayAmount);

        emit ProtectionTriggered(
            borrower,
            positionContract,
            repayAmount,
            msg.sender,
            userReserves[borrower]
        );
    }

    /**
     * @notice Get user reserve balance
     */
    function getReserve(address user) external view returns (uint256) {
        return userReserves[user];
    }

    receive() external payable {
        userReserves[msg.sender] += msg.value;
        emit ReserveDeposited(msg.sender, msg.value);
    }
}
