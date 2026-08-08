/**
 * keeperApi.js — Frontend service layer for the Aegis-F Go TEE keeper.
 *
 * Polls /info and /logs on the running tee-proxy (port 6662, proxied via Vite
 * to /api to avoid CORS).  If the keeper is offline, all calls resolve with
 * { online: false } and the UI falls back to its simulation mode gracefully.
 *
 * Endpoints consumed:
 *   GET  /api/info              → EnclaveInfo struct
 *   GET  /api/logs              → { logs: string[] }
 *   POST /api/simulate-price    → { priceUsd: number }
 *   POST /api/direct            → trigger registration
 */

const BASE = '/api';   // Vite proxies this to http://localhost:6662
const TIMEOUT_MS = 2000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    // Keeper offline or timed out — surface as { online: false }
    return { online: false, error: err.message };
  }
}

/** GET /info — returns live enclave status from the Go keeper */
export async function fetchKeeperInfo() {
  const data = await fetchWithTimeout(`${BASE}/info`);
  if (data.online === false) return data;
  return { online: true, ...data };
}

/** GET /logs — returns recent execution log entries from the Go keeper */
export async function fetchKeeperLogs() {
  const data = await fetchWithTimeout(`${BASE}/logs`);
  if (data.online === false) return { online: false, logs: [] };
  return { online: true, logs: data.logs || [] };
}

/**
 * POST /simulate-price — sends a price override to the Go keeper.
 * This makes the keeper's own health-factor loop evaluate the new price
 * and fire if threshold is breached — the real backend trigger path.
 */
export async function simulatePriceOnKeeper(priceUsd) {
  return fetchWithTimeout(`${BASE}/simulate-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceUsd }),
  });
}

/**
 * POST /direct — registers a private trigger in the Go keeper enclave.
 * Called when the user clicks "Register in TEE" after setting position params.
 */
export async function registerTriggerOnKeeper({ borrower, positionContract, vaultContract, thresholdHf, repayUsd }) {
  return fetchWithTimeout(`${BASE}/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      opType: '0x00000001',
      opCommand: '0x00000001',
      payload: {
        borrower:         borrower || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        positionContract: positionContract || '',
        vaultContract:    vaultContract    || '',
        thresholdHf:      thresholdHf,
        repayUsd:         repayUsd,
      },
    }),
  });
}
