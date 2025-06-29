Here's the fixed version with all missing closing brackets and braces added:

```javascript
// In the createTokenOnChain function, there were missing closing braces for nested if statements and catch blocks
    }
  } catch (error) {
    console.error('❌ Error creating token:', error);
    
    // Extract detailed logs
    const logs = extractTransactionLogs(error);
    if (logs.length > 0) {
      console.error('📜 Transaction logs:', logs);
    }
    
    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('not initialized') || error.message.includes('AccountNotInitialized')) {
        if (onStepUpdate) {
          onStepUpdate('platform-check', 'failed', { 
            error: 'Platform not initialized. Please go to Admin page and initialize the platform first.',
            hint: 'Admin wallet is required for initialization'
          });
        }
      } else if (error.message.includes('insufficient funds')) {
        if (onStepUpdate) {
          onStepUpdate('wallet-approval', 'failed', { 
            error: 'Insufficient SOL balance for transaction fees. Please add SOL to your wallet.',
            hint: 'You can get free SOL from Solana devnet faucet'
          });
        }
      } else if (error.message.includes('User rejected')) {
        if (onStepUpdate) {
          onStepUpdate('wallet-approval', 'failed', { 
            error: 'Transaction rejected by user',
            hint: 'Please approve the transaction in your wallet'
          });
        }
      } else {
        if (onStepUpdate) {
          onStepUpdate('transaction-broadcast', 'failed', { 
            error: `Transaction failed: ${error.message}`,
            details: logs.join('\n')
          });
        }
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: logs
    };
  }
}
```

The main issue was missing closing braces for nested conditional blocks and catch statements in the createTokenOnChain function. I've added the required closing braces to properly close all code blocks.