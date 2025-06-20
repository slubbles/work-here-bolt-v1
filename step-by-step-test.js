const algosdk = require('algosdk');

console.log('Testing asset creation step by step...');

try {
  // Step 1: Generate account
  const account = algosdk.generateAccount();
  const address = algosdk.encodeAddress(account.addr.publicKey);
  console.log('✓ Step 1: Generated account:', address);
  
  // Step 2: Create suggested parameters
  const suggestedParams = {
    fee: 1000,
    firstValid: 1000,  // Fix: use 'firstValid' not 'firstRound'
    lastValid: 2000,   // Fix: use 'lastValid' not 'lastRound'
    genesisHash: new Uint8Array(32).fill(1),
    genesisID: 'testnet-v1.0',
    minFee: 1000
  };
  console.log('✓ Step 2: Created suggested params');
  
  // Step 3: Create asset parameters (minimal)
  const assetParams = {
    sender: address,  // Fix: use 'sender' not 'from'
    suggestedParams: suggestedParams,
    defaultFrozen: false,
    unitName: 'TEST',
    assetName: 'Test Token',
    manager: address,
    reserve: address,
    total: 1000000,
    decimals: 6
  };
  console.log('✓ Step 3: Created asset params');
  console.log('Asset params types:', {
    sender: typeof assetParams.sender,  // Fix: use 'sender' not 'from'
    manager: typeof assetParams.manager,
    reserve: typeof assetParams.reserve,
    total: typeof assetParams.total,
    decimals: typeof assetParams.decimals
  });
  
  // Step 4: Create transaction
  console.log('Attempting to create transaction...');
  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(assetParams);
  console.log('✓ Step 4: SUCCESS! Transaction created');
  console.log('Transaction details:');
  console.log('- Type:', txn.type);
  console.log('- Sender:', txn.sender ? txn.sender.toString() : 'null');
  console.log('- Manager:', txn.assetParams && txn.assetParams.manager ? txn.assetParams.manager.toString() : 'null');
  console.log('- Reserve:', txn.assetParams && txn.assetParams.reserve ? txn.assetParams.reserve.toString() : 'null');
  console.log('- Freeze:', txn.assetParams && txn.assetParams.freeze ? txn.assetParams.freeze.toString() : 'null');
  console.log('- Clawback:', txn.assetParams && txn.assetParams.clawback ? txn.assetParams.clawback.toString() : 'null');
  
} catch (error) {
  console.error('✗ Error occurred:', error.message);
  console.error('Error name:', error.name);
  console.error('Error constructor:', error.constructor.name);
  console.error('Stack trace:', error.stack);
}
