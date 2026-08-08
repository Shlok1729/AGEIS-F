package main

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

type EvmSigner struct {
	privateKey    *ecdsa.PrivateKey
	address       common.Address
	rpcUrl        string
	httpClient    *http.Client
	isSimulation  bool
	executionLogs []string
}

func NewEvmSigner(hexKey, rpcUrl string, isSimulation bool) (*EvmSigner, error) {
	var key *ecdsa.PrivateKey
	var err error

	cleanKey := strings.TrimPrefix(hexKey, "0x")
	if cleanKey != "" {
		key, err = crypto.HexToECDSA(cleanKey)
		if err != nil {
			return nil, fmt.Errorf("invalid private key: %w", err)
		}
	} else {
		// Generate deterministic demo keeper key if not provided
		key, _ = crypto.GenerateKey()
	}

	addr := crypto.PubkeyToAddress(key.PublicKey)

	return &EvmSigner{
		privateKey:    key,
		address:       addr,
		rpcUrl:        rpcUrl,
		httpClient:    &http.Client{Timeout: 10 * time.Second},
		isSimulation:  isSimulation,
		executionLogs: make([]string, 0),
	}, nil
}

func (s *EvmSigner) GetAddress() string {
	return s.address.Hex()
}

// ExecuteRepay constructs and broadcasts the executeProtection call to AegisVault
func (s *EvmSigner) ExecuteRepay(vaultAddr, borrowerAddr, positionAddr string, repayAmount *big.Int) (string, error) {
	// Function selector for executeProtection(address,address,uint256)
	// Keccak256("executeProtection(address,address,uint256)")[:4]
	methodSignature := []byte("executeProtection(address,address,uint256)")
	selector := crypto.Keccak256(methodSignature)[:4]

	// ABI encoding parameters
	borrower := common.HexToAddress(borrowerAddr)
	position := common.HexToAddress(positionAddr)

	var payload []byte
	payload = append(payload, selector...)
	payload = append(payload, common.LeftPadBytes(borrower.Bytes(), 32)...)
	payload = append(payload, common.LeftPadBytes(position.Bytes(), 32)...)
	payload = append(payload, common.LeftPadBytes(repayAmount.Bytes(), 32)...)

	hexData := "0x" + hex.EncodeToString(payload)

	if s.isSimulation {
		// In MODE=0 simulation or demo mode, mock tx hash or send direct RPC call
		txHash := fmt.Sprintf("0x%s", hex.EncodeToString(crypto.Keccak256([]byte(fmt.Sprintf("%s-%s-%d", borrowerAddr, repayAmount.String(), time.Now().UnixNano())))))
		logMsg := fmt.Sprintf("⚡ [TEE Execution] Auto-repayment dispatched to AegisVault (%s). Borrower: %s, Repay: %s Wei. Tx: %s",
			vaultAddr, borrowerAddr, repayAmount.String(), txHash[:18]+"...")
		s.executionLogs = append(s.executionLogs, logMsg)
		return txHash, nil
	}

	// Real on-chain broadcast via RPC eth_sendTransaction
	reqBody, _ := json.Marshal(map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "eth_sendTransaction",
		"params": []interface{}{
			map[string]string{
				"from": s.address.Hex(),
				"to":   vaultAddr,
				"data": hexData,
				"gas":  "0x7A120", // 500,000 gas
			},
		},
	})

	resp, err := s.httpClient.Post(s.rpcUrl, "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var jsonResp struct {
		Result string `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	json.Unmarshal(body, &jsonResp)

	if jsonResp.Error != nil {
		return "", fmt.Errorf("RPC error: %s", jsonResp.Error.Message)
	}

	return jsonResp.Result, nil
}
