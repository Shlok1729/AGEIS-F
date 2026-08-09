import { ethers } from 'ethers';

// ─── Flare Coston2 Testnet Configuration ─────────────────────────────────────
export const COSTON2_CHAIN_ID_DECIMAL = 114;
export const COSTON2_CHAIN_ID_HEX = '0x72';

export const COSTON2_CONFIG = {
  chainId: COSTON2_CHAIN_ID_HEX,
  chainName: 'Flare Coston2 Testnet',
  nativeCurrency: {
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
    decimals: 18,
  },
  rpcUrls: ['https://coston2-api.flare.network/ext/C/rpc'],
  blockExplorerUrls: ['https://coston2-explorer.flare.network'],
};

export const CONTRACT_ADDRESSES = {
  aegisVault: '0x52C0C06382bCF4f08689c74c47F4D5BFf36F4d6e',
  mockKineticPosition: '0x6376892136f7c85E09c0e36100ffA6b484B3AC8c',
  instructionSender: '0x416dbc9ABC289b58701e8543e6C54a3a7634BB3c',
  teeKeeper: '0xB45f8a4946cD15bb6f208BF3372934b5946a1B38',
};

export const AEGIS_VAULT_ABI = [
  'function depositReserve() external payable',
  'function withdrawReserve(uint256 amount) external',
  'function userReserves(address user) external view returns (uint256)',
  'function paused() external view returns (bool)',
  'function teeKeeper() external view returns (address)',
  'event ReserveDeposited(address indexed user, uint256 amount)',
  'event ReserveWithdrawn(address indexed user, uint256 amount)',
  'event ProtectionTriggered(address indexed borrower, address indexed positionContract, uint256 repayAmount, address indexed keeper, uint256 remainingReserve)',
];

export const MOCK_POSITION_ABI = [
  'function collateralAmount() external view returns (uint256)',
  'function debtAmount() external view returns (uint256)',
  'function getHealthFactor() external view returns (uint256)',
  'function isLiquidatable() external view returns (bool)',
  'function borrower() external view returns (address)',
];

// Fallback JSON-RPC provider (for read-only queries even when disconnected)
export function getReadRpcProvider() {
  return new ethers.JsonRpcProvider(COSTON2_CONFIG.rpcUrls[0]);
}

/** Check if MetaMask or any EIP-1193 provider is injected */
export function hasInjectedWallet() {
  return typeof window !== 'undefined' && Boolean(window.ethereum);
}

/** Get BrowserProvider from window.ethereum */
export function getBrowserProvider() {
  if (!hasInjectedWallet()) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

/** Format address for UI (e.g. 0x7099...79c8) */
export function formatAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Switch or add Flare Coston2 Testnet network to wallet */
export async function switchToCoston2() {
  if (!hasInjectedWallet()) {
    throw new Error('No EVM wallet detected. Please install MetaMask or Core.');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: COSTON2_CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError) {
    // 4902 error code indicates the chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [COSTON2_CONFIG],
        });
        return true;
      } catch (addError) {
        throw new Error(`Failed to add Coston2 network: ${addError.message}`);
      }
    }
    throw switchError;
  }
}

/** Request connection to wallet */
export async function connectWallet() {
  if (!hasInjectedWallet()) {
    throw new Error('No EVM wallet detected. Please install MetaMask or Core.');
  }

  const provider = getBrowserProvider();
  const accounts = await provider.send('eth_requestAccounts', []);
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts selected');
  }

  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);
  const isCoston2 = currentChainId === COSTON2_CHAIN_ID_DECIMAL;

  return {
    address: accounts[0],
    chainId: currentChainId,
    isCoston2,
  };
}

/** Fetch live C2FLR balance of an address */
export async function fetchC2FlrBalance(address) {
  try {
    if (!address) return '0.0000';
    const provider = hasInjectedWallet() ? getBrowserProvider() : getReadRpcProvider();
    const balanceWei = await provider.getBalance(address);
    const flr = ethers.formatEther(balanceWei);
    return (+flr).toFixed(4);
  } catch (err) {
    console.warn('Failed to fetch C2FLR balance:', err);
    return '0.0000';
  }
}

/** Fetch live deposited reserve in AegisVault */
export async function fetchVaultReserve(address) {
  try {
    if (!address) return '0.0000';
    const provider = hasInjectedWallet() ? getBrowserProvider() : getReadRpcProvider();
    const vault = new ethers.Contract(CONTRACT_ADDRESSES.aegisVault, AEGIS_VAULT_ABI, provider);
    const reserveWei = await vault.userReserves(address);
    const flr = ethers.formatEther(reserveWei);
    return (+flr).toFixed(4);
  } catch (err) {
    console.warn('Failed to fetch AegisVault reserve:', err);
    return '0.0000';
  }
}

/** Deposit C2FLR into AegisVault reserve */
export async function depositToAegisVault(amountC2Flr) {
  if (!hasInjectedWallet()) {
    throw new Error('No wallet connected.');
  }

  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  const vault = new ethers.Contract(CONTRACT_ADDRESSES.aegisVault, AEGIS_VAULT_ABI, signer);

  const valueWei = ethers.parseEther(amountC2Flr.toString());
  const tx = await vault.depositReserve({ value: valueWei });
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/**
 * Sign confidential trigger authorization payload using EIP-191 personal_sign
 */
export async function signTriggerPayload(borrower, { thresholdHf, repayUsd, vaultAddress }) {
  if (!hasInjectedWallet()) {
    return {
      signature: '0x' + Array.from({ length: 130 }, () => 'f').join(''),
      timestamp: new Date().toISOString(),
      message: 'Demo Simulation Mode (No wallet)',
    };
  }

  const provider = getBrowserProvider();
  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  const timestamp = new Date().toISOString();
  const targetVault = vaultAddress || CONTRACT_ADDRESSES.aegisVault;

  const message = [
    `🛡️ Aegis-F Confidential TEE Trigger Registration`,
    `------------------------------------------------`,
    `Borrower: ${signerAddress}`,
    `Vault Contract: ${targetVault}`,
    `Threshold Health Factor: ${Number(thresholdHf).toFixed(2)}`,
    `Max Auto-Repay Reserve: $${Number(repayUsd).toFixed(2)} USD`,
    `Target Safe Buffer: 1.30 HF`,
    `Network: Flare Coston2 Testnet (Chain ID 114)`,
    `Timestamp: ${timestamp}`,
    `------------------------------------------------`,
    `Notice: This signature authorizes the hardware-isolated TEE Keeper`,
    `to execute dynamic debt repayments from your vault reserve.`,
  ].join('\n');

  const signature = await signer.signMessage(message);

  return {
    signature,
    signer: signerAddress,
    timestamp,
    message,
  };
}
