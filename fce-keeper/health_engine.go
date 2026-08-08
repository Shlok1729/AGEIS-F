package main

import (
	"fmt"
	"math/big"
	"sync"
	"time"
)

type HealthEngine struct {
	triggers map[string]*PrivateTrigger
	mu       sync.RWMutex
	logs     []string
	logMu    sync.Mutex
}

func NewHealthEngine() *HealthEngine {
	return &HealthEngine{
		triggers: make(map[string]*PrivateTrigger),
		logs:     make([]string, 0),
	}
}

func (e *HealthEngine) RegisterTrigger(trigger *PrivateTrigger) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.triggers[trigger.TriggerID] = trigger
	e.AddLog(fmt.Sprintf("🔒 [TEE Enclave] Registered confidential trigger for %s. Trigger: %s HF, Target: %s HF, Max Cap: %s Wei",
		trigger.Borrower, FormatWeiToDecimal(trigger.ThresholdWei), FormatWeiToDecimal(trigger.TargetBufferHf), trigger.MaxRepayWei.String()))
}

func (e *HealthEngine) RevokeTrigger(triggerID string) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if t, exists := e.triggers[triggerID]; exists {
		t.Active = false
		e.AddLog(fmt.Sprintf("🔓 [TEE Enclave] Revoked trigger %s for %s", triggerID, t.Borrower))
	}
}

func (e *HealthEngine) GetActiveTriggers() []*PrivateTrigger {
	e.mu.RLock()
	defer e.mu.RUnlock()
	active := make([]*PrivateTrigger, 0)
	for _, t := range e.triggers {
		if t.Active {
			active = append(active, t)
		}
	}
	return active
}

// ComputeHealthFactor implements: (Collateral * Price * LiquidationThreshold) / Debt
func (e *HealthEngine) ComputeHealthFactor(collateralWei, debtWei, priceWei *big.Int, liqThresholdBps int64) *big.Int {
	if debtWei == nil || debtWei.Sign() == 0 {
		// Infinite health factor if zero debt
		return new(big.Int).Mul(big.NewInt(1000), big.NewInt(1000000000000000000))
	}
	if collateralWei == nil || collateralWei.Sign() == 0 || priceWei == nil || priceWei.Sign() == 0 {
		return big.NewInt(0)
	}

	// 1. Collateral Value in USD Wei = (CollateralWei * PriceWei) / 1e18
	collateralValUsd := new(big.Int).Mul(collateralWei, priceWei)
	collateralValUsd.Div(collateralValUsd, big.NewInt(1000000000000000000))

	// 2. Liquidation Value = (CollateralValUsd * liqThresholdBps) / 10000
	liqVal := new(big.Int).Mul(collateralValUsd, big.NewInt(liqThresholdBps))
	liqVal.Div(liqVal, big.NewInt(10000))

	// 3. Health Factor = (Liquidation Value * 1e18) / DebtWei
	hf := new(big.Int).Mul(liqVal, big.NewInt(1000000000000000000))
	hf.Div(hf, debtWei)

	return hf
}

// ComputeRequiredRepayToTargetHf calculates the exact debt repayment required to restore HF to a target safe buffer (e.g. 1.30 HF)
// Formula: TargetHF = (Collateral * Price * LiqThreshold) / (Debt - D_repay)
// => Debt - D_repay = (Collateral * Price * LiqThreshold) / TargetHF
// => D_repay = Debt - [ (Collateral * Price * LiqThreshold) / TargetHF ]
func (e *HealthEngine) ComputeRequiredRepayToTargetHf(collateralWei, debtWei, priceWei *big.Int, liqThresholdBps int64, targetHfWei *big.Int) *big.Int {
	if debtWei == nil || debtWei.Sign() == 0 || targetHfWei == nil || targetHfWei.Sign() == 0 || priceWei == nil || priceWei.Sign() == 0 {
		return big.NewInt(0)
	}

	// 1. Collateral Value in USD Wei
	collateralValUsd := new(big.Int).Mul(collateralWei, priceWei)
	collateralValUsd.Div(collateralValUsd, big.NewInt(1000000000000000000))

	// 2. Liquidation Value
	liqVal := new(big.Int).Mul(collateralValUsd, big.NewInt(liqThresholdBps))
	liqVal.Div(liqVal, big.NewInt(10000))

	// 3. Max allowable debt for Target HF: (liqVal * 1e18) / targetHfWei
	maxDebtForTarget := new(big.Int).Mul(liqVal, big.NewInt(1000000000000000000))
	maxDebtForTarget.Div(maxDebtForTarget, targetHfWei)

	// 4. If current debt is already under max debt for target HF, no repay needed
	if debtWei.Cmp(maxDebtForTarget) <= 0 {
		return big.NewInt(0)
	}

	// 5. Required repayment = Debt - MaxDebtForTarget
	requiredRepay := new(big.Int).Sub(debtWei, maxDebtForTarget)
	return requiredRepay
}

// EvaluateAndCheckRepay checks if current health factor breaches private trigger threshold
func (e *HealthEngine) EvaluateAndCheckRepay(trigger *PrivateTrigger, currentHf *big.Int) bool {
	if !trigger.Active || trigger.ThresholdWei == nil {
		return false
	}
	// Breach condition: Current HF <= Trigger Threshold
	if currentHf.Cmp(trigger.ThresholdWei) <= 0 {
		return true
	}
	return false
}

func (e *HealthEngine) AddLog(msg string) {
	e.logMu.Lock()
	defer e.logMu.Unlock()
	entry := fmt.Sprintf("[%s] %s", time.Now().Format("15:04:05.000"), msg)
	e.logs = append(e.logs, entry)
	if len(e.logs) > 60 {
		e.logs = e.logs[len(e.logs)-60:]
	}
}

func (e *HealthEngine) GetRecentLogs() []string {
	e.logMu.Lock()
	defer e.logMu.Unlock()
	copied := make([]string, len(e.logs))
	copy(copied, e.logs)
	return copied
}

func FormatWeiToDecimal(wei *big.Int) string {
	if wei == nil {
		return "0.0000"
	}
	f := new(big.Float).SetInt(wei)
	divisor := new(big.Float).SetInt(big.NewInt(1000000000000000000))
	f.Quo(f, divisor)
	return fmt.Sprintf("%.4f", f)
}

func FormatWeiToUSD(wei *big.Int) string {
	if wei == nil {
		return "0.00000"
	}
	f := new(big.Float).SetInt(wei)
	divisor := new(big.Float).SetInt(big.NewInt(1000000000000000000))
	f.Quo(f, divisor)
	return fmt.Sprintf("%.5f", f)
}
