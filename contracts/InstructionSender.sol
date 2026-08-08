// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InstructionSender
 * @notice Standard Flare Confidential Compute (FCC) instruction emitter contract.
 * Emits instructions that are relayed to TEE machine extensions (FCE) via the FCC relay network.
 */
contract InstructionSender {
    // Standard OP Routing Constants matching the Go FCE daemon
    bytes32 public constant OP_TYPE_AEGIS = keccak256("AEGIS_KINETIC_PROTECTOR");
    bytes32 public constant OP_CMD_REGISTER_TRIGGER = keccak256("REGISTER_TRIGGER");
    bytes32 public constant OP_CMD_EXECUTE_REPAY = keccak256("EXECUTE_REPAY");
    bytes32 public constant OP_CMD_QUERY_STATUS = keccak256("QUERY_STATUS");

    address public owner;
    uint256 public instructionNonce;

    struct TriggerConfig {
        address borrower;
        address positionContract;
        address vaultContract;
        uint256 healthFactorThresholdWei; // e.g. 1.15 * 1e18
        uint256 maxRepayAmountWei;
        uint64 createdAt;
        bool active;
    }

    mapping(bytes32 => TriggerConfig) public registeredTriggers;

    // Flare Confidential Compute Instruction Event
    event Instruction(
        bytes32 indexed opType,
        bytes32 indexed opCommand,
        bytes payload,
        uint256 indexed nonce,
        address sender
    );

    event TriggerRegistered(
        bytes32 indexed triggerId,
        address indexed borrower,
        uint256 thresholdWei,
        uint256 maxRepayWei
    );

    event TriggerRevoked(bytes32 indexed triggerId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Send a raw confidential compute instruction
     */
    function sendInstruction(
        bytes32 opType,
        bytes32 opCommand,
        bytes calldata payload
    ) external returns (uint256 nonce) {
        nonce = ++instructionNonce;
        emit Instruction(opType, opCommand, payload, nonce, msg.sender);
    }

    /**
     * @notice Register a private liquidation defense trigger
     * @dev The threshold and target amount are encoded into an instruction for the TEE
     */
    function registerPrivateTrigger(
        address positionContract,
        address vaultContract,
        uint256 healthFactorThresholdWei,
        uint256 maxRepayAmountWei
    ) external returns (bytes32 triggerId, uint256 nonce) {
        require(positionContract != address(0), "Invalid position");
        require(healthFactorThresholdWei >= 1e18, "Threshold must be >= 1.0 HF");

        triggerId = keccak256(
            abi.encodePacked(
                msg.sender,
                positionContract,
                healthFactorThresholdWei,
                instructionNonce,
                block.timestamp
            )
        );

        registeredTriggers[triggerId] = TriggerConfig({
            borrower: msg.sender,
            positionContract: positionContract,
            vaultContract: vaultContract,
            healthFactorThresholdWei: healthFactorThresholdWei,
            maxRepayAmountWei: maxRepayAmountWei,
            createdAt: uint64(block.timestamp),
            active: true
        });

        bytes memory payload = abi.encode(
            triggerId,
            msg.sender,
            positionContract,
            vaultContract,
            healthFactorThresholdWei,
            maxRepayAmountWei
        );

        nonce = ++instructionNonce;
        emit Instruction(OP_TYPE_AEGIS, OP_CMD_REGISTER_TRIGGER, payload, nonce, msg.sender);
        emit TriggerRegistered(triggerId, msg.sender, healthFactorThresholdWei, maxRepayAmountWei);
    }

    /**
     * @notice Revoke a registered trigger
     */
    function revokeTrigger(bytes32 triggerId) external {
        TriggerConfig storage trigger = registeredTriggers[triggerId];
        require(trigger.borrower == msg.sender || msg.sender == owner, "Unauthorized");
        trigger.active = false;

        bytes memory payload = abi.encode(triggerId, msg.sender);
        uint256 nonce = ++instructionNonce;
        emit Instruction(OP_TYPE_AEGIS, keccak256("REVOKE_TRIGGER"), payload, nonce, msg.sender);
        emit TriggerRevoked(triggerId);
    }
}
