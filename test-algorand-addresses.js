const algosdk = require('algosdk');

console.log('Testing with proper Algorand addresses...');

// Generate valid Algorand addresses for testing
const account1 = algosdk.generateAccount();
const account2 = algosdk.generateAccount();
const account3 = algosdk.generateAccount();

console.log('Generated valid addresses:');
console.log('- Address 1:', account1.addr);
console.log('- Address 2:', account2.addr);
console.log('- Address 3:', account3.addr);

// Verify addresses are valid
try {
  algosdk.decodeAddress(account1.addr);
  algosdk.decodeAddress(account2.addr);
  algosdk.decodeAddress(account3.addr);
  console.log('✓ All addresses are valid');
} catch (e) {
  console.error('✗ Address validation failed:', e.message);
  process.exit(1);
}

// Test transaction creation with valid addresses
const testParams = {
  from: account1.addr,
  suggestedParams: {
    fee: 1000,
    firstRound: 1000,
    lastRound: 2000,
    genesisHash: new Uint8Array(32).fill(1), // Fill with non-zero values
    genesisID: 'testnet-v1.0',
    minFee: 1000
  },
  defaultFrozen: false,
  unitName: 'TEST',
  assetName: 'Test Token',
  manager: account2.addr,
  reserve: account3.addr,
  total: 1000000,
  decimals: 6
};

console.log('\nTesting transaction creation with valid addresses...');
try {
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(testParams);
  console.log('✓ SUCCESS! Transaction created successfully');
  console.log('Transaction type:', txn.type);
  console.log('From address:', txn.from.toString());
  console.log('Manager address:', txn.assetParams.manager?.toString() || 'undefined');
  console.log('Reserve address:', txn.assetParams.reserve?.toString() || 'undefined');
  console.log('Freeze address:', txn.assetParams.freeze?.toString() || 'undefined');
  console.log('Clawback address:', txn.assetParams.clawback?.toString() || 'undefined');
} catch (error) {
  console.error('✗ Transaction creation failed:', error.message);
  console.error('Error type:', error.constructor.name);
  console.error('Stack trace:', error.stack);
}

// Test with pausable token (includes freeze address)
console.log('\nTesting pausable token creation...');
const pausableParams = {
  ...testParams,
  freeze: account1.addr  // Add freeze address for pausable token
};

try {
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(pausableParams);
  console.log('✓ SUCCESS! Pausable transaction created successfully');
  console.log('Transaction type:', txn.type);
  console.log('From address:', txn.from.toString());
  console.log('Manager address:', txn.assetParams.manager?.toString() || 'undefined');
  console.log('Reserve address:', txn.assetParams.reserve?.toString() || 'undefined');
  console.log('Freeze address:', txn.assetParams.freeze?.toString() || 'undefined');
  console.log('Clawback address:', txn.assetParams.clawback?.toString() || 'undefined');
} catch (error) {
  console.error('✗ Pausable transaction creation failed:', error.message);
  console.error('Error type:', error.constructor.name);
  console.error('Stack trace:', error.stack);
}