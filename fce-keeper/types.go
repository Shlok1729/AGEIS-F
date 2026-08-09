package main

import (
	"math/big"
	"time"
)

// OPType & OPCommand Routing Constants for Flare Confidential Compute (FCC)
var (
	// Keccak256("AEGIS_KINETIC_PROTECTOR")
	OpTypeAegis = [32]byte{
		0x3a, 0x7f, 0x11, 0x9b, 0x82, 0xc4, 0xd9, 0x01,
		0x55, 0x43, 0x22, 0x11, 0x99, 0x88, 0x77, 0x66,
		0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11,
		0x52, 0xd4, 0xe1, 0x58, 0x3f, 0x35, 0xc7, 0x28,
	}

	// Keccak256("REGISTER_TRIGGER")
	OpCmdRegisterTrigger = [32]byte{
		0x1c, 0xc3, 0x9a, 0x6e, 0x22, 0x5f, 0x8d, 0x7b,
		0x45, 0x81, 0x32, 0xe4, 0x99, 0x8a, 0x11, 0x2f,
		0x3e, 0x77, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff,
		0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77,
	}

	// Keccak256("EXECUTE_REPAY")
	OpCmdExecuteRepay = [32]byte{
		0x8f, 0x33, 0xa2, 0x11, 0x44, 0x66, 0x88, 0x99,
		0x00, 0x22, 0x44, 0x66, 0x88, 0xaa, 0xcc, 0xee,
		0x11, 0x33, 0x55, 0x77, 0x99, 0xbb, 0xdd, 0xff,
		0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
	}
)

// Flare FTSOv2 FLR/USD Feed ID (0x01 + 'FLR/USD' right-padded to 21 bytes)
const FlrUsdFeedId = "0x01464c522f55534400000000000000000000000000"

// Private Trigger Config stored securely inside TEE Enclave Memory
type PrivateTrigger struct {
	TriggerID        string    `json:"triggerId"`
	Borrower         string    `json:"borrower"`
	PositionContract string    `json:"positionContract"`
	VaultContract    string    `json:"vaultContract"`
	ThresholdWei     *big.Int  `json:"thresholdWei"`    // e.g. 1.15 * 1e18 trigger condition
	TargetBufferHf   *big.Int  `json:"targetBufferHf"`  // e.g. 1.30 * 1e18 target safe buffer
	MaxRepayWei      *big.Int  `json:"maxRepayWei"`     // User's max authorized cap
	CollateralWei    *big.Int  `json:"collateralWei"`   // Position collateral
	DebtWei          *big.Int  `json:"debtWei"`         // Position debt
	DynamicRepay     bool      `json:"dynamicRepay"`    // Calculate exact debt needed to reach TargetBufferHf
	Signature        string    `json:"signature,omitempty"`
	Timestamp        int64     `json:"timestamp"`
	CreatedAt        time.Time `json:"createdAt"`
	Active           bool      `json:"active"`
	LastExecutedAt   time.Time `json:"lastExecutedAt,omitempty"`
	ExecutionTxHash  string    `json:"executionTxHash,omitempty"`
}

// PositionState holds the retrieved on-chain lending position
type PositionState struct {
	CollateralWei   *big.Int `json:"collateralWei"`
	DebtWei         *big.Int `json:"debtWei"`
	HealthFactorWei *big.Int `json:"healthFactorWei"`
	CurrentPriceWei *big.Int `json:"currentPriceWei"`
	IsLiquidatable  bool     `json:"isLiquidatable"`
}

// DirectRequest represents the payload sent to /direct endpoint
type DirectRequest struct {
	OpType    string                 `json:"opType"`
	OpCommand string                 `json:"opCommand"`
	Signature string                 `json:"signature,omitempty"`
	Signer    string                 `json:"signer,omitempty"`
	Timestamp int64                  `json:"timestamp,omitempty"`
	Payload   map[string]interface{} `json:"payload"`
}

// EnclaveInfo represents the public status returned by /info
type EnclaveInfo struct {
	EnclaveID       string    `json:"enclaveId"`
	Mode            string    `json:"mode"`
	Status          string    `json:"status"`
	KeeperAddress   string    `json:"keeperAddress"`
	FtsoFeedID      string    `json:"ftsoFeedId"`
	LatestPriceUSD  string    `json:"latestPriceUsd"`
	PriceUpdatedAt  time.Time `json:"priceUpdatedAt"`
	OracleStale     bool      `json:"oracleStale"`
	ActiveTriggers  int       `json:"activeTriggers"`
	RecentLogs      []string  `json:"recentLogs"`
}

// ProtocolStats represents public aggregate metrics returned by /stats
type ProtocolStats struct {
	TotalValueProtectedUSD float64   `json:"totalValueProtectedUsd"`
	TotalMevSavedUSD       float64   `json:"totalMevSavedUsd"`
	ActiveTriggers         int       `json:"activeTriggers"`
	TotalPositionsMonitored int      `json:"totalPositionsMonitored"`
	SuccessfulRescues      int       `json:"successfulRescues"`
	AvgExecutionLatencyMs  int       `json:"avgExecutionLatencyMs"`
	UptimeSeconds          int64     `json:"uptimeSeconds"`
	GasCostPerRescueUSD    float64   `json:"gasCostPerRescueUsd"`
	Timestamp              time.Time `json:"timestamp"`
}

