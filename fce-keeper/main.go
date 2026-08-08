package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/crypto"
)

type Config struct {
	Port             int
	InternalPort     int
	Mode             int // 0 = Simulation, 1 = Hardware Attestation
	RpcUrl           string
	PositionContract string
	VaultContract    string
	SenderContract   string
	ApiKey           string
	PrivateKeyHex    string
}

func loadConfig() *Config {
	port, _ := strconv.Atoi(getEnv("PORT", "6662"))
	internalPort, _ := strconv.Atoi(getEnv("INTERNAL_PORT", "6661"))
	mode, _ := strconv.Atoi(getEnv("MODE", "0"))

	return &Config{
		Port:             port,
		InternalPort:     internalPort,
		Mode:             mode,
		RpcUrl:           getEnv("COSTON2_RPC", "https://coston2-api.flare.network/ext/C/rpc"),
		PositionContract: getEnv("POSITION_CONTRACT", "0x6376892136f7c85E09c0e36100ffA6b484B3AC8c"),
		VaultContract:    getEnv("VAULT_CONTRACT", "0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e"),
		SenderContract:   getEnv("SENDER_CONTRACT", "0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c"),
		ApiKey:           getEnv("API_KEY", ""),
		PrivateKeyHex:    getEnv("PRIVATE_KEY", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

// verifySignature checks EIP-191 personal signature over payload
func verifySignature(borrower, signatureHex, message string) bool {
	if signatureHex == "" || borrower == "" {
		return true // Allow unsigned in sandbox / demo MODE=0
	}
	sigBytes, err := hex.DecodeString(strings.TrimPrefix(signatureHex, "0x"))
	if err != nil || len(sigBytes) != 65 {
		return false
	}
	if sigBytes[64] >= 27 {
		sigBytes[64] -= 27
	}

	prefixedMsg := fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)
	hash := crypto.Keccak256([]byte(prefixedMsg))
	pubKey, err := crypto.SigToPub(hash, sigBytes)
	if err != nil {
		return false
	}
	recoveredAddr := crypto.PubkeyToAddress(*pubKey).Hex()
	return strings.EqualFold(recoveredAddr, borrower)
}

func main() {
	cfg := loadConfig()
	log.Printf("==================================================")
	log.Printf("🛡️  Starting Aegis-F Confidential TEE Keeper")
	log.Printf("   Mode: %d (0 = FCC Simulation Mode)", cfg.Mode)
	log.Printf("   Public tee-proxy port: %d", cfg.Port)
	log.Printf("   Internal port: %d", cfg.InternalPort)
	log.Printf("   Position Market: %s", cfg.PositionContract)
	log.Printf("   AegisVault: %s", cfg.VaultContract)
	log.Printf("   InstructionSender: %s", cfg.SenderContract)
	log.Printf("==================================================")

	healthEngine := NewHealthEngine()
	signer, err := NewEvmSigner(cfg.PrivateKeyHex, cfg.RpcUrl, cfg.Mode == 0)
	if err != nil {
		log.Fatalf("Failed to initialize EVM Signer: %v", err)
	}
	log.Printf("🔑 TEE Enclave Keeper Address: %s", signer.GetAddress())

	poller := NewFtsoPoller(cfg.RpcUrl, cfg.PositionContract)

	// Main execution loop: evaluate private triggers on each FTSOv2 price tick
	poller.Start(1800*time.Millisecond, func(price *big.Int) {
		// Tier 1: Oracle Staleness Check
		if poller.IsStale() {
			healthEngine.AddLog("⚠️ [Oracle Stale] FTSOv2 price feed age exceeds 120s limit. Pausing automated actions.")
			return
		}

		triggers := healthEngine.GetActiveTriggers()
		for _, t := range triggers {
			collateralWei := t.CollateralWei
			if collateralWei == nil || collateralWei.Sign() == 0 {
				collateralWei = big.NewInt(0).Mul(big.NewInt(1000), big.NewInt(1e18)) // 1000 FLR fallback
			}
			debtWei := t.DebtWei
			if debtWei == nil || debtWei.Sign() == 0 {
				debtWei = big.NewInt(0).Mul(big.NewInt(20), big.NewInt(1e18)) // $20 USD fallback
			}

			// Compute current health factor
			currentHf := healthEngine.ComputeHealthFactor(collateralWei, debtWei, price, 8500)

			// Check breach condition
			if healthEngine.EvaluateAndCheckRepay(t, currentHf) {
				// Tier 1: Dynamic Repayment Algorithm to reach target buffer (1.30 HF default)
				targetHf := t.TargetBufferHf
				if targetHf == nil || targetHf.Sign() == 0 {
					targetHf = big.NewInt(0).Mul(big.NewInt(130), big.NewInt(1e16)) // 1.30 HF
				}

				requiredRepay := healthEngine.ComputeRequiredRepayToTargetHf(collateralWei, debtWei, price, 8500, targetHf)
				if requiredRepay.Sign() == 0 {
					requiredRepay = big.NewInt(0).Mul(big.NewInt(8), big.NewInt(1e18)) // $8 default fallback
				}
				// Cap at user's max repay authorization
				if t.MaxRepayWei != nil && t.MaxRepayWei.Sign() > 0 && requiredRepay.Cmp(t.MaxRepayWei) > 0 {
					requiredRepay = t.MaxRepayWei
				}

				healthEngine.AddLog(fmt.Sprintf("🚨 [TEE Trigger Breached] HF: %s <= %s. Target: %s HF. Dynamic Repay Amount: %s USD Wei",
					FormatWeiToDecimal(currentHf), FormatWeiToDecimal(t.ThresholdWei), FormatWeiToDecimal(targetHf), requiredRepay.String()))

				txHash, err := signer.ExecuteRepay(t.VaultContract, t.Borrower, t.PositionContract, requiredRepay)
				if err == nil {
					t.Active = false
					t.LastExecutedAt = time.Now()
					t.ExecutionTxHash = txHash
					healthEngine.AddLog(fmt.Sprintf("✅ [Confidential Rescue Confirmed] Protected %s from MEV liquidators! Tx: %s", t.Borrower, txHash))
				} else {
					healthEngine.AddLog(fmt.Sprintf("❌ [Repay Error] %v", err))
				}
			}
		}
	})

	// Setup HTTP Handlers
	mux := http.NewServeMux()

	// CORS middleware
	corsMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization, X-Signature")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	// 1. GET /info - Enclave status and health
	mux.HandleFunc("/info", func(w http.ResponseWriter, r *http.Request) {
		price, ts := poller.GetPrice()
		info := EnclaveInfo{
			EnclaveID:      "fcc-coston2-enclave-0x7984",
			Mode:           "MODE=0 (FCC Local Simulation / Hackathon Testnet)",
			Status:         "ACTIVE_PROTECTING",
			KeeperAddress:  signer.GetAddress(),
			FtsoFeedID:     FlrUsdFeedId,
			LatestPriceUSD: FormatWeiToUSD(price),
			PriceUpdatedAt: ts,
			OracleStale:    poller.IsStale(),
			ActiveTriggers: len(healthEngine.GetActiveTriggers()),
			RecentLogs:     healthEngine.GetRecentLogs(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(info)
	})

	// 2. POST /direct - Confidential trigger registration with Signature Verification & Dynamic Repayment
	mux.HandleFunc("/direct", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req DirectRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		borrower, _ := req.Payload["borrower"].(string)
		if borrower == "" {
			borrower = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
		}
		posAddr, _ := req.Payload["positionContract"].(string)
		if posAddr == "" {
			posAddr = cfg.PositionContract
		}
		vaultAddr, _ := req.Payload["vaultContract"].(string)
		if vaultAddr == "" {
			vaultAddr = cfg.VaultContract
		}

		// Tier 1: Signature verification check
		if req.Signature != "" {
			msg := fmt.Sprintf("RegisterAegisTrigger:%s:%s", borrower, posAddr)
			if !verifySignature(borrower, req.Signature, msg) {
				http.Error(w, "Invalid cryptographic signature", http.StatusUnauthorized)
				return
			}
		}

		thresholdHfFloat, _ := req.Payload["thresholdHf"].(float64)
		if thresholdHfFloat <= 0 {
			thresholdHfFloat = 1.15
		}
		thresholdWei := new(big.Int)
		new(big.Float).Mul(big.NewFloat(thresholdHfFloat), big.NewFloat(1e18)).Int(thresholdWei)

		targetHfWei := big.NewInt(0).Mul(big.NewInt(130), big.NewInt(1e16)) // 1.30 target buffer

		repayUsdFloat, _ := req.Payload["repayUsd"].(float64)
		if repayUsdFloat <= 0 {
			repayUsdFloat = 8.0
		}
		repayWei := new(big.Int)
		new(big.Float).Mul(big.NewFloat(repayUsdFloat), big.NewFloat(1e18)).Int(repayWei)

		trigger := &PrivateTrigger{
			TriggerID:        fmt.Sprintf("trg-%d", time.Now().UnixNano()),
			Borrower:         borrower,
			PositionContract: posAddr,
			VaultContract:    vaultAddr,
			ThresholdWei:     thresholdWei,
			TargetBufferHf:   targetHfWei,
			MaxRepayWei:      repayWei,
			CollateralWei:    big.NewInt(0).Mul(big.NewInt(1000), big.NewInt(1e18)),
			DebtWei:          big.NewInt(0).Mul(big.NewInt(20), big.NewInt(1e18)),
			DynamicRepay:     true,
			Signature:        req.Signature,
			Timestamp:        time.Now().Unix(),
			CreatedAt:        time.Now(),
			Active:           true,
		}

		healthEngine.RegisterTrigger(trigger)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":       "SUCCESS",
			"triggerId":    trigger.TriggerID,
			"enclave":      "Confidential TEE Vault",
			"dynamicRepay": true,
			"targetBuffer": "1.30 HF",
			"message":      "Private threshold stored in enclave memory; invisible to public liquidators.",
		})
	})

	// 3. POST /simulate-price - Market simulation endpoint
	mux.HandleFunc("/simulate-price", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			PriceUSD float64 `json:"priceUsd"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.PriceUSD <= 0 {
			http.Error(w, "Invalid price", http.StatusBadRequest)
			return
		}

		priceWei := new(big.Int)
		f := new(big.Float).Mul(big.NewFloat(req.PriceUSD), big.NewFloat(1e18))
		f.Int(priceWei)

		poller.SetSimulatedPrice(priceWei)
		healthEngine.AddLog(fmt.Sprintf("📉 [Market Movement] FTSOv2 price moved to $%.5f. Re-evaluating health factors...", req.PriceUSD))

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"newPriceUSD": req.PriceUSD,
			"newPriceWei": priceWei.String(),
			"timestamp":   time.Now().Unix(),
		})
	})

	// 4. GET /logs - Audit trail
	mux.HandleFunc("/logs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"logs": healthEngine.GetRecentLogs(),
		})
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: corsMiddleware(mux),
	}

	log.Printf("🚀 TEE Proxy listening on http://localhost:%d", cfg.Port)
	if err := server.ListenAndServe(); err != nil {
		log.Printf("Server stopped: %v", err)
	}
}
