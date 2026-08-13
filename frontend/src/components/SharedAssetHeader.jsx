import React from 'react';
import AssetSelector from './AssetSelector';

export default function SharedAssetHeader({ selectedAsset, onSelectAsset }) {
  return (
    <div 
      className="fintech-card fintech-card--flat" 
      style={{ 
        padding: '12px var(--space-4)', 
        marginBottom: 'var(--space-4)',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <AssetSelector
        selectedAsset={selectedAsset}
        onSelectAsset={onSelectAsset}
      />
    </div>
  );
}
