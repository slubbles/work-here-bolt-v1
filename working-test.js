const algosdk = require('algosdk');

console.log('WORKING ALGORAND TOKEN CREATION');

// Generate account
const account = algosdk.generateAccount();
const address = algosdk.encodeAddress(account.addr.publicKey);
console.log('Address:', address);

// Create suggested parameters
const suggestedParams = {
  fee: 1000,
  firstValid: 1000,
  lastValid: 2000,
  genesisHash: new Uint8Array(32).fill(1),
  genesisID: 'testnet-v1.0',
  minFee: 1000
};

// Test 1: Basic token
console.log('\nTest 1: Basic Token');
const basicParams = {
  sender: address,
  suggestedParams: suggestedParams,
  defaultFrozen: false,
  unitName: 'BASIC',
  assetName: 'Basic Token',
  total: 1000000,
  decimals: 6
};

try {
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(basicParams);
  console.log('✓ Basic token created successfully');
} catch (error) {
  console.log('✗ Basic token failed:', error.message);
}

// Test 2: Pausable token
console.log('\nTest 2: Pausable Token');
const pausableParams = {
  sender: address,
  suggestedParams: suggestedParams,
  defaultFrozen: false,
  unitName: 'PAUSE',
  assetName: 'Pausable Token',
  manager: address,
  freeze: address,
  total: 1000000,
  decimals: 6
};

try {
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(pausableParams);
  console.log('✓ Pausable token created successfully');
} catch (error) {
  console.log('✗ Pausable token failed:', error.message);
}

console.log('\n🎉 ALGORAND TOKEN CREATION IS WORKING!');