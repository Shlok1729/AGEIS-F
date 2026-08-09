import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../services/WalletContext';
import { formatAddress, CONTRACT_ADDRESSES } from '../services/walletService';
import { X, Copy, Check, ExternalLink, ShieldCheck, ArrowUpRight, Droplet, LogOut } from 'lucide-react';

export default function WalletModal() {
  const {
    account,
    isCoston2,
    c2flrBalance,
    vaultReserve,
    isModalOpen,
    closeModal,
    disconnect,
    depositReserve,
    isDepositing,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [depositAmount, setDepositAmount] = useState('10');
  const [txSuccessHash, setTxSuccessHash] = useState(null);
  const [depositError, setDepositError] = useState(null);

  if (!isModalOpen || !account) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositError(null);
    setTxSuccessHash(null);

    const val = parseFloat(depositAmount);
    if (!val || val <= 0) {
      setDepositError('Please enter a valid amount greater than 0.');
      return;
    }

    try {
      const res = await depositReserve(val);
      setTxSuccessHash(res.txHash);
    } catch (err) {
      setDepositError(err.message || 'Deposit transaction failed');
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
        }}
        onClick={closeModal}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--mantle)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
            color: 'var(--text)',
            position: 'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className="pulse"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isCoston2 ? 'var(--green)' : 'var(--red)',
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {isCoston2 ? 'Flare Coston2 Account' : 'Unsupported Network'}
              </span>
            </div>
            <button
              type="button"
              onClick={closeModal}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--overlay1)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Address Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>
              {formatAddress(account)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn--surface"
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Copy address"
              >
                {copied ? <Check size={12} style={{ color: 'var(--green)' }} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={`https://coston2-explorer.flare.network/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--surface"
                style={{ fontSize: 11, padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                title="View on Coston2 Explorer"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Balances Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--overlay1)', display: 'block', marginBottom: 4 }}>
                Wallet Balance
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {c2flrBalance}
              </span>
              <span style={{ fontSize: 11, color: 'var(--mauve)', marginLeft: 4, fontWeight: 600 }}>C2FLR</span>
            </div>

            <div style={{
              background: 'rgba(203, 166, 247, 0.04)',
              border: '1px solid rgba(203, 166, 247, 0.15)',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--mauve)', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                AegisVault Reserve
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                {vaultReserve}
              </span>
              <span style={{ fontSize: 11, color: 'var(--mauve)', marginLeft: 4, fontWeight: 600 }}>C2FLR</span>
            </div>
          </div>

          {/* Deposit into Vault Form */}
          <form onSubmit={handleDeposit} style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                Deposit Repayment Reserve
              </span>
              <span style={{ fontSize: 10, color: 'var(--overlay1)' }}>
                Contract: {formatAddress(CONTRACT_ADDRESSES.aegisVault)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                min="0.1"
                step="any"
                placeholder="Amount in C2FLR"
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: 'var(--text)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isDepositing || !isCoston2}
                className="btn btn--mauve"
                style={{
                  fontSize: 12,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: isDepositing ? 'wait' : 'pointer',
                }}
              >
                <span>{isDepositing ? 'Depositing…' : 'Deposit'}</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {depositError && (
              <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 6, lineHeight: 1.4 }}>
                {depositError}
              </div>
            )}

            {txSuccessHash && (
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Deposit confirmed!</span>
                <a
                  href={`https://coston2-explorer.flare.network/tx/${txSuccessHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--green)', textDecoration: 'underline', fontFamily: 'var(--font-mono)' }}
                >
                  {formatAddress(txSuccessHash)}
                </a>
              </div>
            )}
          </form>

          {/* Quick Faucet link & Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <a
              href="https://faucet.flare.network/coston2"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: 'var(--sapphire)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <Droplet size={12} />
              <span>Get Free Coston2 Faucet C2FLR</span>
            </a>

            <button
              type="button"
              onClick={disconnect}
              className="btn btn--surface"
              style={{
                fontSize: 11,
                padding: '5px 12px',
                borderRadius: '8px',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <LogOut size={12} />
              <span>Disconnect</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
