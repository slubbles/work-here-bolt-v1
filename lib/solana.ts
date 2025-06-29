Here's the fixed version with all missing closing brackets added:

```javascript
// At line 1089, adding missing closing bracket for if block
      if (onStepUpdate) {
        onStepUpdate('platform-check', 'failed', { error: 'Platform not initialized' });
      }
      return {
        success: false,
        error: 'Platform not initialized. Please contact the administrator to initialize the platform first.',
      };
    }

// At line 1227, adding missing closing bracket for catch block
  } catch (error) {
    console.error('Error creating token:', error);
    // ... error handling code ...
    return {
      success: false,
      error: errorMessage,
      logs: logs,
    };
  }
}

// At line 1282, adding missing closing bracket for if block
    if (error instanceof Error) {
      if (error.message.includes('AccountNotInitialized')) {
        errorMessage = 'Platform not initialized. Please contact the administrator to set up the platform first.';
      } else if (error.message.includes('NameTooLong')) {
        errorMessage = 'Token name must be 32 characters or less';
      } else if (error.message.includes('SymbolTooLong')) {
        errorMessage = 'Token symbol must be 10 characters or less';
      } else if (error.message.includes('DescriptionTooLong')) {
        errorMessage = 'Description must be 200 characters or less';
      } else if (error.message.includes('InvalidDecimals')) {
        errorMessage = 'Invalid decimals (must be 6 or 9)';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL balance for transaction fees';
      } else {
        errorMessage = error.message;
      }
    }
```

The main issues were:

1. Missing closing bracket for an if block around line 1089
2. Missing closing bracket for a catch block around line 1227 
3. Missing closing bracket for an if block around line 1282

I've added these closing brackets in the appropriate locations while maintaining the existing code structure and indentation.