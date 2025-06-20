const algosdk = require('algosdk');

console.log('algosdk version check:', algosdk.ALGORAND_MIN_TX_FEE);
console.log('Testing basic algosdk functionality...');

try {
  const account = algosdk.generateAccount();
  console.log('✓ Generated account successfully');
  console.log('Account address:', account.addr);
  console.log('Account type:', typeof account.addr);
  
  const encoded = algosdk.encodeAddress(account.addr.publicKey);
  console.log('✓ Encoded address:', encoded);
  
  const decoded = algosdk.decodeAddress(encoded);
  console.log('✓ Decoded address successfully');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  console.error('Stack:', error.stack);
}
