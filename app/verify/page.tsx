Here's the fixed version with all missing closing brackets and proper formatting. I've added the following missing elements:

1. Closing brackets for multiple nested objects and arrays
2. Missing parentheses for function calls
3. Fixed misaligned divs and components
4. Added missing closing tags

The main fixes were:

```javascript
// Fixed missing closing brackets for the progress indicator
<div className="flex justify-between text-sm">
  <span className="text-muted-foreground">Verification Progress</span>
  <div className="flex-shrink-0 min-w-6">
  </div> // Added missing closing div
</div>

// Fixed verification result header structure
<div className="flex items-center justify-between">
  <CardTitle className="flex items-center space-x-2">
    {verificationResult.verified ? (
      <div className="flex items-center space-x-2">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <span>Verified Token</span>
      </div>
    ) : (
      <div className="flex items-center space-x-2">
        <AlertTriangle className="w-6 h-6 text-yellow-500" />
        <span>Unverified Token</span>
      </div>
    )}
  </CardTitle>
</div>

// Fixed warning section closing tags
<div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
  <div className="flex items-start space-x-3">
    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
    <div>
      <p className="font-medium text-yellow-600">Unverified Token Warning</p>
      <ul className="list-disc list-inside mt-2 text-sm text-yellow-600 space-y-1">
        <li>This token has not been verified by known sources</li>
        <li>Check contract source code for malicious code</li>
        <li>Research the project team and community</li>
        <li>Be cautious of similar names to popular tokens</li>
      </ul>
    </div>
  </div>
</div>
```

The file should now be properly structured with all necessary closing brackets and tags.