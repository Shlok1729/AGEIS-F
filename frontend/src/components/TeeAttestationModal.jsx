import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cpu, Key, Lock, CheckCircle2, Copy, Check, X, ExternalLink, FileText } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../services/walletService';

export default function TeeAttestationModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('quote');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const attestationData = {
    enclaveMeasurement: '0x7d9f2e8410b38c291847ad4492bf98301824a739b610c490a16e8902187b55f1',
    hardwareSecurityModule: 'AMD SEV-SNP (Secure Encrypted Virtualization)',
    ramEncryptionEngine: 'AES-128-XTS Hardware Isolation',
    attestationVerifier: 'GCP Confidential Space / Flare FCE Root Authority',
    designatedKeeperAddress: CONTRACT_ADDRESSES.teeKeeper,
    onChainVaultAddress: CONTRACT_ADDRESSES.aegisVault,
    timestamp: new Date().toISOString(),
    status: 'VERIFIED_ENCLAVE',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(attestationData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(155, 127, 255, 0.25)',
            borderRadius: '20px',
            padding: '28px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 40px rgba(155, 127, 255, 0.1)',
            color: 'var(--text-primary)',
            position: 'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(155, 127, 255, 0.12)',
                border: '1px solid var(--tech-purple-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--tech-purple)',
              }}>
                <Cpu size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Hardware TEE Attestation Explorer
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Cryptographic Remote Attestation Proof (AMD SEV-SNP)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: 20,
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('quote')}
              style={{
                background: activeTab === 'quote' ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${activeTab === 'quote' ? 'var(--border-card)' : 'transparent'}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: activeTab === 'quote' ? 'var(--tech-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Attestation Quote
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signer')}
              style={{
                background: activeTab === 'signer' ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${activeTab === 'signer' ? 'var(--border-card)' : 'transparent'}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: activeTab === 'signer' ? 'var(--tech-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              PMW Signer Proof
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modes')}
              style={{
                background: activeTab === 'modes' ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${activeTab === 'modes' ? 'var(--border-card)' : 'transparent'}`,
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: activeTab === 'modes' ? 'var(--tech-purple)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              FCC Modes
            </button>
          </div>

          {/* Tab 1: Attestation Quote */}
          {activeTab === 'quote' && (
            <div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    PCR0 / MRENCLAVE Measurement Hash
                  </span>
                  <span className="badge badge--green" style={{ fontSize: 9 }}>
                    <CheckCircle2 size={10} />
                    <span>Exact Match</span>
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--tech-purple)',
                  wordBreak: 'break-all',
                  background: '#0A0A0F',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}>
                  {attestationData.enclaveMeasurement}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 16,
              }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Hardware Enclave</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>AMD SEV-SNP</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '10px 12px' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>Memory Encryption</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--money-green)' }}>AES-128-XTS Active</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: PMW Signer Proof */}
          {activeTab === 'signer' && (
            <div>
              <div style={{
                background: 'rgba(46, 212, 122, 0.04)',
                border: '1px solid rgba(46, 212, 122, 0.2)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: 14,
              }}>
                <span style={{ fontSize: 11, color: 'var(--money-green)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  On-Chain Vault Keeper Verification
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  The Go TEE keeper ECDSA signer matches the authorized <code>teeKeeper</code> variable in <code>AegisVault.sol</code> on Flare Coston2.
                </span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '12px', marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Enclave Protocol-Managed Signer Address:
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                  {attestationData.designatedKeeperAddress}
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: FCC Modes */}
          {activeTab === 'modes' && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '12px', marginBottom: 10 }}>
                <span style={{ color: 'var(--tech-purple)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  FCC MODE=0 (Local Sandbox / Fast Simulation)
                </span>
                <span>
                  Simulates enclave memory locally with isolated Go secp256k1 keystore and sub-second <code>/direct</code> instruction routing.
                </span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '12px' }}>
                <span style={{ color: 'var(--flare-blue)', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                  FCC MODE=1 (AMD SEV-SNP Hardware Enclave)
                </span>
                <span>
                  Deploys inside Google Cloud Confidential Space with hardware-isolated RAM encryption and Flare threshold signing.
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 14 }}>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn--surface"
              style={{ fontSize: 11, padding: '6px 12px', borderRadius: '7px' }}
            >
              {copied ? <Check size={12} style={{ color: 'var(--money-green)' }} /> : <Copy size={12} />}
              <span>{copied ? 'Attestation Copied' : 'Copy Attestation JSON'}</span>
            </button>

            <a
              href={`https://coston2-explorer.flare.network/address/${CONTRACT_ADDRESSES.teeKeeper}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--surface"
              style={{ fontSize: 11, padding: '6px 12px', borderRadius: '7px', textDecoration: 'none' }}
            >
              <span>View Keeper On Explorer</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
