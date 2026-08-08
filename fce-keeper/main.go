package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strconv"
	"time"
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
		PositionContract: getEnv("POSITION_CONTRACT", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
		VaultContract:    getEnv("VAULT_CONTRACT", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"),
		SenderContract:   getEnv("SENDER_CONTRACT", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
		ApiKey:           getEnv("API_KEY", "aegis-confidential-key-2026"),
		PrivateKeyHex:    getEnv("PRIVATE_KEY", ""),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}

func main() {
	cfg := loadConfig()
	log.Printf("==================================================")
	log.Printf("🛡️  Starting Aegis-F Confidential TEE Keeper")
	log.Printf("   Mode: %d (0 = FCC Simulation Mode)", cfg.Mode)
	log.Printf("   Public tee-proxy port: %d", cfg.Port)
	log.Printf("   Internal port: %d", cfg.InternalPort)
	log.Printf("   Target network: Coston2 (FTSOv2 Active)")
	log.Printf("==================================================")

	healthEngine := NewHealthEngine()
	signer, err := NewEvmSigner(cfg.PrivateKeyHex, cfg.RpcUrl, cfg.Mode == 0)
	if err != nil {
		log.Fatalf("Failed to initialize EVM Signer: %v", err)
	}
	log.Printf("🔑 TEE Enclave Keeper Address: %s", signer.GetAddress())

	poller := NewFtsoPoller(cfg.RpcUrl, cfg.PositionContract)
	poller.Start(1800*time.Millisecond, func(price *big.Int) {
		// On each FTSOv2 price tick, evaluate all active confidential triggers
		triggers := healthEngine.GetActiveTriggers()
		for _, t := range triggers {
			// Compute position health factor
			// Default demo position: 1000 FLR collateral, 20 USD debt, 85% liquidation threshold
			collateralWei := big.NewInt(0).Mul(big.NewInt(1000), big.NewInt(1000000000000000000))
			debtWei := big.NewInt(0).Mul(big.NewInt(20), big.NewInt(1000000000000000000))
			currentHf := healthEngine.ComputeHealthFactor(collateralWei, debtWei, price, 8500)

			if healthEngine.EvaluateAndCheckRepay(t, currentHf) {
				healthEngine.AddLog(fmt.Sprintf("🚨 [TEE Alert] Trigger condition breached! HF: %s <= %s. Firing confidential repayment.",
					FormatWeiToDecimal(currentHf), FormatWeiToDecimal(t.ThresholdWei)))

				txHash, err := signer.ExecuteRepay(t.VaultContract, t.Borrower, t.PositionContract, t.MaxRepayWei)
				if err == nil {
					t.Active = false
					t.LastExecutedAt = time.Now()
					t.ExecutionTxHash = txHash
					healthEngine.AddLog(fmt.Sprintf("✅ [Auto-Repay Success] Protected %s from MEV liquidation! Tx: %s", t.Borrower, txHash))
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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	// 1. GET /info - Enclave status and attestation
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
			ActiveTriggers: len(healthEngine.GetActiveTriggers()),
			RecentLogs:     healthEngine.GetRecentLogs(),
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(info)
	})

	// 2. POST /direct - Synchronous FCC trigger bypass endpoint
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

		// Handle trigger registration
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

		thresholdWei := big.NewInt(0).Mul(big.NewInt(115), big.NewInt(10000000000000000)) // 1.15 HF
		repayWei := big.NewInt(0).Mul(big.NewInt(8), big.NewInt(1000000000000000000))     // $8 USD repay

		trigger := &PrivateTrigger{
			TriggerID:        fmt.Sprintf("trg-%d", time.Now().UnixNano()),
			Borrower:         borrower,
			PositionContract: posAddr,
			VaultContract:    vaultAddr,
			ThresholdWei:     thresholdWei,
			MaxRepayWei:      repayWei,
			CreatedAt:        time.Now(),
			Active:           true,
		}

		healthEngine.RegisterTrigger(trigger)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "SUCCESS",
			"triggerId": trigger.TriggerID,
			"enclave":   "Confidential TEE Vault",
			"message":   "Private threshold stored in enclave memory; invisible to public liquidators.",
		})
	})

	// 3. POST /simulate-price - For demo UI to test price volatility
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
		healthEngine.AddLog(fmt.Sprintf("📉 [Market Sim] FTSOv2 price moved to $%.4f. Evaluating health factor...", req.PriceUSD))

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"newPriceUSD": req.PriceUSD,
			"newPriceWei": priceWei.String(),
			"timestamp":   time.Now().Unix(),
		})
	})

	// 4. GET /logs - Execution audit trail
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
