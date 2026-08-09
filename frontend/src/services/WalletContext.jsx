import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  hasInjectedWallet,
  connectWallet,
  switchToCoston2,
  fetchC2FlrBalance,
  fetchVaultReserve,
  depositToAegisVault,
  signTriggerPayload,
  COSTON2_CHAIN_ID_DECIMAL,
  getBrowserProvider,
} from './walletService';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount]           = useState(null);
  const [chainId, setChainId]           = useState(null);
  const [isCoston2, setIsCoston2]       = useState(false);
  const [c2flrBalance, setC2flrBalance] = useState('0.0000');
  const [vaultReserve, setVaultReserve] = useState('0.0000');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [error, setError]               = useState(null);

  // Refresh balances whenever account or network changes
  const refreshBalances = useCallback(async (targetAccount = account) => {
    if (!targetAccount) {
      setC2flrBalance('0.0000');
      setVaultReserve('0.0000');
      return;
    }
    try {
      const [bal, reserve] = await Promise.all([
        fetchC2FlrBalance(targetAccount),
        fetchVaultReserve(targetAccount),
      ]);
      setC2flrBalance(bal);
      setVaultReserve(reserve);
    } catch (err) {
      console.warn('Failed to refresh balances:', err);
    }
  }, [account]);

  // Connect wallet action
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const result = await connectWallet();
      setAccount(result.address);
      setChainId(result.chainId);
      setIsCoston2(result.isCoston2);
      await refreshBalances(result.address);
      localStorage.setItem('aegis_wallet_connected', 'true');
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [refreshBalances]);

  // Disconnect wallet action
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setIsCoston2(false);
    setC2flrBalance('0.0000');
    setVaultReserve('0.0000');
    setIsModalOpen(false);
    localStorage.removeItem('aegis_wallet_connected');
  }, []);

  // Switch to Coston2 action
  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      await switchToCoston2();
      setIsCoston2(true);
      setChainId(COSTON2_CHAIN_ID_DECIMAL);
      if (account) {
        await refreshBalances(account);
      }
    } catch (err) {
      setError(err.message || 'Failed to switch network');
      throw err;
    }
  }, [account, refreshBalances]);

  // Deposit reserve to AegisVault
  const depositReserve = useCallback(async (amountC2Flr) => {
    setIsDepositing(true);
    setError(null);
    try {
      const tx = await depositToAegisVault(amountC2Flr);
      await refreshBalances(account);
      return tx;
    } catch (err) {
      setError(err.message || 'Deposit failed');
      throw err;
    } finally {
      setIsDepositing(false);
    }
  }, [account, refreshBalances]);

  // Sign TEE trigger payload with EIP-191
  const signTrigger = useCallback(async (payload) => {
    return signTriggerPayload(account, payload);
  }, [account]);

  // Auto-reconnect if user previously connected in this session
  useEffect(() => {
    if (!hasInjectedWallet()) return;
    const wasConnected = localStorage.getItem('aegis_wallet_connected');
    if (!wasConnected) return;

    const provider = getBrowserProvider();
    if (!provider) return;

    provider.send('eth_accounts', [])
      .then(async (accounts) => {
        if (accounts && accounts.length > 0) {
          const network = await provider.getNetwork();
          const curChainId = Number(network.chainId);
          setAccount(accounts[0]);
          setChainId(curChainId);
          setIsCoston2(curChainId === COSTON2_CHAIN_ID_DECIMAL);
          await refreshBalances(accounts[0]);
        }
      })
      .catch(console.warn);
  }, [refreshBalances]);

  // Listen to account and chain change events on window.ethereum
  useEffect(() => {
    if (!hasInjectedWallet()) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        refreshBalances(accounts[0]);
      }
    };

    const handleChainChanged = (newChainIdHex) => {
      const newChainId = parseInt(newChainIdHex, 16);
      setChainId(newChainId);
      setIsCoston2(newChainId === COSTON2_CHAIN_ID_DECIMAL);
      if (account) refreshBalances(account);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, disconnect, refreshBalances]);

  const value = {
    account,
    chainId,
    isCoston2,
    c2flrBalance,
    vaultReserve,
    isConnecting,
    isDepositing,
    isModalOpen,
    error,
    hasWallet: hasInjectedWallet(),
    connect,
    disconnect,
    switchNetwork,
    refreshBalances,
    depositReserve,
    signTrigger,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
