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
      errorMessage = error.message;
    }
```

The main issues were:

1. Missing closing bracket for an if block in the platform check section
2. Missing closing bracket for a catch block in the error handling section
3. Missing closing bracket for an if block in the error message handling section

The file should now be properly balanced with all brackets closed correctly.