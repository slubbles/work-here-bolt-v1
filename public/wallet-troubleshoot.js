// Wallet Connection Troubleshooting Script
// You can run this in your browser's developer console if you continue to have issues

function clearWalletCache() {
  try {
    // Clear wallet-related localStorage items
    const keys = Object.keys(localStorage);
    const walletKeys = keys.filter(key => 
      key.includes('wallet') || 
      key.includes('pera') || 
      key.includes('algorand') || 
      key.includes('phantom') ||
      key.includes('solflare') ||
      key.includes('walletconnect')
    );
    
    console.log('🔧 Clearing wallet cache...');
    console.log('Found wallet keys:', walletKeys);
    
    walletKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Cleared: ${key}`);
    });
    
    // Clear any network banner dismissals
    const networkKeys = keys.filter(key => key.includes('network-banner-dismissed'));
    networkKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Cleared network banner: ${key}`);
    });
    
    console.log('✅ Wallet cache cleared successfully!');
    console.log('🔄 Please refresh the page to reconnect your wallet.');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing wallet cache:', error);
    return false;
  }
}

function checkWalletConflicts() {
  console.log('🔍 Checking for wallet conflicts...');
  
  // Check for multiple wallet providers
  const providers = {
    ethereum: !!window.ethereum,
    solana: !!window.solana,
    phantom: !!(window.solana && window.solana.isPhantom),
    pera: !!window.PeraWalletConnect,
    algorand: !!window.algorand
  };
  
  console.log('📱 Detected providers:', providers);
  
  // Check for ethereum property conflicts
  if (window.ethereum && window.ethereum.providers) {
    console.log('🔗 Multiple ethereum providers detected:', window.ethereum.providers.length);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (providers.ethereum && providers.phantom) {
    console.log('⚠️ Both Ethereum and Phantom detected - may cause conflicts');
  }
  
  if (Object.values(providers).filter(Boolean).length > 2) {
    console.log('⚠️ Multiple wallet providers detected - consider disabling unused extensions');
  }
  
  return providers;
}

function resetToMainnet() {
  console.log('🌐 Setting platform to Algorand Mainnet...');
  
  // Clear any network preferences
  localStorage.removeItem('selectedNetwork');
  localStorage.removeItem('algorand-network');
  
  // Set to mainnet
  localStorage.setItem('preferred-network', 'algorand-mainnet');
  
  console.log('✅ Platform set to Algorand Mainnet');
  console.log('🔄 Please refresh the page');
}

// Auto-run basic checks
console.log('🚀 Snarbles Wallet Troubleshooting Tool');
console.log('=====================================\n');

checkWalletConflicts();

console.log('\n🛠️ Available commands:');
console.log('• clearWalletCache() - Clear all wallet-related cache');
console.log('• checkWalletConflicts() - Check for wallet provider conflicts');  
console.log('• resetToMainnet() - Force platform to use Algorand Mainnet');

// Make functions globally available
window.clearWalletCache = clearWalletCache;
window.checkWalletConflicts = checkWalletConflicts;
window.resetToMainnet = resetToMainnet;
