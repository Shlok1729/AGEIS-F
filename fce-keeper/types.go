package main

import (
	"math/big"
	"time"
)

// OPType and OPCommand routing constants (Keccak256 hashes)
var (
	// Keccak256("AEGIS_KINETIC_PROTECTOR")
	OpTypeAegis = [32]byte{
		0xb7, 0x48, 0x8a, 0x22, 0xa5, 0x3d, 0x1f, 0xb7,
		0x9e, 0xec, 0x27, 0xb0, 0x93, 0x3f, 0x4e, 0x9b,
		0x59, 0xa4, 0x76, 0x77, 0x6e, 0x05, 0x86, 0xbc,
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
	ThresholdWei     *big.Int  `json:"thresholdWei"` // e.g. 1.15 * 1e18
	MaxRepayWei      *big.Int  `json:"maxRepayWei"`
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
	Payload   map[string]interface{} `json:"payload"`
}

// EnclaveInfo represents the public status returned by /info
type EnclaveInfo struct {
	EnclaveID       string            `json:"enclaveId"`
	Mode            string            `json:"mode"`
	Status          string            `json:"status"`
	KeeperAddress   string            `json:"keeperAddress"`
	FtsoFeedID      string            `json:"ftsoFeedId"`
	LatestPriceUSD  string            `json:"latestPriceUsd"`
	PriceUpdatedAt  time.Time         `json:"priceUpdatedAt"`
	ActiveTriggers  int               `json:"activeTriggers"`
	RecentLogs      []string          `json:"recentLogs"`
}
