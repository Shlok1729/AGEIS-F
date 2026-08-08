package main

import (
	"bytes"
	"encoding/json"
	"io"
	"math/big"
	"net/http"
	"sync"
	"time"
)

type FtsoPoller struct {
	rpcUrl        string
	positionAddr  string
	latestPrice   *big.Int
	lastUpdated   time.Time
	maxStaleness  time.Duration
	mu            sync.RWMutex
	stopChan      chan struct{}
	httpClient    *http.Client
}

func NewFtsoPoller(rpcUrl, positionAddr string) *FtsoPoller {
	return &FtsoPoller{
		rpcUrl:       rpcUrl,
		positionAddr: positionAddr,
		latestPrice:  big.NewInt(35000000000000000), // $0.035 in Wei default
		lastUpdated:  time.Now(),
		maxStaleness: 120 * time.Second,             // Reject prices older than 120s
		stopChan:     make(chan struct{}),
		httpClient:   &http.Client{Timeout: 5 * time.Second},
	}
}

// Start initiates the block-latency (~1.8s) FTSOv2 polling loop
func (p *FtsoPoller) Start(interval time.Duration, onPriceTick func(price *big.Int)) {
	ticker := time.NewTicker(interval)
	go func() {
		for {
			select {
			case <-ticker.C:
				price, err := p.fetchPrice()
				if err == nil && price != nil && price.Sign() > 0 {
					p.mu.Lock()
					p.latestPrice = price
					p.lastUpdated = time.Now()
					p.mu.Unlock()
					if onPriceTick != nil {
						onPriceTick(price)
					}
				}
			case <-p.stopChan:
				ticker.Stop()
				return
			}
		}
	}()
}

func (p *FtsoPoller) Stop() {
	close(p.stopChan)
}

func (p *FtsoPoller) GetPrice() (*big.Int, time.Time) {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return new(big.Int).Set(p.latestPrice), p.lastUpdated
}

func (p *FtsoPoller) IsStale() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return time.Since(p.lastUpdated) > p.maxStaleness
}

func (p *FtsoPoller) SetSimulatedPrice(price *big.Int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.latestPrice = new(big.Int).Set(price)
	p.lastUpdated = time.Now()
}

// fetchPrice queries getLatestPriceView() from MockKineticPosition or FTSOv2
func (p *FtsoPoller) fetchPrice() (*big.Int, error) {
	if p.positionAddr == "" {
		return p.latestPrice, nil
	}

	// 4-byte selector for getLatestPriceView(): 0x6e2c39d7
	data := "0x6e2c39d7"
	reqBody, _ := json.Marshal(map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "eth_call",
		"params": []interface{}{
			map[string]string{
				"to":   p.positionAddr,
				"data": data,
			},
			"latest",
		},
	})

	resp, err := p.httpClient.Post(p.rpcUrl, "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var jsonResp struct {
		Result string `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &jsonResp); err != nil || jsonResp.Error != nil || jsonResp.Result == "" || jsonResp.Result == "0x" {
		// Fallback to latest known price
		return p.latestPrice, nil
	}

	// Parse first 32 bytes as priceWei
	hexStr := jsonResp.Result
	if len(hexStr) >= 66 {
		priceWei := new(big.Int)
		priceWei.SetString(hexStr[2:66], 16)
		if priceWei.Sign() > 0 {
			return priceWei, nil
		}
	}

	return p.latestPrice, nil
}
