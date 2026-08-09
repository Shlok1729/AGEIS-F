import React from 'react';
import { playClickSound } from '../services/audioService';

export const ASSET_PROFILES = {
  FLR: {
    symbol: 'FLR',
    name: 'Flare Native',
    pair: 'FLR/USD',
    feedId: '0x01464c522f55534400000000000000000000000000',
    basePrice: 0.035,
    defaultCollateral: 1000,
    defaultDebt: 20,
    collateralFactor: 0.85,
    decimals: 5,
    unit: 'FLR',
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    pair: 'BTC/USD',
    feedId: '0x014254432f55534400000000000000000000000000',
    basePrice: 108420.0,
    defaultCollateral: 0.5,
    defaultDebt: 35000,
    collateralFactor: 0.80,
    decimals: 2,
    unit: 'BTC',
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    pair: 'ETH/USD',
    feedId: '0x014554482f55534400000000000000000000000000',
    basePrice: 3280.0,
    defaultCollateral: 10,
    defaultDebt: 20000,
    collateralFactor: 0.82,
    decimals: 2,
    unit: 'ETH',
  },
  XRP: {
    symbol: 'XRP',
    name: 'Ripple XRP',
    pair: 'XRP/USD',
    feedId: '0x015852502f55534400000000000000000000000000',
    basePrice: 2.25,
    defaultCollateral: 10000,
    defaultDebt: 12000,
    collateralFactor: 0.75,
    decimals: 4,
    unit: 'XRP',
  },
};

export default function AssetSelector({ selectedAsset = 'FLR', onSelectAsset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginRight: 4 }}>
        FTSOv2 Feed:
      </span>
      {Object.keys(ASSET_PROFILES).map((key) => {
        const asset = ASSET_PROFILES[key];
        const isSelected = selectedAsset === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              playClickSound();
              onSelectAsset(key, asset);
            }}
            style={{
              background: isSelected ? 'rgba(155, 127, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${isSelected ? 'var(--tech-purple)' : 'rgba(255, 255, 255, 0.06)'}`,
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'var(--tech-purple)' : 'var(--text-primary)' }}>
              {asset.symbol}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              ${asset.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: asset.decimals })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
