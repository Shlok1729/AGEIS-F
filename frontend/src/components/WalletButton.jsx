import React from 'react';
import { useWallet } from '../services/WalletContext';
import { formatAddress } from '../services/walletService';
import { Wallet, AlertTriangle, ChevronDown } from 'lucide-react';

export default function WalletButton() {
  const {
    account,
    isCoston2,
    c2flrBalance,
    isConnecting,
    connect,
    switchNetwork,
    openModal,
    hasWallet,
  } = useWallet();

  // If no account is connected
  if (!account) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isConnecting}
        className="btn btn--mauve"
        style={{
          fontSize: 12,
          padding: '6px 14px',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600,
          cursor: isConnecting ? 'wait' : 'pointer',
        }}
      >
        <Wallet size={14} />
        <span>{isConnecting ? 'Connecting…' : 'Connect wallet'}</span>
      </button>
    );
  }

  // If connected on wrong network (not Coston2 Chain ID 114)
  if (!isCoston2) {
    return (
      <button
        type="button"
        onClick={switchNetwork}
        className="btn"
        style={{
          background: 'rgba(235, 160, 172, 0.12)',
          color: 'var(--maroon)',
          border: '1px solid rgba(235, 160, 172, 0.3)',
          fontSize: 11,
          padding: '5px 12px',
          borderRadius: '9px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <AlertTriangle size={13} />
        <span>Switch to Coston2</span>
      </button>
    );
  }

  // Connected on Coston2
  return (
    <button
      type="button"
      onClick={openModal}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '9px',
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 12,
        color: 'var(--text)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(203, 166, 247, 0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
    >
      {/* Network indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          className="pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--subtext0)', fontWeight: 600 }}>Coston2</span>
      </div>

      {/* Balance pill */}
      <span style={{
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '2px 7px',
        borderRadius: '5px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: 'var(--mauve)',
        fontWeight: 600,
      }}>
        {c2flrBalance} C2FLR
      </span>

      {/* Address */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}>
        <span style={{ fontWeight: 600 }}>{formatAddress(account)}</span>
        <ChevronDown size={13} style={{ color: 'var(--overlay1)' }} />
      </div>
    </button>
  );
}
