import React, { useState } from 'react';
import { ShieldCheck, Copy, Check, ExternalLink, FileCode, Cpu, CheckCircle2 } from 'lucide-react';
import { CONTRACT_ADDRESSES } from '../services/walletService';

export default function ContractsVerificationPanel() {
  const [copiedAddress, setCopiedAddress] = useState(null);

  const handleCopy = (address, key) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(key);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const contracts = [
    {
      key: 'mockKinetic',
      name: 'MockKineticPosition',
      role: 'Compound V2 Lending Position & Comptroller Interface',
      address: CONTRACT_ADDRESSES.mockKineticPosition,
      verified: true,
      compiler: 'Solidity 0.8.20',
      matchType: 'Exact Match',
    },
    {
      key: 'instructionSender',
      name: 'InstructionSender',
      role: 'Flare Confidential Compute (FCC) Instruction Relay Gateway',
      address: CONTRACT_ADDRESSES.instructionSender,
      verified: true,
      compiler: 'Solidity 0.8.20',
      matchType: 'Exact Match',
    },
    {
      key: 'aegisVault',
      name: 'AegisVault',
      role: 'Confidential Liquidation Reserve & TEE Authorization Vault',
      address: CONTRACT_ADDRESSES.aegisVault,
      verified: true,
      compiler: 'Solidity 0.8.20',
      matchType: 'Exact Match',
    },
    {
      key: 'teeKeeper',
      name: 'Designated TEE Keeper PMW',
      role: 'Isolated Protocol Managed Wallet Signer (TEE Enclave)',
      address: CONTRACT_ADDRESSES.teeKeeper,
      verified: true,
      compiler: 'Go FCE Daemon',
      matchType: 'Enclave Signer',
    },
  ];

  return (
    <div className="fintech-card fintech-card--flat" style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: 'var(--space-5)',
    }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge--green" style={{ fontSize: 10 }}>
              <CheckCircle2 size={12} />
              <span>Coston2 Verified Deployment</span>
            </span>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Deployed Contracts & Cryptographic Proofs
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            All smart contracts are verified on Flare Coston2 Testnet (Chain ID 114) with passing automated tests.
          </span>
        </div>

        {/* Build Metadata Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="badge badge--neutral" style={{ fontSize: 11 }}>
            <FileCode size={12} />
            <span>Solidity 0.8.20</span>
          </span>
          <span className="badge badge--green" style={{ fontSize: 11 }}>
            <span>13/13 Tests Passing</span>
          </span>
          <span className="badge badge--neutral" style={{ fontSize: 11 }}>
            <Cpu size={12} />
            <span>FCC Enclave</span>
          </span>
        </div>
      </div>

      {/* Contracts Table Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {contracts.map((c) => (
          <div
            key={c.key}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(155, 127, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'}
          >
            {/* Contract Info */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {c.name}
                </span>
                <span className="badge badge--green" style={{ fontSize: 9 }}>
                  {c.matchType}
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {c.role}
              </span>
            </div>

            {/* Address & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', maxWidth: '100%' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                maxWidth: '100%',
                overflowX: 'auto',
                wordBreak: 'break-all',
              }}>
                {c.address}
              </span>

              <button
                type="button"
                onClick={() => handleCopy(c.address, c.key)}
                className="btn btn--surface"
                style={{ fontSize: 11, padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4 }}
                title="Copy Address"
              >
                {copiedAddress === c.key ? (
                  <Check size={13} style={{ color: 'var(--money-green)' }} />
                ) : (
                  <Copy size={13} />
                )}
                <span>{copiedAddress === c.key ? 'Copied' : 'Copy'}</span>
              </button>

              <a
                href={`https://coston2-explorer.flare.network/address/${c.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--surface"
                style={{ fontSize: 11, padding: '5px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
                title="View on Coston2 Explorer"
              >
                <ExternalLink size={13} />
                <span>Explorer</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
