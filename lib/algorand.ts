Here's the fixed version with all missing closing brackets added:

```javascript
    } catch (confirmError) {
      console.error(`❌ Transaction confirmation failed on ${network}:`, confirmError);
      throw new Error(`Transaction submitted but not confirmed on ${network}. Please check the explorer for transaction status. TX ID: ${txId}`);
    }
```

The main issue was a missing closing bracket for the try-catch block in the `createAlgorandToken` function. I've added it after the error handling code.

The rest of the file appears to be properly structured with matching brackets. The code should now compile and run correctly.